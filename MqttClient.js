const MQTT = require('async-mqtt')
const RateLimiter = require('./RateLimiter')

function MqttClient(options, callbacksObj) {
  this.options = options
  this.client = null

  this.rater = new RateLimiter(
    [{ period: 60000, limit: 4, penalty: 0 }],
    (group) => {
      this.disconnect()
      console.log(
        'Too many connection attempts to the virtual smart home backend. Please try restarting your flows, Node-RED or even your entire system.'
      )
      setTimeout(
        () => this.handleOnError({ code: 'connection quota exhausted' }),
        2000
      )
    }
  )

  this.connect = function () {
    this.client = MQTT.connect('mqtts://' + this.options.host, this.options)

    this.client.on('connect', this.handleOnConnect.bind(this))
    this.client.on('close', this.handleOnDisconnect)
    this.client.on('offline', this.handleOnDisconnect)
    this.client.on('error', this.handleOnError)
    this.client.on('message', this.handleOnMessage)
  }

  this.handleOnConnect = function () {
    this.rater.execute('onConnect_group', () => callbacksObj['onConnect']())
  }

  this.handleOnDisconnect = function () {
    callbacksObj['onDisconnect']()
  }

  this.handleOnError = function (error) {
    callbacksObj['onError'](error)
  }

  this.handleOnMessage = function (topic, message, packet) {
    try {
      callbacksObj['onMessage'](topic, JSON.parse(message.toString()))
    } catch (e) {
      console.log(e)
    }
  }

  this.disconnect = async function () {
    try {
      await this.client.end()
      this.rater.destroy()
    } catch (e) {
      console.log(e)
    }
    return true
  }

  this.publish = async function (topic, json) {
    try {
      return await this.client.publish(topic, JSON.stringify(json), { qos: 1 })
    } catch (e) {
      console.log(e)
    }
  }

  this.subscribe = async function (topics) {
    try {
      const subscribeResult = await this.client.subscribe(topics, { qos: 1 })
      callbacksObj['onSubscribeSuccess'](subscribeResult)
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = MqttClient
