module.exports = function (RED) {
  function SwitchNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    const connectionNode = RED.nodes.getNode(config.connection)

    const sendMessage = function (msg) {
      this.send(msg)
    }

    if (connectionNode) {
      //connection is configured
      //register callbacks. This way connectionNode can update us:
      connectionNode.registerChildNode({
        nodeId: this.id,
        connect: () =>
          node.status({
            shape: 'dot',
            fill: 'green',
            text: 'online'
          }),
        disconnect: () =>
          node.status({
            shape: 'dot',
            fill: 'red',
            text: 'offline'
          }),
        error: error =>
          node.status({
            shape: 'ring',
            fill: 'red',
            text: error.code
          }),
        message: () => sendMessage(msg)
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
