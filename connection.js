const { Base64 } = require('js-base64')
const MqttClient = require('./MqttClient')
const VSH_VERSION = require('./version')

module.exports = function (RED) {
  function ConnectionNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    this.mqttClient = undefined
    this.childNodes = {}
    this.isConnected = false
    this.isSubscribed = false
    this.isError = false
    this.isKilled = false
    this.killedStatusText = 'KILLED'

    this.jobQueue = []

    this.jobQueueExecutor = setInterval(() => {
      this.jobQueue = this.jobQueue.filter(job => job() == false)
    }, 3000)

    this.execOrQueueJob = function (job) {
      if (job() == false) {
        this.jobQueue.push(job)
      }
    }

    this.registerChildNode = function (nodeId, callbacks) {
      if (Object.keys(this.childNodes).length == 0) {
        //first child node is registering!
        this.connectAndSubscribe()
      }

      this.childNodes[nodeId] = callbacks

      //immediately push most relevant state to new subscriber
      this.execCallbackForOne(nodeId, 'setStatus', {
        shape: 'dot',
        fill: this.isConnected ? 'green' : 'red',
        text: this.isConnected ? 'online' : 'offline'
      })

      const requestShadowJob = () => {
        if (!this.isSubscribed) {
          return false
        }

        this.requestShadowForNode(nodeId)
      }

      this.execOrQueueJob(requestShadowJob)
    }

    this.unregisterChildNode = function (nodeId) {
      console.log('UNREGISTERING CHILD NODE', nodeId)
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
        this.requestShadowForNode(nodeId)
      }
    }

    this.requestShadowForNode = function (nodeId) {
      this.mqttClient.publish(
        `$aws/things/${this.credentials.thingId}/shadow/name/${nodeId}/get`,
        {}
      )
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
        `$aws/things/${this.credentials.thingId}/shadow/name/${nodeId}/update`,
        payload
      )
    }

    this.discover = function (nodeId) {
      const { friendlyName, template } = this.execCallbackForOne(
        nodeId,
        'getDeviceConfig'
      )

      this.mqttClient.publish(`vsh/${this.credentials.thingId}/discover`, {
        deviceId: nodeId,
        friendlyName,
        template
      })
    }

    this.handleGetAccepted = function (nodeId, message) {
      if (message.state.reported) {
        const { friendlyName, template } = this.execCallbackForOne(
          nodeId,
          'getDeviceConfig'
        )

        if (message.state.reported.template !== template) {
          //device type (template) has changed! Invalidate shadow (will be recreated by handleDeleteAccepted())
          this.mqttClient.publish(
            `$aws/things/${this.credentials.thingId}/shadow/name/${nodeId}/delete`,
            {}
          )
        } else if (message.state.reported.friendlyName !== friendlyName) {
          //name has changed!
          this.updateShadow({ nodeId, type: 'reported' })
          this.discover(nodeId)
        } else {
          //override local state only if neither template nor name changed!
          this.execCallbackForOne(
            nodeId,
            'setLocalState',
            message.state.reported
          )
        }
      }
    }

    this.handleGetRejected = function (nodeId) {
      //shadow for the device does not yet exist! Let's create it:
      this.updateShadow({ nodeId, type: 'reported' })
      this.discover(nodeId)
    }

    this.handleUpdateAccepted = function (nodeId, message) {
      if (message.state.desired && !message.state.reported) {
        //update must have been initiated from Alexa!
        this.execCallbackForOne(nodeId, 'setLocalState', message.state.desired)
        this.execCallbackForOne(nodeId, 'emitLocalState')
        this.updateShadow({ nodeId, type: 'reported' })
      }
    }

    this.handleDeleteAccepted = function (nodeId) {
      //re-instantiate shadow from local state:
      this.updateShadow({ nodeId, type: 'reported' })
      this.discover(nodeId)
    }

    this.connectAndSubscribe = function () {
      if (!this.credentials.server) {
        return
      }

      const options = {
        host: this.credentials.server,
        port: config.port,
        key: Base64.decode(this.credentials.privateKey),
        cert: Base64.decode(this.credentials.cert),
        ca: Base64.decode(this.credentials.caCert),
        clientId: this.credentials.thingId,
        reconnectPeriod: 5000,
        keepalive: 90,
        rejectUnauthorized: false,
        will: {
          topic: `vsh/${this.credentials.thingId}/update`,
          payload: JSON.stringify({
            state: { reported: { connected: false } }
          }),
          qos: 1
        }
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

          this.mqttClient.publish(`vsh/${this.credentials.thingId}/update`, {
            state: {
              reported: {
                connected: true,
                vsh_version: VSH_VERSION,
                nr_version: RED.version()
              }
            }
          })
        },

        onDisconnect: () => {
          this.isConnected = false
          if (!this.isError) {
            this.execCallbackForAll('setStatus', {
              shape: 'dot',
              fill: 'red',
              text: this.isKilled ? this.killedStatusText : 'offline'
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

        onSubscribeSuccess: subscribeResult => {
          this.isSubscribed = true
        },

        onMessage: (topic, message) => {
          //find out which child node the message is for:
          const match = topic.match(/vshd-[^\/]+/)
          if (match) {
            const nodeId = match[0]

            //find out which action to perform:
            if (topic.includes('/get/accepted')) {
              this.handleGetAccepted(nodeId, message)
            } else if (topic.includes('/get/rejected')) {
              this.handleGetRejected(nodeId, message)
            } else if (topic.includes('/delete/accepted')) {
              this.handleDeleteAccepted(nodeId)
            } else if (topic.includes('/update/accepted')) {
              this.handleUpdateAccepted(nodeId, message)
            }
          } else if (topic == `vsh/${this.credentials.thingId}/kill`) {
            console.warn(
              'CONNECTION KILLED! Reason:',
              message.reason || 'undefined'
            )
            this.isKilled = true
            this.killedStatusText = message.reason ? message.reason : 'KILLED'
            this.disconnect()
          }
        }
      })

      this.mqttClient.connect()

      const topicsToSubscribe = [
        `$aws/things/${this.credentials.thingId}/shadow/name/+/delete/accepted`,
        `$aws/things/${this.credentials.thingId}/shadow/name/+/get/accepted`,
        `$aws/things/${this.credentials.thingId}/shadow/name/+/get/rejected`,
        `$aws/things/${this.credentials.thingId}/shadow/name/+/update/accepted`,
        `vsh/${this.credentials.thingId}/kill`
      ]

      this.mqttClient.subscribe(topicsToSubscribe)
    }

    this.disconnect = async function () {
      await this.mqttClient.publish(`vsh/${this.credentials.thingId}/update`, {
        state: { reported: { connected: false } }
      })
      await this.mqttClient.disconnect()
    }

    this.on('close', async function (removed, done) {
      clearInterval(this.jobQueueExecutor)
      try {
        await this.disconnect()
      } catch (e) {
        console.log(e)
      }

      this.execCallbackForAll('onDisconnect')
      done()
    })
  }

  RED.nodes.registerType('vsh-connection', ConnectionNode, {
    credentials: {
      refreshToken: { type: 'text' },
      accessToken: { type: 'text' },
      email: { type: 'text' },
      cert: { type: 'text' },
      thingId: { type: 'text' },
      caCert: { type: 'text' },
      server: { type: 'text' },
      privateKey: { type: 'text' }
    }
  })
}
