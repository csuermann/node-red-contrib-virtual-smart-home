const powerState = val => val == 'ON' || val == 'OFF'
const brightness = val => Number.isInteger(val) && val >= 0 && val <= 100
const colorTemperatureInKelvin = val =>
  Number.isInteger(val) && val >= 1000 && val <= 10000
const color = val => {
  if (!typeof val == 'object') {
    return false
  }

  if (
    !val.hasOwnProperty('hue') ||
    !val.hasOwnProperty('saturation') ||
    !val.hasOwnProperty('brightness')
  ) {
    return false
  }

  return (
    typeof val.hue == 'number' &&
    val.hue >= 0 &&
    val.hue <= 360 &&
    typeof val.saturation == 'number' &&
    val.saturation >= 0 &&
    val.saturation <= 1 &&
    typeof val.brightness == 'number' &&
    val.brightness >= 0 &&
    val.brightness <= 1
  )
}
const lightMode = val => val == 'hsb' || val == 'temp'
const position = val => val == 'Position.Up' || val == 'Position.Down'

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
  },
  COLOR_CHANGING_LIGHT_BULB: {
    defaultState: {
      source: 'device',
      powerState: 'OFF',
      brightness: 100,
      colorTemperatureInKelvin: 2200,
      lightMode: 'temp',
      color: { hue: 60, saturation: 1, brightness: 1 }
    },
    validators: {
      powerState,
      brightness,
      color,
      colorTemperatureInKelvin,
      lightMode
    }
  },
  DIMMER_SWITCH: {
    defaultState: {
      source: 'device',
      powerState: 'OFF',
      brightness: 100
    },
    validators: {
      powerState,
      brightness
    }
  },
  BLINDS: {
    defaultState: {
      source: 'device',
      mode: 'Position.Up',
      instance: 'Blinds.Position'
    },
    validators: {
      mode: position
    }
  },
  GARAGE_DOOR_OPENER: {
    defaultState: {
      source: 'device',
      mode: 'Position.Up',
      instance: 'GarageDoor.Position'
    },
    validators: {
      mode: position
    }
  }
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
