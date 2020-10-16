const convert = require('color-convert')

//---VALIDATORS---

const powerState = val => {
  const isValid = val == 'ON' || val == 'OFF'
  if (!isValid) {
    return false
  }
  return { key: 'powerState', value: val }
}

const brightness = val => {
  const isValid = Number.isInteger(val) && val >= 0 && val <= 100
  if (!isValid) {
    return false
  }
  return { key: 'brightness', value: val }
}

const colorTemperatureInKelvin = val => {
  const isValid = Number.isInteger(val) && val >= 1000 && val <= 10000
  if (!isValid) {
    return false
  }
  return { key: 'colorTemperatureInKelvin', value: val }
}

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

  const isValid =
    typeof val.hue == 'number' &&
    val.hue >= 0 &&
    val.hue <= 360 &&
    typeof val.saturation == 'number' &&
    val.saturation >= 0 &&
    val.saturation <= 1 &&
    typeof val.brightness == 'number' &&
    val.brightness >= 0 &&
    val.brightness <= 1

  if (!isValid) {
    return false
  }
  return {
    key: 'color',
    value: {
      hue: val.hue,
      saturation: val.saturation,
      brightness: val.brightness
    }
  }
}

const color_rgb = val => {
  if (!typeof val == 'array' || val.length !== 3) {
    return false
  }

  const isValid =
    Number.isInteger(val[0]) &&
    val[0] >= 0 &&
    val[0] <= 255 &&
    Number.isInteger(val[1]) &&
    val[1] >= 0 &&
    val[1] <= 255 &&
    Number.isInteger(val[2]) &&
    val[2] >= 0 &&
    val[2] <= 255

  if (!isValid) {
    return true
  }

  const hsb = convert.rgb.hsv(val)

  return {
    key: 'color',
    value: {
      hue: hsb[0],
      saturation: hsb[1] / 100,
      brightness: hsb[2] / 100
    }
  }
}

const color_cmyk = val => {
  if (!typeof val == 'array' || val.length !== 4) {
    return false
  }

  const isValid =
    Number.isInteger(val[0]) &&
    val[0] >= 0 &&
    val[0] <= 100 &&
    Number.isInteger(val[1]) &&
    val[1] >= 0 &&
    val[1] <= 100 &&
    Number.isInteger(val[2]) &&
    val[2] >= 0 &&
    val[2] <= 100 &&
    Number.isInteger(val[3]) &&
    val[3] >= 0 &&
    val[3] <= 100

  if (!isValid) {
    return true
  }

  const hsb = convert.cmyk.hsv(val)

  return {
    key: 'color',
    value: {
      hue: hsb[0],
      saturation: hsb[1] / 100,
      brightness: hsb[2] / 100
    }
  }
}

const color_hex = val => {
  if (!/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) {
    return false
  }

  const hsb = convert.hex.hsv(val)

  return {
    key: 'color',
    value: {
      hue: hsb[0],
      saturation: hsb[1] / 100,
      brightness: hsb[2] / 100
    }
  }
}

const lightMode = val => {
  const isValid = val == 'hsb' || val == 'temp'
  if (!isValid) {
    return false
  }
  return { key: 'lightMode', value: val }
}

const position = val => {
  const isValid = val == 'Position.Up' || val == 'Position.Down'
  if (!isValid) {
    return false
  }
  return { key: 'position', value: val }
}

//---DECORATORS---

const defaultDecorator = localState => {
  localState.name = localState.friendlyName
  localState.type = localState.template
  delete localState.friendlyName
  delete localState.template

  return localState
}

const colorChangingLightDecorator = localState => {
  localState = defaultDecorator(localState)

  localState['color_rgb'] = convert.hsv.rgb(
    localState.color.hue,
    localState.color.saturation * 100,
    localState.color.brightness * 100
  )

  localState['color_hex'] = convert.hsv.hex(
    localState.color.hue,
    localState.color.saturation * 100,
    localState.color.brightness * 100
  )

  localState['color_cmyk'] = convert.hsv.cmyk(
    localState.color.hue,
    localState.color.saturation * 100,
    localState.color.brightness * 100
  )

  return localState
}

//---TYPES---

const types = {
  SWITCH: {
    defaultState: {
      source: 'device',
      powerState: 'OFF'
    },
    validators: {
      powerState
    },
    decorator: defaultDecorator
  },
  PLUG: {
    defaultState: {
      source: 'device',
      powerState: 'OFF'
    },
    validators: {
      powerState
    },
    decorator: defaultDecorator
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
    },
    decorator: defaultDecorator
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
      colorTemperatureInKelvin,
      color_hex,
      color_rgb,
      color_cmyk,
      color,
      lightMode
    },
    decorator: colorChangingLightDecorator
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
    },
    decorator: defaultDecorator
  },
  BLINDS: {
    defaultState: {
      source: 'device',
      mode: 'Position.Up',
      instance: 'Blinds.Position'
    },
    validators: {
      mode: position
    },
    decorator: defaultDecorator
  },
  GARAGE_DOOR_OPENER: {
    defaultState: {
      source: 'device',
      mode: 'Position.Up',
      instance: 'GarageDoor.Position'
    },
    validators: {
      mode: position
    },
    decorator: defaultDecorator
  }
}

//---HELPERS---

function getValidators (template) {
  return types[template].validators
}

function getDecorator (template) {
  return types[template].decorator
}

function getDefaultState (template) {
  return types[template].defaultState
}

module.exports = {
  getValidators,
  getDecorator,
  getDefaultState
}
