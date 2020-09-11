const { Base64 } = require('js-base64')
const MqttClient = require('./MqttClient')

module.exports = function (RED) {
  function ConnectionNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    this.childNodeCallbacks = []
    this.isConnected = false
    this.isError = false

    this.registerChildNode = function (callbacks) {
      this.childNodeCallbacks.push(callbacks)

      //immediately push most relevant state to new subscriber
      this.informOneChildNode(
        callbacks.nodeId,
        this.isConnected ? 'connect' : 'disconnect'
      )
    }

    this.unregisterChildNode = function (nodeId) {
      this.childNodeCallbacks = this.childNodeCallbacks.filter(
        el => el.nodeId != nodeId
      )
    }

    this.informAllChildrenNodes = function (eventName, eventDetails) {
      this.childNodeCallbacks.forEach(cbElement => {
        if (cbElement[eventName]) {
          cbElement[eventName](eventDetails)
        }
      })
    }

    this.informOneChildNode = function (nodeId, eventName, eventDetails) {
      const foundCallbacks = this.childNodeCallbacks.filter(
        el => el.nodeId == nodeId
      )

      foundCallbacks.forEach(cbElement => {
        if (cbElement[eventName]) {
          cbElement[eventName](eventDetails)
        }
      })
    }

    if (config.server) {
      const options = {
        host: config.server,
        port: config.port,
        key: Base64.decode(this.credentials.privateKey),
        cert: Base64.decode(this.credentials.cert),
        ca: Base64.decode(config.caCert),
        clientId: config.thingId
      }

      this.mqttClient = new MqttClient(options, {
        connect: () => {
          this.isConnected = true
          this.isError = false
          this.informAllChildrenNodes('connect')
        },
        disconnect: () => {
          this.isConnected = false
          if (!this.isError) {
            this.informAllChildrenNodes('disconnect')
          }
        },
        error: error => {
          this.isConnected = false
          this.isError = true
          this.informAllChildrenNodes('error', error)
        }
      })

      this.mqttClient.connect()
    }

    this.on('close', async function (removed, done) {
      await this.mqttClient.disconnect()
      this.informAllChildrenNodes('disconnect')
      done()
    })
  }

  RED.nodes.registerType('vsh-connection', ConnectionNode, {
    credentials: {
      refreshToken: { type: 'text' },
      email: { type: 'text' },
      cert: { type: 'text' },
      privateKey: { type: 'text' }
    }
  })
}
