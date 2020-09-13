const baseNode = require('./baseNode')
const { powerState, brightness } = require('./validators')

module.exports = function (RED) {
  function DimmableLightBulbNode (config) {
    baseNode({
      RED,
      config,
      node: this,
      template: 'DIMMABLE_LIGHT_BULB',
      defaultState: {
        source: 'device',
        powerState: 'OFF',
        brightness: 100
      },
      validators: {
        powerState,
        brightness
      }
    })
  }

  RED.nodes.registerType('vsh-dimmable-light-bulb', DimmableLightBulbNode)
}
