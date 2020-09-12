const { Base64 } = require('js-base64')
const MqttClient = require('./MqttClient')

module.exports = function (RED) {
  function ConnectionNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    this.childNodes = {}
    this.isConnected = false
    this.isError = false

    this.registerChildNode = function (nodeId, callbacks) {
      this.childNodes[nodeId] = callbacks

      //immediately push most relevant state to new subscriber
      this.execCallbackForOne(nodeId, 'setStatus', {
        shape: 'dot',
        fill: this.isConnected ? 'green' : 'red',
        text: this.isConnected ? 'online' : 'offline'
      })
    }

    this.unregisterChildNode = function (nodeId) {
      delete this.childNodes[nodeId]
    }

    this.execCallbackForAll = function (eventName, eventDetails) {
      for (const nodeId in this.childNodes) {
        if (this.childNodes[nodeId][eventName]) {
          this.childNodes[nodeId][eventName](eventDetails)
        }
      }
    }

    this.execCallbackForOne = function (nodeId, eventName, eventDetails) {
      if (this.childNodes[nodeId][eventName]) {
        return this.childNodes[nodeId][eventName](eventDetails)
      }
    }

    this.requestShadowForAllChildNodes = function () {
      for (const nodeId in this.childNodes) {
        this.mqttClient.publish(
          `$aws/things/${config.thingId}/shadow/name/vshd-${nodeId}/get`,
          {}
        )
      }
    }

    this.updateShadow = function ({ nodeId, type }) {
      const localDeviceState = this.execCallbackForOne(nodeId, 'getLocalState')
      const payload = {
        state: { reported: localDeviceState }
      }

      if (type === 'desired') {
        payload.state['desired'] = localDeviceState
      }

      this.mqttClient.publish(
        `$aws/things/${config.thingId}/shadow/name/vshd-${nodeId}/update`,
        payload
      )
    }

    if (config.server) {
      const options = {
        host: config.server,
        port: config.port,
        key: Base64.decode(this.credentials.privateKey),
        cert: Base64.decode(this.credentials.cert),
        ca: Base64.decode(config.caCert),
        clientId: config.thingId,
        reconnectPeriod: 5000,
        keepalive: 90
      }

      this.mqttClient = new MqttClient(options, {
        onConnect: () => {
          this.isConnected = true
          this.isError = false
          this.execCallbackForAll('setStatus', {
            shape: 'dot',
            fill: 'green',
            text: 'online'
          })
        },
        onDisconnect: () => {
          this.isConnected = false
          if (!this.isError) {
            this.execCallbackForAll('setStatus', {
              shape: 'dot',
              fill: 'red',
              text: 'offline'
            })
          }
        },
        onError: error => {
          this.isConnected = false
          this.isError = true
          this.execCallbackForAll('setStatus', {
            shape: 'dot',
            fill: 'red',
            text: error.code
          })
        },
        onSubscribeSuccess: subscribeResult =>
          this.requestShadowForAllChildNodes(),
        onMessage: (topic, message) => {
          //find out which child node the message is for:
          const match = topic.match(/vshd-([^\/]+)/)
          if (match) {
            const nodeId = match[1]

            //find out which action to perform:
            if (topic.includes('/get/accepted')) {
              this.execCallbackForOne(
                nodeId,
                'setLocalState',
                message.state.reported
              )
            } else if (topic.includes('/get/rejected')) {
              //shadow for the device does not yet exist! Let's create it:
              this.updateShadow({ nodeId, type: 'reported' })
            } else if (topic.includes('/update/delta')) {
              this.execCallbackForOne(nodeId, 'setLocalState', message.state)
            }
          }
        }
      })

      this.mqttClient.connect()

      const topicsToSubscribe = [
        `$aws/things/${config.thingId}/shadow/name/+/get/accepted`,
        `$aws/things/${config.thingId}/shadow/name/+/get/rejected`,
        `$aws/things/${config.thingId}/shadow/name/+/update/delta`
      ]

      this.mqttClient.subscribe(topicsToSubscribe)
    }

    this.on('close', async function (removed, done) {
      await this.mqttClient.disconnect()
      this.execCallbackForAll('onDisconnect')
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
