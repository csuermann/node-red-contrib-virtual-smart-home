module.exports = function (RED) {
  function SwitchNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    const connectionNode = RED.nodes.getNode(config.connection)

    let localState = {
      source: 'device',
      powerState: 'OFF'
    }

    const sendMessage = function (msg) {
      node.send(msg)
    }

    if (connectionNode) {
      //connection is configured
      //register callbacks. This way connectionNode can communicate with us:
      connectionNode.registerChildNode(this.id.replace('.', ''), {
        setStatus: status => node.status(status),
        getLocalState: () => localState,
        setLocalState: state => {
          localState = { ...localState, ...state }
          const nodeContext = node.context()
          nodeContext.set('state', state)
        }
      })
    }

    node.on('input', function (msg, send, done) {
      msg.payload = 'blaaaa'
      send(msg)

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
