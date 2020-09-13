const baseNode = require('./baseNode')
const { powerState } = require('./validators')

module.exports = function (RED) {
  function PlugNode (config) {
    baseNode({
      RED,
      config,
      node: this,
      template: 'PLUG',
      defaultState: {
        source: 'device',
        powerState: 'OFF'
      },
      validators: {
        powerState
      }
    })
  }

  RED.nodes.registerType('vsh-plug', PlugNode)
}
