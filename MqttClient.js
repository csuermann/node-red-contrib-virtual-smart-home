const MQTT = require('async-mqtt')

function MqttClient (options, callbacksObj) {
  this.options = options
  this.client = null

  this.connect = function () {
    //this.options.host = 'xxx'
    this.client = MQTT.connect('mqtts://' + this.options.host, this.options)

    this.client.on('connect', this.handleOnConnect)
    this.client.on('close', this.handleOnDisconnect)
    this.client.on('error', this.handleOnError)
  }

  this.handleOnConnect = function () {
    callbacksObj['connect']()
  }

  this.handleOnDisconnect = function () {
    callbacksObj['disconnect']()
  }

  this.handleOnError = function (error) {
    callbacksObj['error'](error)
  }

  this.disconnect = async function () {
    await this.client.end()
    return true
  }

  this.publish = async function (topic, json) {
    return await this.client.publish(topic, JSON.stringify(json))
  }
}

module.exports = MqttClient
