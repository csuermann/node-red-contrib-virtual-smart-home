const MQTT = require('async-mqtt')

function MqttClient (options, callbacksObj) {
  this.options = options
  this.client = null

  this.connect = function () {
    this.client = MQTT.connect('mqtts://' + this.options.host, this.options)

    this.client.on('connect', this.handleOnConnect)
    this.client.on('close', this.handleOnDisconnect)
    this.client.on('error', this.handleOnError)
    this.client.on('message', this.handleOnMessage)
  }

  this.handleOnConnect = function () {
    try {
      callbacksObj['onConnect']()
    } catch (e) {
      console.log(e)
    }
  }

  this.handleOnDisconnect = function () {
    try {
      callbacksObj['onDisconnect']()
    } catch (e) {
      console.log(e)
    }
  }

  this.handleOnError = function (error) {
    try {
      callbacksObj['onError'](error)
    } catch (e) {
      console.log(e)
    }
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
