const merge = require('deepmerge')
const deepEql = require('deep-eql')
const {
  getValidators,
  getDecorator,
  getDefaultState,
} = require('./device-types')

module.exports = function (RED) {
  function VirtualDeviceNode(config) {
    RED.nodes.createNode(this, config)

    const that = this

    const deviceId = 'vshd-' + that.id.replace('.', '')

    const getConnectionNode = () => {
      return RED.nodes.getNode(config.connection)
    }

    const validators = getValidators(config.template)
    const decorator = getDecorator(config.template, config.diff)

    let isActive = false

    const getLocalState = () => {
      let contextState = that.context().get('state')

      if (!contextState) {
        contextState = getDefaultState(config.template)
      }

      return { ...contextState }
    }

    const setLocalState = (targetState) => {
      const oldLocalState = getLocalState()
      let newLocalState = merge(oldLocalState, targetState)

      that.context().set('state', newLocalState)

      return newLocalState
    }

    const emitLocalState = ({ topic = null, rawDirective = null }) => {
      let payload

      payload = decorator({
        localState: getLocalState(),
        template: config.template,
        friendlyName: config.name,
      })

      if (Object.keys(payload).length > 0) {
        const msg = {
          topic: topic ? topic : config.topic,
          metadata: JSON.parse(config.metadata ?? '{}'),
          payload,
        }

        if (rawDirective) {
          payload['rawDirective'] = rawDirective
        }

        that.send(msg)
      }
    }

    const validateState = (state) => {
      const approvedState = {}

      for (const key in state) {
        if (validators[key]) {
          let validatorResult = validators[key](state[key])

          if (false !== validatorResult) {
            approvedState[validatorResult.key] = validatorResult.value
          }
        }
      }

      return approvedState
    }

    if (getConnectionNode()) {
      //connection is configured
      //register callbacks. This way connectionNode can communicate with us:
      getConnectionNode().registerChildNode(deviceId, {
        setStatus: (status, force = false) => {
          if (isActive || force) {
            that.status(status)
          }
        },
        setActive: (isActiveToggle) => {
          isActive = isActiveToggle
        },
        isActive: () => isActive,
        getLocalState,
        setLocalState,
        emitLocalState,
        getDeviceConfig: () => {
          return {
            friendlyName: config.name || config.template.toLowerCase(),
            template: config.template,
            retrievable: config.retrievable,
          }
        },
      })
    }

    that.on('input', function (msg, send, done) {
      if (!getConnectionNode() || !isActive) {
        console.log(
          `ignoring inbound msg for non-active device ID ${deviceId}'`
        )
        if (done) {
          done()
        }
        return
      }

      const ignoreBecauseOfNameFilter =
        config.filter && msg.payload.name !== config.name
      if (ignoreBecauseOfNameFilter) {
        if (done) {
          done()
        }
        console.log(
          `ignoring inbound msg for device ID ${deviceId} because msg.payload.name (${
            msg.payload.name ? `'${msg.payload.name}'` : '<undefined>'
          }) does not match '${config.name}'`
        )
        return
      }

      const ignoreBecauseOfTopicFilter =
        config.filterTopic && msg.topic !== config.topic
      if (ignoreBecauseOfTopicFilter) {
        if (done) {
          done()
        }
        console.log(
          `ignoring inbound msg for device ID ${deviceId} because msg.topic (${
            msg.topic ? `'${msg.topic}'` : '<undefined>'
          }) does not match '${config.topic}'`
        )
        return
      }

      const oldLocalState = getLocalState()
      const approvedState = validateState(msg.payload)
      approvedState['directive'] = 'OverrideLocalState'
      const mergedState = merge(oldLocalState, approvedState)
      const newLocalState = { ...mergedState, source: 'device' }
      const confirmedNewLocalState = setLocalState(newLocalState)

      if (!deepEql(oldLocalState, newLocalState)) {
        getConnectionNode().handleLocalDeviceStateChange({
          deviceId,
          oldState: oldLocalState,
          newState: confirmedNewLocalState,
        })
      }

      if (config.passthrough && Object.keys(approvedState).length > 0) {
        emitLocalState({ topic: msg.topic })
      }

      if (done) {
        done()
      }
    })

    that.on('close', async function (_removed, done) {
      if (getConnectionNode()) {
        await getConnectionNode().unregisterChildNode(deviceId)
      }
      that.status({})
      return done()
    })
  }

  RED.nodes.registerType('vsh-virtual-device', VirtualDeviceNode)
}
