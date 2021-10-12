const convert = require('color-convert')

//---VALIDATORS---

const wrapValidator = (validatorFn, outputStateKey) => {
  return (val) => {
    const validationResult = validatorFn(val)

    if (!validationResult) {
      return false
    }

    return { key: outputStateKey, value: validationResult.value }
  }
}

const booleanValidator = (val) => {
  const isValid = val === true || val === false
  if (!isValid) {
    return false
  }
  return { key: 'boolean', value: val }
}

const powerState = (val) => {
  const isValid = val == 'ON' || val == 'OFF'
  if (!isValid) {
    return false
  }
  return { key: 'powerState', value: val }
}

const lockState = (val) => {
  const isValid = val == 'LOCKED' || val == 'UNLOCKED' || val == 'JAMMED'
  if (!isValid) {
    return false
  }
  return { key: 'lockState', value: val }
}

const brightness = (val) => {
  const isValid = Number.isInteger(val) && val >= 0 && val <= 100
  if (!isValid) {
    return false
  }
  return { key: 'brightness', value: val }
}

const detectionState = (val) => {
  const isValid = val == 'DETECTED' || val == 'NOT_DETECTED'
  if (!isValid) {
    return false
  }
  return { key: 'detectionState', value: val }
}

const percentage = (val) => {
  const isValid = Number.isInteger(val) && val >= 0 && val <= 100
  if (!isValid) {
    return false
  }
  return { key: 'percentage', value: val }
}

const speed = (val) => {
  const isValid = Number.isInteger(val) && val >= 1 && val <= 10
  if (!isValid) {
    return false
  }
  return { key: 'speed', value: val }
}

const channel = (val) => {
  const isValid = Number.isInteger(val) && val >= 1 && val <= 999
  if (!isValid) {
    return false
  }
  return {
    key: 'channel',
    value: val,
  }
}

const colorTemperatureInKelvin = (val) => {
  const isValid = Number.isInteger(val) && val >= 1000 && val <= 10000
  if (!isValid) {
    return false
  }
  return { key: 'colorTemperatureInKelvin', value: val }
}

const color = (val) => {
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
      brightness: val.brightness,
    },
  }
}

const color_rgb = (val) => {
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
      brightness: hsb[2] / 100,
    },
  }
}

const color_cmyk = (val) => {
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
      brightness: hsb[2] / 100,
    },
  }
}

const color_hex = (val) => {
  const match = `${val}`.match(/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)

  if (!match) {
    return false
  }

  const hsb = convert.hex.hsv(match[1])

  return {
    key: 'color',
    value: {
      hue: hsb[0],
      saturation: hsb[1] / 100,
      brightness: hsb[2] / 100,
    },
  }
}

const color_xyz = (val) => {
  if (!typeof val == 'array' || val.length !== 3) {
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
    val[2] <= 100

  if (!isValid) {
    return false
  }

  const hsb = convert.xyz.hsv([val[0], val[1], val[2]])

  return {
    key: 'color',
    value: {
      hue: hsb[0],
      saturation: hsb[1] / 100,
      brightness: hsb[2] / 100,
    },
  }
}

const color_lab = (val) => {
  if (!typeof val == 'array' || val.length !== 3) {
    return false
  }

  const isValid =
    Number.isInteger(val[0]) &&
    val[0] >= -100 &&
    val[0] <= 100 &&
    Number.isInteger(val[1]) &&
    val[1] >= -100 &&
    val[1] <= 100 &&
    Number.isInteger(val[2]) &&
    val[2] >= -100 &&
    val[2] <= 100

  if (!isValid) {
    return false
  }

  const hsb = convert.lab.hsv([val[0], val[1], val[2]])

  return {
    key: 'color',
    value: {
      hue: hsb[0],
      saturation: hsb[1] / 100,
      brightness: hsb[2] / 100,
    },
  }
}

const input = (val) => {
  const inputs = [
    'AUX 1',
    'AUX 2',
    'AUX 3',
    'BLURAY',
    'CABLE',
    'CD',
    'COAX 1',
    'COAX 2',
    'COMPOSITE 1',
    'DVD',
    'GAME',
    'HD RADIO',
    'HDMI 1',
    'HDMI 2',
    'HDMI 3',
    'HDMI ARC',
    'INPUT 1',
    'INPUT 2',
    'INPUT 3',
    'IPOD',
    'LINE 1',
    'LINE 2',
    'LINE 3',
    'MEDIA PLAYER',
    'OPTICAL 1',
    'OPTICAL 2',
    'PHONO',
    'PLAYSTATION',
    'PLAYSTATION 3',
    'PLAYSTATION 4',
    'SATELLITE',
    'SMARTCAST',
    'TUNER',
    'TV',
    'USB DAC',
    'VIDEO 1',
    'VIDEO 2',
    'VIDEO 3',
    'XBOX',
  ]

  if (inputs.indexOf(val) == -1) {
    return false
  }

  return { key: 'input', value: val }
}

const lightMode = (val) => {
  const isValid = val == 'hsb' || val == 'temp'
  if (!isValid) {
    return false
  }
  return { key: 'lightMode', value: val }
}

const position = (val) => {
  const isValid = val == 'Position.Up' || val == 'Position.Down'
  if (!isValid) {
    return false
  }
  return { key: 'position', value: val }
}

const temperatureValue = (val) => {
  const floatValue = Number.parseFloat(val)
  const isValid = floatValue !== NaN
  if (!isValid) {
    return false
  }
  return { key: 'temperature', value: Math.round(floatValue * 10) / 10 } //23.456789 --> 23.4
}

const temperatureScale = (val) => {
  const isValid = val === 'CELSIUS' || val === 'FAHRENHEIT' || val === 'KELVIN'
  if (!isValid) {
    return false
  }
  return { key: 'scale', value: val }
}

const thermostatMode = (val) => {
  const isValid =
    val === 'AUTO' ||
    val === 'HEAT' ||
    val === 'COOL' ||
    val === 'ECO' ||
    val === 'OFF'
  if (!isValid) {
    return false
  }
  return { key: 'thermostatMode', value: val }
}

//---DECORATORS---

const diffDecoratorFactory = (anotherDecorator) => {
  const directiveToAttributesMap = {
    TurnOn: ['powerState'],
    TurnOff: ['powerState'],
    AdjustBrightness: ['brightness'],
    SetBrightness: ['brightness'],
    SetColor: [
      'color',
      'lightMode',
      'color_rgb',
      'color_hex',
      'color_cmyk',
      'color_lab',
      'color_xyz',
    ],
    SetColorTemperature: ['colorTemperatureInKelvin', 'lightMode'],
    IncreaseColorTemperature: ['colorTemperatureInKelvin', 'lightMode'],
    DecreaseColorTemperature: ['colorTemperatureInKelvin', 'lightMode'],
    SetPercentage: ['percentage'],
    Lock: ['lockState'],
    Unlock: ['lockState'],
    SetMode: ['mode', 'instance'],
    AdjustRangeValue: ['speed'],
    SetRangeValue: ['speed'],
    Activate: ['isActivated'],
    Deactivate: ['isActivated'],
    SetTargetTemperature: ['targetTemperature', 'targetScale'],
    AdjustTargetTemperature: ['targetTemperature', 'targetScale'],
  }

  return (decoratorParams) => {
    const decoratedState = anotherDecorator(decoratorParams)
    const directive =
      decoratorParams.localState.directive || 'OverrideLocalState'

    if (!directiveToAttributesMap[directive]) {
      return decoratedState
    }

    const attribsToKeep = [
      'directive',
      'name',
      'source',
      ...directiveToAttributesMap[directive],
    ]

    return attribsToKeep.reduce((acc, attrib) => {
      acc[attrib] = decoratedState[attrib]
      return acc
    }, {})
  }
}

const defaultDecorator = ({
  localState,
  template,
  friendlyName,
  isPassthrough = false,
}) => {
  localState.name = friendlyName
  localState.type = template

  delete localState.template

  if (isPassthrough) {
    delete localState.directive
  }

  return localState
}

const colorChangingLightDecorator = ({
  localState,
  template,
  friendlyName,
  isPassthrough = false,
}) => {
  localState = defaultDecorator({
    localState,
    template,
    friendlyName,
    isPassthrough,
  })

  localState['color_rgb'] = convert.hsv.rgb(
    localState.color.hue,
    localState.color.saturation * 100,
    localState.color.brightness * 100
  )

  localState['color_hex'] =
    '#' +
    convert.hsv.hex(
      localState.color.hue,
      localState.color.saturation * 100,
      localState.color.brightness * 100
    )

  localState['color_cmyk'] = convert.hsv.cmyk(
    localState.color.hue,
    localState.color.saturation * 100,
    localState.color.brightness * 100
  )

  localState['color_lab'] = convert.hsv.lab(
    localState.color.hue,
    localState.color.saturation * 100,
    localState.color.brightness * 100
  )

  localState['color_xyz'] = convert.hsv.xyz(
    localState.color.hue,
    localState.color.saturation * 100,
    localState.color.brightness * 100
  )

  localState['color_xy'] = (function (red, green, blue) {
    //apply a gamma correction to the RGB values, which makes the color more vivid and more the like the color displayed on the screen of your device
    red =
      red > 0.04045 ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : red / 12.92
    green =
      green > 0.04045
        ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4)
        : green / 12.92
    blue =
      blue > 0.04045
        ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4)
        : blue / 12.92

    //RGB values to XYZ using the Wide RGB D65 conversion formula
    var X = red * 0.664511 + green * 0.154324 + blue * 0.162028
    var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685
    var Z = red * 0.000088 + green * 0.07231 + blue * 0.986039

    //Calculate the xy values from the XYZ values
    let x = X / (X + Y + Z)
    let y = Y / (X + Y + Z)

    x = isNaN(x) ? 0 : x
    y = isNaN(y) ? 0 : y

    return [x, y]
  })(
    localState['color_rgb'][0],
    localState['color_rgb'][1],
    localState['color_rgb'][2]
  )

  return localState
}

//---TYPES---

const types = {
  BLINDS: {
    defaultState: {
      percentage: 100,
    },
    validators: {
      percentage,
    },
    decorator: defaultDecorator,
  },
  COLOR_CHANGING_LIGHT_BULB: {
    defaultState: {
      powerState: 'OFF',
      brightness: 100,
      colorTemperatureInKelvin: 2200,
      lightMode: 'temp',
      color: { hue: 60, saturation: 1, brightness: 1 },
    },
    validators: {
      powerState,
      brightness,
      colorTemperatureInKelvin,
      color_hex: wrapValidator(color_hex, 'color'),
      color_rgb: wrapValidator(color_rgb, 'color'),
      color_cmyk: wrapValidator(color_cmyk, 'color'),
      color_lab: wrapValidator(color_lab, 'color'),
      color_xyz: wrapValidator(color_xyz, 'color'),
      color,
      lightMode,
    },
    decorator: colorChangingLightDecorator,
  },
  CONTACT_SENSOR: {
    defaultState: {
      detectionState: 'NOT_DETECTED',
    },
    validators: {
      detectionState,
    },
    decorator: defaultDecorator,
  },
  DIMMABLE_LIGHT_BULB: {
    defaultState: {
      powerState: 'OFF',
      brightness: 100,
    },
    validators: {
      powerState,
      brightness,
    },
    decorator: defaultDecorator,
  },
  DIMMER_SWITCH: {
    defaultState: {
      powerState: 'OFF',
      brightness: 100,
    },
    validators: {
      powerState,
      brightness,
    },
    decorator: defaultDecorator,
  },
  DOORBELL_EVENT_SOURCE: {
    defaultState: {
      detectionState: 'NOT_DETECTED',
    },
    validators: {
      detectionState,
    },
    decorator: defaultDecorator,
  },
  ENTERTAINMENT_DEVICE: {
    defaultState: {
      powerState: 'OFF',
      input: 'TV',
      channel: 1,
      volume: 50,
      muted: false,
    },
    validators: {
      powerState,
      input,
      channel,
      volume: wrapValidator(percentage, 'volume'),
      muted: wrapValidator(booleanValidator, 'muted'),
    },
    decorator: defaultDecorator,
  },
  FAN: {
    defaultState: {
      powerState: 'OFF',
      speed: 1,
    },
    validators: {
      powerState,
      speed,
    },
    decorator: defaultDecorator,
  },
  GARAGE_DOOR_OPENER: {
    defaultState: {
      mode: 'Position.Up',
      instance: 'GarageDoor.Position',
    },
    validators: {
      mode: wrapValidator(position, 'mode'),
    },
    decorator: defaultDecorator,
  },
  LOCK: {
    defaultState: {
      lockState: 'UNLOCKED',
    },
    validators: {
      lockState,
    },
    decorator: defaultDecorator,
  },
  MOTION_SENSOR: {
    defaultState: {
      detectionState: 'NOT_DETECTED',
    },
    validators: {
      detectionState,
    },
    decorator: defaultDecorator,
  },
  PLUG: {
    defaultState: {
      powerState: 'OFF',
    },
    validators: {
      powerState,
    },
    decorator: defaultDecorator,
  },
  SCENE: {
    defaultState: {
      isActivated: false,
    },
    validators: {},
    decorator: defaultDecorator,
  },
  SWITCH: {
    defaultState: {
      powerState: 'OFF',
    },
    validators: {
      powerState,
    },
    decorator: defaultDecorator,
  },
  TEMPERATURE_SENSOR: {
    defaultState: {
      temperature: 0,
      scale: 'CELSIUS',
    },
    validators: {
      temperature: temperatureValue,
      scale: temperatureScale,
    },
    decorator: defaultDecorator,
  },
  THERMOSTAT: {
    defaultState: {
      temperature: 0,
      scale: 'CELSIUS',
      targetTemperature: 0,
      targetScale: 'CELSIUS',
      thermostatMode: 'OFF',
      powerState: 'OFF',
    },
    validators: {
      temperature: temperatureValue,
      scale: temperatureScale,
      thermostatMode,
      targetTemperature: wrapValidator(temperatureValue, 'targetTemperature'),
      targetScale: wrapValidator(temperatureScale, 'targetScale'),
      powerState,
    },
    decorator: defaultDecorator,
  },
}

//---HELPERS---

function getValidators(template) {
  return types[template].validators
}

function getDecorator(template, isDiffEnabled) {
  const decorator = types[template].decorator

  if (isDiffEnabled) {
    return diffDecoratorFactory(decorator)
  } else {
    return decorator
  }
}

function getDefaultState(template) {
  const defaultState = types[template].defaultState
  defaultState['template'] = template
  defaultState['source'] = 'alexa'
  return defaultState
}

module.exports = {
  getValidators,
  getDecorator,
  getDefaultState,
}
