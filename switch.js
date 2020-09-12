module.exports = function (RED) {
  function SwitchNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    const nodeId = 'vshd-' + this.id.replace('.', '')

    const connectionNode = RED.nodes.getNode(config.connection)

    let localState = {
      source: 'device',
      powerState: 'OFF'
    }

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

    if (connectionNode) {
      //connection is configured
      //register callbacks. This way connectionNode can communicate with us:
      connectionNode.registerChildNode(nodeId, {
        setStatus: status => node.status(status),
        getLocalState,
        setLocalState,
        getDeviceConfig: () => {
          return {
            friendlyName: config.name || 'switch',
            template: 'SWITCH'
          }
        },
        emitMessage: msg => {
          node.send(msg)
        }
      })
    }

    node.on('input', function (msg, send, done) {
      setLocalState({ ...msg.payload, source: 'device' })

      const updatedState = getLocalState()

      connectionNode.updateShadow({ nodeId, type: 'desired' })

      if (config.passthrough) {
        send({ payload: updatedState })
      }

      if (done) {
        done()
      }
    })

    this.on('close', function (removed, done) {
      if (connectionNode) {
        connectionNode.unregisterChildNode(this.id)
      }
      this.status({})
      done()
    })
  }

  RED.nodes.registerType('vsh-switch', SwitchNode)
}
