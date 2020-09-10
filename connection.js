module.exports = function (RED) {
  function ConnectionNode (config) {
    RED.nodes.createNode(this, config)

    const node = this
  }

  RED.nodes.registerType('vsh-connection', ConnectionNode, {
    credentials: {
      refreshToken: { type: 'text' },
      email: { type: 'text' },
      cert: { type: 'text' },
      privateKey: { type: 'text' }
    }
  })
}
