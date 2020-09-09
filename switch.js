module.exports = function (RED) {
  function SwitchNode (config) {
    RED.nodes.createNode(this, config)

    var node = this

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
