module.exports = function ({
  RED,
  config,
  node,
  template,
  defaultState: localState,
  validators
}) {
  RED.nodes.createNode(node, config)

  const nodeId = 'vshd-' + node.id.replace('.', '')

  const connectionNode = RED.nodes.getNode(config.connection)

  const sendMessage = function (msg) {
    node.send(msg)
  }

  const getLocalState = function () {
    return localState
  }

  const setLocalState = function (state) {
    localState = { ...localState, ...state }
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
          friendlyName: config.name || template.toLowerCase(),
          template
        }
      },
      emitMessage: msg => {
        node.send(msg)
      }
    })
  }

  node.on('input', function (msg, send, done) {
    const approvedState = validateState(msg.payload)
    console.log('approved state', approvedState)
    setLocalState({ ...approvedState, source: 'device' })

    const updatedState = getLocalState()

    connectionNode.updateShadow({ nodeId, type: 'desired' })

    if (config.passthrough) {
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
