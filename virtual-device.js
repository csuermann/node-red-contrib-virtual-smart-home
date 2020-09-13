const merge = require('deepmerge')
const { getValidators, getDefaultState } = require('./device-types')

module.exports = function (RED) {
  function VirtualDeviceNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    const nodeId = 'vshd-' + node.id.replace('.', '')

    const connectionNode = RED.nodes.getNode(config.connection)

    let localState = getDefaultState(config.template)
    localState['template'] = config.template
    localState['friendlyName'] = config.name || config.template.toLowerCase()

    const validators = getValidators(config.template)

    const sendMessage = function (msg) {
      node.send(msg)
    }

    const getLocalState = function () {
      return localState
    }

    const setLocalState = function (state) {
      localState = merge(localState, state)
      const nodeContext = node.context()
      nodeContext.set('state', localState)
    }

    const validateState = function (state) {
      const approvedState = {}

      for (const key in state) {
        if (validators[key]) {
          if (validators[key](state[key])) {
            approvedState[key] = state[key]
          }
        }
      }

      return approvedState
    }

    if (connectionNode) {
      //connection is configured
      //register callbacks. This way connectionNode can communicate with us:
      connectionNode.registerChildNode(nodeId, {
        setStatus: status => node.status(status),
        getLocalState,
        setLocalState,
        getDeviceConfig: () => {
          return {
            friendlyName: config.name || config.template.toLowerCase(),
            template: config.template
          }
        },
        emitMessage: msg => {
          node.send(msg)
        }
      })
    }

    node.on('input', function (msg, send, done) {
      const approvedState = validateState(msg.payload)
      const mergedState = merge(getLocalState(), approvedState)

      setLocalState({ ...mergedState, source: 'device' })

      const updatedState = getLocalState()
      delete updatedState.friendlyName
      delete updatedState.template

      connectionNode.updateShadow({ nodeId, type: 'desired' })

      if (config.passthrough && Object.keys(approvedState).length > 0) {
        send({ payload: updatedState })
      }

      if (done) {
        done()
      }
    })

    node.on('close', function (removed, done) {
      if (connectionNode) {
        connectionNode.unregisterChildNode(node.id)
      }
      node.status({})
      done()
    })
  }

  RED.nodes.registerType('vsh-virtual-device', VirtualDeviceNode)
}
