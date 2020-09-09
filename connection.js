module.exports = function (RED) {
  function ConnectionNode (config) {
    RED.nodes.createNode(this, config)

    const node = this
  }
  RED.nodes.registerType('vsh-connection', ConnectionNode)
}
