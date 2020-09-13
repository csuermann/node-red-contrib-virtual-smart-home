const powerState = val => val == 'ON' || val == 'OFF'
const brightness = val => Number.isInteger(val) && val >= 0 && val <= 100

const types = {
  SWITCH: {
    defaultState: {
      source: 'device',
      powerState: 'OFF'
    },
    validators: {
      powerState
    }
  },
  PLUG: {
    defaultState: {
      source: 'device',
      powerState: 'OFF'
    },
    validators: {
      powerState
    }
  },
  DIMMABLE_LIGHT_BULB: {
    defaultState: {
      source: 'device',
      powerState: 'OFF',
      brightness: 100
    },
    validators: {
      powerState,
      brightness
    }
  }

  //::TODO:: support more types
  // COLOR_CHANGING_LIGHT_BULB
  // DIMMER_SWITCH
  // BLINDS
  // GARAGE_DOOR_OPENER
  // LOCK
}

function getValidators (template) {
  return types[template].validators
}

function getDefaultState (template) {
  return types[template].defaultState
}

module.exports = {
  getValidators,
  getDefaultState
}
