const axios = require('axios')
const Buffer = require('buffer').Buffer
const debounce = require('debounce')
const throttle = require('./throttle')
const semver = require('semver')
const MqttClient = require('./MqttClient')
const MsgRateLimiter = require('./MsgRateLimiter')
const VSH_VERSION = require('./version')
const {
  buildNewStateForDirectiveRequest,
  buildPropertiesFromState,
  annotateChanges,
} = require('./directives')

function decodeBase64(str) {
  return Buffer.from(str, 'base64').toString('utf-8')
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = function (RED) {
  RED.httpAdmin.get(
    `/vsh-connection/:nodeId`,
    RED.auth.needsPermission('vsh-virtual-device.read'),
    (req, res) => {
      const connectionNode = RED.nodes.getNode(req.params.nodeId)
      res.json({ plan: connectionNode?.getPlan() ?? 'unknown' })
    }
  )

  class ConnectionNode {
    credentials = undefined
    config = undefined
    plan = 'unknown'
    logger = undefined
    rater = undefined
    mqttClient = undefined
    childNodes = {}
    isDisconnecting = false
    isSubscribed = false
    isInitializing = false
    isError = false
    errorCode = ''
    isKilled = false
    killedStatusText = 'KILLED'
    allowedDeviceCount = 200
    userIdToken = ''
    stats = {
      lastStartup: new Date().getTime(),
      connectionCount: 0,
      inboundMsgCount: 0,
      outboundMsgCount: 0,
    }
    jobQueue = []
    jobQueueExecutor = undefined

    constructor(config) {
      this.config = config

      RED.nodes.createNode(this, config)

      this.logger = this.config.debug
        ? (logMessage, variable = undefined, logLevel = 'log') => {
            //logLevel: log | warn | error | trace | debug
            if (variable) {
              logMessage = logMessage + ': ' + JSON.stringify(variable)
            }
            this[logLevel](logMessage)
          }
        : (_logMessage, _variable) => {}

      this.rater = new MsgRateLimiter(this.logger)

      this.jobQueueExecutor = setInterval(() => {
        this.jobQueue = this.jobQueue.filter((job) => job() == false)
      }, 1000)

      this.on('close', async (_removed, done) => {
        await this.rater.destroy()

        if (!this.credentials.thingId) {
          return done()
        }

        clearInterval(this.jobQueueExecutor)

        try {
          await this.disconnect()
        } catch (e) {
          this.logger('connection.js:this:on:close::', e, 'error')
        }

        this.execCallbackForAll('onDisconnect')
        done()
      })
    }

    isConnected() {
      return this.mqttClient && this.mqttClient.isConnected()
    }

    isReconnecting() {
      return this.mqttClient && this.mqttClient.isReconnecting()
    }

    setPlan(newPlan) {
      this.plan = newPlan
    }

    getPlan() {
      return this.plan
    }

    execOrQueueJob(job) {
      if (job() == false) {
        this.jobQueue.push(job)
      }
    }

    refreshChildrenNodeStatus(statusText = null) {
      let fill, text

      if (this.isError) {
        fill = 'red'
        text = this.errorCode
      } else if (this.isKilled) {
        fill = 'red'
        text = this.killedStatusText
      } else if (this.isInitializing) {
        fill = 'yellow'
        text = 'Initializing...'
      } else if (statusText === 'Reconnecting...') {
        fill = 'yellow'
        text = statusText
      } else if (this.isConnected()) {
        fill = 'green'
        text = 'Online'
      } else if (this.isReconnecting()) {
        fill = 'red'
        text = 'Disconnected. Periodically retrying...'
      } else {
        fill = 'red'
        text = 'Offline'
      }

      this.execCallbackForAllThrottled('setStatus', {
        shape: 'dot',
        fill,
        text,
      })
    }

    registerChildNode(nodeId, callbacks) {
      if (Object.keys(this.childNodes).length >= this.allowedDeviceCount) {
        callbacks.setActive(false)
        callbacks.setStatus(
          {
            shape: 'dot',
            fill: 'gray',
            text: 'Device limit reached! Upgrade your VSH subscription to get more devices!',
          },
          true //force!
        )
      } else {
        callbacks.setActive(true)
      }

      this.childNodes[nodeId] = callbacks

      if (Object.keys(this.childNodes).length == 1) {
        //first child node is registering!
        this.connectAndSubscribe()
      }

      const requestConfigJob = () => {
        if (!this.isSubscribed) {
          return false
        }

        this.requestConfigDebounced()
      }

      this.execOrQueueJob(requestConfigJob)
    }

    async unregisterChildNode(nodeId) {
      delete this.childNodes[nodeId]

      if (Object.keys(this.childNodes).length == 0) {
        //last child node is unregistering!
        await this.disconnect()
      }
    }

    getLocalDevices() {
      const localDevices = {}

      for (const nodeId in this.childNodes) {
        localDevices[nodeId] = this.childNodes[nodeId].getDeviceConfig()
      }

      return localDevices
    }

    execCallbackForAll(eventName, eventDetails) {
      const result = {}
      for (const nodeId in this.childNodes) {
        if (this.childNodes[nodeId][eventName]) {
          result[nodeId] = this.childNodes[nodeId][eventName](eventDetails)
        }
      }
      return result
    }

    execCallbackForAllThrottled = throttle(this.execCallbackForAll, 1000)

    execCallbackForOne(nodeId, eventName, params, ...moreParams) {
      if (this.childNodes[nodeId][eventName]) {
        return this.childNodes[nodeId][eventName](params, ...moreParams)
      }
    }

    requestConfig() {
      this.isInitializing = true
      this.refreshChildrenNodeStatus()
      this.publish(`vsh/${this.credentials.thingId}/requestConfig`, {
        vshVersion: VSH_VERSION,
      })
    }

    requestConfigDebounced = debounce(this.requestConfig, 1000)

    markShadowAsConnected() {
      if (!this.isConnected()) {
        this.logger(
          `skipping markShadowAsConnected() because isConnected() is false`
        )
        return false
      }

      this.publish(`$aws/things/${this.credentials.thingId}/shadow/update`, {
        state: {
          reported: {
            connected: true,
            vsh_version: VSH_VERSION,
            nr_version: RED.version(),
          },
        },
      })
    }

    markShadowAsConnectedDebounced = debounce(
      this.markShadowAsConnected,
      7000,
      {
        immediate: true,
      }
    )

    async markShadowAsDisconnected() {
      return await this.publish(
        `$aws/things/${this.credentials.thingId}/shadow/update`,
        {
          state: { reported: { connected: false } },
        }
      )
    }

    async publish(topic, message) {
      if (!this.mqttClient) {
        return
      }

      this.stats.outboundMsgCount++

      this.logger(`MQTT: publish to topic ${topic}`, message)

      return await this.mqttClient.publish(topic, message)
    }

    triggerChangeReport({
      template,
      endpointId,
      properties,
      causeType,
      correlationToken = '',
    }) {
      const changes = properties.filter((prop) => prop.changed).length

      if (changes == 0 && causeType == 'PHYSICAL_INTERACTION') {
        this.logger(`skipping ChangeReport - no properties changed`)
        return
      }

      const publishCb = (doneCb) => {
        if (!this.isDisconnecting) {
          this.publish(`vsh/${this.credentials.thingId}/changeReport`, {
            template,
            endpointId,
            properties,
            correlationToken,
            causeType,
            vshVersion: VSH_VERSION,
            userIdToken: this.userIdToken,
          })
        }
        doneCb()
      }

      const classification = { causeType, template, endpointId }
      this.rater.execute(classification, publishCb.bind(this))
    }

    bulkDiscover(devices, mode = 'discover') {
      const payload = { devices: [] }

      for (const deviceId in devices) {
        if (devices[deviceId] !== null) {
          payload['devices'].push({
            deviceId,
            friendlyName: devices[deviceId]['friendlyName'],
            template: devices[deviceId]['template'],
            retrievable: devices[deviceId]['retrievable'],
          })
        }
      }

      if (payload.devices.length > 0) {
        this.publish(`vsh/${this.credentials.thingId}/bulk${mode}`, payload)
      }
    }

    handleGetAccepted(message) {
      const localDevices = this.getLocalDevices()
      const shadowDevices =
        (message.state.reported && message.state.reported.devices) || {}

      const toBeDiscoveredDevices = {}

      for (const deviceId in localDevices) {
        if (
          !shadowDevices.hasOwnProperty(deviceId) ||
          shadowDevices[deviceId]['template'] !==
            localDevices[deviceId]['template'] ||
          shadowDevices[deviceId]['friendlyName'] !==
            localDevices[deviceId]['friendlyName'] ||
          shadowDevices[deviceId]['retrievable'] !==
            localDevices[deviceId]['retrievable']
        ) {
          toBeDiscoveredDevices[deviceId] = localDevices[deviceId]
        }
      }

      const toBeUndiscoveredDevices = {}

      for (const deviceId in shadowDevices) {
        if (!localDevices.hasOwnProperty(deviceId)) {
          toBeUndiscoveredDevices[deviceId] = shadowDevices[deviceId]
          toBeDiscoveredDevices[deviceId] = null
        }
      }

      if (Object.keys(toBeDiscoveredDevices).length > 0) {
        this.publish(`$aws/things/${this.credentials.thingId}/shadow/update`, {
          state: { reported: { devices: toBeDiscoveredDevices } },
        })

        this.bulkDiscover(toBeDiscoveredDevices)
      }

      this.bulkDiscover(toBeUndiscoveredDevices, 'undiscover')
    }

    handleLocalDeviceStateChange({ deviceId, oldState, newState }) {
      const oldProperties = buildPropertiesFromState(oldState)
      let newProperties = buildPropertiesFromState(newState)

      // annotate whether properties changed or not
      newProperties = annotateChanges(newProperties, oldProperties)

      // tell Alexa about new device properties
      this.triggerChangeReport({
        template: newState.template,
        endpointId: deviceId,
        properties: newProperties,
        causeType: 'PHYSICAL_INTERACTION',
      })
    }

    handleReportState(deviceId, directiveRequest) {
      // EXAMPLE directiveRequest:
      // {
      //   directive: {
      //     header: {
      //       namespace: 'Alexa',
      //       name: 'ReportState',
      //       payloadVersion: '3',
      //       correlationToken: 'AAAAAAAAAQAwOfXmbhm...',
      //     },
      //     endpoint: {
      //       endpointId: 'vshd-xxxxxxxxxxxxx',
      //     },
      //     payload: {},
      //   },
      // }
      const isActive = this.execCallbackForOne(deviceId, 'isActive')

      if (!isActive) {
        this.logger(
          `ignoring handleReportState for non-active device ID ${deviceId}`,
          null,
          'warn'
        )
        return
      }

      const currentState = this.execCallbackForOne(deviceId, 'getLocalState')

      if (!currentState) {
        this.logger(
          `no local state found for device ID ${deviceId}`,
          null,
          'warn'
        )
        return
      }

      const currentProperties = buildPropertiesFromState(currentState).map(
        (prop) => {
          prop['changed'] = false
          return prop
        }
      )

      this.triggerChangeReport({
        template: currentState.template,
        endpointId: deviceId,
        properties: currentProperties,
        causeType: 'STATE_REPORT',
        correlationToken: directiveRequest.directive.header.correlationToken,
      })
    }

    handleDirectiveFromAlexa(deviceId, directiveRequest) {
      // EXAMPLE directiveRequest:
      // {
      //   directive: {
      //     header: {
      //       namespace: 'Alexa.PowerController',
      //       name: 'TurnOn',
      //       payloadVersion: '3',
      //       correlationToken: 'AAAAAAAAAQAwOfXmbhm...',
      //     },
      //     endpoint: {
      //       endpointId: 'vshd-xxxxxxxxxxxxx',
      //     },
      //     payload: {},
      //   },
      // }
      const isActive = this.execCallbackForOne(deviceId, 'isActive')

      if (!isActive) {
        // this.logger(
        //   `ignoring handleDirectiveFromAlexa for non-active device ID ${deviceId}`,
        //   null,
        //   'warn'
        // )
        return
      }

      // get current device state
      const oldState = this.execCallbackForOne(deviceId, 'getLocalState')

      if (!oldState) {
        this.logger(
          `no local state found for device ID ${deviceId}`,
          null,
          'warn'
        )
        return
      }

      // memorize old properties so that we can find out what changed
      const oldProperties = buildPropertiesFromState(oldState)

      // apply directive to local device state
      try {
        const newState = buildNewStateForDirectiveRequest(
          directiveRequest,
          oldState
        )

        // update local device state
        const newConfirmedState = this.execCallbackForOne(
          deviceId,
          'setLocalState',
          newState
        )

        // emit msg obj
        this.execCallbackForOne(deviceId, 'emitLocalState', {
          rawDirective: directiveRequest,
        })

        let newProperties = buildPropertiesFromState(newConfirmedState)

        // annotate whether properties changed or not
        newProperties = annotateChanges(newProperties, oldProperties)

        // tell Alexa about new device properties
        this.triggerChangeReport({
          template: oldState.template,
          endpointId: deviceId,
          properties: newProperties,
          causeType: 'VOICE_INTERACTION',
          correlationToken: directiveRequest.directive.header.correlationToken,
        })
      } catch (e) {
        this.logger(e.message, null, 'error')
        return
      }
    }

    handlePing({ semverExpr }) {
      if (!semver.satisfies(VSH_VERSION, semverExpr)) {
        return
      }

      this.publish(`vsh/${this.credentials.thingId}/pong`, {
        thingId: this.credentials.thingId,
        email: this.credentials.email,
        vsh_version: VSH_VERSION,
        nr_version: RED.version(),
        secondsSinceStartup: Math.floor(
          (new Date().getTime() - this.stats.lastStartup) / 1000
        ),
        ...this.stats,
        deviceCount: Object.keys(this.childNodes).length,
        devices: this.execCallbackForAll('getDeviceConfig'),
      })
    }

    handleOverrideConfig(message) {
      this.publish(`$aws/things/${this.credentials.thingId}/shadow/get`, {})

      if (message.msgRateLimiter) {
        const config = message.msgRateLimiter
        this.rater.overrideConfig(config)
      }

      if (message.userIdToken) {
        this.userIdToken = message.userIdToken
      }

      this.allowedDeviceCount = message.allowedDeviceCount
      this.disableUnallowedDevices(message.allowedDeviceCount)

      this.setPlan(message.plan)

      this.isInitializing = false
      this.refreshChildrenNodeStatus()
    }

    handleRestart({ semverExpr }) {
      if (semverExpr && !semver.satisfies(VSH_VERSION, semverExpr)) {
        return
      }

      this.logger('RECEIVED REQUEST TO RESTART VSH...')

      this.disconnect()

      this.execCallbackForAll('setActive', true)

      setTimeout(() => {
        this.connectAndSubscribe()
        const requestConfigJob = () => {
          if (!this.isSubscribed) {
            return false
          }
          this.requestConfigDebounced()
        }
        this.execOrQueueJob(requestConfigJob)
      }, 5000)
    }

    handleKill({ reason, semverExpr }) {
      if (semverExpr && !semver.satisfies(VSH_VERSION, semverExpr)) {
        return
      }

      this.logger(
        'CONNECTION KILLED! Reason:',
        reason || 'undefined',
        null,
        'warn'
      )
      this.isKilled = true
      this.killedStatusText = reason ? reason : 'KILLED'
      this.isInitializing = false
      this.disconnect()
    }

    handleSetDeviceStatus({ status, color, devices }) {
      devices.forEach((deviceId) => {
        this.execCallbackForOne(deviceId, 'setStatus', {
          shape: 'dot',
          fill: color,
          text: status,
        })
      })
    }

    handleService(message) {
      switch (message.operation) {
        case 'ping':
          this.handlePing(message)
          break
        case 'overrideConfig':
          this.handleOverrideConfig(message)
          break
        case 'restart':
          this.handleRestart(message)
          break
        case 'kill':
          this.handleKill(message)
          break
        case 'setDeviceStatus':
          this.handleSetDeviceStatus(message)
          break
        default:
          this.logger(
            `received service request (${message.operation}) that is not supported by this VSH version. Updating to the latest version might fix this!`,
            null,
            'warn'
          )
      }
    }

    async checkVersion() {
      let response

      try {
        response = await axios.get(
          `${
            this.config.backendUrl
          }/check_version?version=${VSH_VERSION}&nr_version=${RED.version()}&thingId=${
            this.credentials.thingId
          }`
        )

        // EXAMPLE response.data:
        // {
        //   "isAllowedVersion": false,
        //   "isLatestVersion": false,
        //   "updateHint": "Please update to the latest version of VSH!",
        //   "allowedDeviceCount": 5,
        // }
        return response.data
      } catch (error) {
        this.logger('checkVersion() failed', error, 'error')
        throw new Error(
          `HTTP Error Response: ${response.status || 'n/a'} ${
            response.statusText || 'n/a'
          }`
        )
      }
    }

    disableUnallowedDevices(allowedDeviceCount) {
      let i = 0

      for (const nodeId in this.childNodes) {
        i++
        if (i > allowedDeviceCount) {
          this.execCallbackForOne(nodeId, 'setActive', false)
          this.execCallbackForOne(
            nodeId,
            'setStatus',
            {
              shape: 'dot',
              fill: 'gray',
              text: 'Device limit reached! Upgrade your VSH subscription to get more devices!',
            },
            true //force
          )
        }
      }
    }

    async connectAndSubscribe() {
      if (!this.credentials.server) {
        return
      }

      try {
        const { isAllowedVersion, isLatestVersion, updateHint } =
          await this.checkVersion()

        if (!isLatestVersion) {
          this.logger(
            `A newer version of VSH is available! Please update to ensure compatibility`,
            null,
            'warn'
          )
        }

        if (!isAllowedVersion) {
          this.logger(
            `connection to backend refused: ${updateHint}`,
            null,
            'error'
          )
          this.errorCode = updateHint
          this.isError = true
          this.refreshChildrenNodeStatus()
          return
        }
      } catch (e) {
        this.errorCode = 'version check failed'
        this.isError = true
        this.refreshChildrenNodeStatus()
        return this.logger(`version check failed! ${e.message}`, null, 'error')
      }

      this.isDisconnecting = false

      const options = {
        host: this.credentials.server,
        port: this.config.port,
        key: decodeBase64(this.credentials.privateKey),
        cert: decodeBase64(this.credentials.cert),
        ca: decodeBase64(this.credentials.caCert),
        clientId: this.credentials.thingId,
        will: {
          topic: `vsh/${this.credentials.thingId}/update`,
          payload: JSON.stringify({
            state: { reported: { connected: false } },
          }),
          qos: 1,
        },
      }

      this.mqttClient = new MqttClient(options)

      // register event listeners:

      this.mqttClient.on('connect', (_conAck) => {
        this.stats.connectionCount++
        this.logger(
          `MQTT: connected to ${options.host}:${options.port}, connection #${this.stats.connectionCount}`
        )
        this.isError = false
        this.refreshChildrenNodeStatus()

        // if (!this.isSubscribed) {
        const topicsToSubscribe = [
          `$aws/things/${this.credentials.thingId}/shadow/get/accepted`,
          `vsh/${this.credentials.thingId}/+/directive`,
          `vsh/service`,
          `vsh/version/${VSH_VERSION}/+`,
          `vsh/${this.credentials.thingId}/service`,
        ]

        this.logger('MQTT: subscribe to topics', topicsToSubscribe)

        this.mqttClient.subscribe(topicsToSubscribe).catch((error) => {
          this.logger('MQTT: subscription failed', error, 'error')
        })
        // }

        this.markShadowAsConnectedDebounced()
      })

      this.mqttClient.on('offline', () => {
        this.logger('MQTT: connection offline')
        this.refreshChildrenNodeStatus()
      })

      this.mqttClient.on('close', () => {
        this.logger('MQTT: connection closed')
        this.isSubscribed = false
        this.refreshChildrenNodeStatus()
      })

      this.mqttClient.on('reconnect', () => {
        this.logger('MQTT: reconnecting...')
        this.refreshChildrenNodeStatus('Reconnecting...')
      })

      this.mqttClient.on('error', (error) => {
        this.isError = true
        this.errorCode = error.code
        this.refreshChildrenNodeStatus()
      })

      this.mqttClient.on('message', (topic, message) => {
        this.logger(`MQTT: message received on topic ${topic}`, message)
        this.stats.inboundMsgCount++
        switch (topic) {
          case `$aws/things/${this.credentials.thingId}/shadow/get/accepted`:
            this.handleGetAccepted(message)
            break
          case `vsh/service`:
          case `vsh/version/${VSH_VERSION}/service`:
          case `vsh/${this.credentials.thingId}/service`:
            this.handleService(message)
            break
          default:
            const match = topic.match(/vshd-[^\/]+/)
            if (match) {
              const deviceId = match[0]

              if (topic.includes('/directive')) {
                if (message.directive.header.name == 'ReportState') {
                  this.handleReportState(deviceId, message)
                } else {
                  this.handleDirectiveFromAlexa(deviceId, message)
                }
              } else {
                this.logger(
                  'received device-related message that is not supported yet!',
                  { topic, message },
                  null,
                  'warn'
                )
              }
            } else {
              this.logger(
                'received thing-related message that is not supported yet!',
                { topic, message },
                null,
                'warn'
              )
            }
        }
      })

      this.mqttClient.on('subscribed', (_subscriptions) => {
        this.isSubscribed = true
      })

      this.logger(
        `MQTT: attempting connection: ${options.host}:${options.port} (clientId: ${options.clientId})`
      )

      this.mqttClient.connect()
    }

    async disconnect() {
      if (this.isDisconnecting) {
        return
      }

      this.logger('MQTT: disconnecting')

      this.isDisconnecting = true

      if (this.isConnected()) {
        // publish() will block forever when not connected. Use of Promise.race() as an additional precaution
        await Promise.race([this.markShadowAsDisconnected(), timeout(1000)])
      }

      if (this.mqttClient) {
        await this.mqttClient.end()
        this.mqttClient = null
      }

      this.isSubscribed = false
      this.isInitializing = false
      this.isError = false
    }
  }

  RED.nodes.registerType('vsh-connection', ConnectionNode, {
    credentials: {
      vshJwt: { type: 'text' },
      refreshToken: { type: 'text' },
      accessToken: { type: 'text' },
      email: { type: 'text' },
      cert: { type: 'text' },
      thingId: { type: 'text' },
      caCert: { type: 'text' },
      server: { type: 'text' },
      privateKey: { type: 'text' },
    },
    settings: {
      vshConnectionShowSettings: {
        //= RED.settings.vshConnectionShowSettings
        value: false,
        exportable: true,
      },
      vshConnectionDefaultBackendUrl: {
        //= RED.settings.vshConnectionDefaultBackendUrl
        value: 'https://kfd5m4a21f.execute-api.eu-west-1.amazonaws.com/dev',
        exportable: true,
      },
      vshConnectionDefaultLwaClientId: {
        //= RED.settings.vshConnectionDefaultLwaClientId
        value: 'amzn1.application-oa2-client.3f1bb07133854b078261ad43f2484c18',
        exportable: true,
      },
    },
  })
}
