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

    const node = this

    const deviceId = 'vshd-' + node.id.replace('.', '')

    const connectionNode = RED.nodes.getNode(config.connection)

    let localState = getDefaultState(config.template)

    const validators = getValidators(config.template)
    const decorator = getDecorator(config.template, config.diff)

    let isIncomingMsgProcessingAllowed = true

    const getLocalState = () => ({ ...localState })

    const setLocalState = (targetState) => {
      const oldLocalState = getLocalState()
      localState = merge(oldLocalState, targetState)
      const decoratedOldState = decorator({
        localState: oldLocalState,
        template: config.template,
        friendlyName: config.name,
      })

      node.context().set('state', localState)

      return localState
    }

    const emitLocalState = () => {
      let payload

      payload = decorator({
        localState: getLocalState(),
        template: config.template,
        friendlyName: config.name,
      })

      if (Object.keys(payload).length > 0) {
        const msg = {
          topic: config.topic,
          payload,
        }
        node.send(msg)
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

    if (connectionNode) {
      //connection is configured
      //register callbacks. This way connectionNode can communicate with us:
      connectionNode.registerChildNode(deviceId, {
        setStatus: (status) => node.status(status),
        getLocalState,
        setLocalState,
        emitLocalState,
        getDeviceConfig: () => {
          return {
            friendlyName: config.name || config.template.toLowerCase(),
            template: config.template,
          }
        },
      })
    }

    node.on('input', function (msg, send, done) {
      if (config.filter && msg.payload.name !== config.name) {
        if (done) {
          done()
        }
        console.log(
          `ignoring inbound msg because msg.payload.name (${
            msg.payload.name ? `'${msg.payload.name}'` : '<undefined>'
          }) does not match '${config.name}'`
        )
        return
      }

      const oldLocalState = getLocalState()
      const approvedState = validateState(msg.payload)
      approvedState['directive'] = 'OverrideLocalState'
      const mergedState = merge(oldLocalState, approvedState)
      const newLocalState = { ...mergedState, source: 'device' }
      const confirmedNewLocalState = setLocalState(newLocalState)

      if (
        isIncomingMsgProcessingAllowed &&
        !deepEql(oldLocalState, newLocalState)
      ) {
        connectionNode.updateShadow({
          state: confirmedNewLocalState,
          deviceId,
          type: 'desired',
        })
      }

      if (config.passthrough && Object.keys(approvedState).length > 0) {
        emitLocalState()
      }

      if (done) {
        done()
      }
    })

    node.on('close', async function (removed, done) {
      if (connectionNode) {
        await connectionNode.unregisterChildNode(deviceId)
      }
      node.status({})
      return done()
    })
  }

  RED.nodes.registerType('vsh-virtual-device', VirtualDeviceNode)
}
