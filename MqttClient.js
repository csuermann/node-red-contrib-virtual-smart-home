const MQTT = require('async-mqtt')
var Bottleneck = require('bottleneck')

const globalLmiter = new Bottleneck({
  highWater: 50,
  reservoir: 40, // initial value
  reservoirIncreaseAmount: 2,
  reservoirIncreaseInterval: 10000, // must be divisible by 250
  reservoirIncreaseMaximum: 40,
  strategy: Bottleneck.strategy.LEAK,

  // also use maxConcurrent and/or minTime for safety
  maxConcurrent: 5,
  minTime: 250
})

// globalLmiter.on('debug', function (message, data) {
//   // Useful to figure out what the limiter is doing in real time
//   // and to help debug your application
//   const now = new Date()
//   console.log(
//     `${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()} :: ${message}`
//   )
// })

function MqttClient (options, callbacksObj) {
  this.options = options
  this.client = null
  this.limiter = new Bottleneck({
    highWater: 50,
    reservoir: 40, // initial value
    reservoirIncreaseAmount: 2,
    reservoirIncreaseInterval: 10000, // must be divisible by 250
    reservoirIncreaseMaximum: 40,
    strategy: Bottleneck.strategy.LEAK,

    // also use maxConcurrent and/or minTime for safety
    maxConcurrent: 5,
    minTime: 250
  })

  this.limiter.chain(globalLmiter)

  this.connect = function () {
    this.client = MQTT.connect('mqtts://' + this.options.host, this.options)

    this.client.on('connect', this.handleOnConnect)
    this.client.on('close', this.handleOnDisconnect)
    this.client.on('offline', this.handleOnDisconnect)
    this.client.on('error', this.handleOnError)
    this.client.on('message', this.handleOnMessage)
  }

  this.handleOnConnect = function () {
    callbacksObj['onConnect']()
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
      await this.limiter.stop()
      await this.client.end()
    } catch (e) {
      console.log(e)
    }
    return true
  }

  this.publish = async function (topic, json) {
    try {
      //return await this.client.publish(topic, JSON.stringify(json), { qos: 1 })
      return await this.limiter.schedule(() =>
        this.client.publish(topic, JSON.stringify(json), { qos: 1 })
      )
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
