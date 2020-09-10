module.exports = function (RED) {
  function SwitchNode (config) {
    RED.nodes.createNode(this, config)

    const node = this

    this.connectionNode = RED.nodes.getNode(config.connection)

    if (this.connectionNode) {
      //connection is configured
      console.dir(this.connectionNode)
    } else {
      //no connection configured
    }

    node.on('input', function (msg, send, done) {
      msg.payload = msg.payload.toLowerCase()
      send(msg)

      if (done) {
        done()
      }
    })
  }
  RED.nodes.registerType('vsh-switch', SwitchNode)
}
