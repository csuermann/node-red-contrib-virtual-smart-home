'use strict'

const deepEql = require('deep-eql')

const directives = {
  TurnOn: (_request, currentState) => {
    const newState = { powerState: 'ON' }

    if (
      currentState.template === 'COLOR_CHANGING_LIGHT_BULB' ||
      currentState.template === 'DIMMABLE_LIGHT_BULB' ||
      currentState.template === 'DIMMER_SWITCH'
    ) {
      newState['brightness'] =
        currentState.brightness === 0 ? 100 : currentState.brightness
    }

    return newState
  },
  TurnOff: (_request, _currentState) => ({ powerState: 'OFF' }),
  SetBrightness: (request, _currentState) => ({
    brightness: request.directive.payload.brightness,
    powerState: request.directive.payload.brightness > 0 ? 'ON' : 'OFF',
  }),
  ChangeChannel: (request, _currentState) => ({
    channel: request.directive.payload.channel.number
      ? parseInt(request.directive.payload.channel.number)
      : 1,
  }),
  Play: (_request, currentState) => {
    return currentState
  },
  Pause: (_request, currentState) => {
    return currentState
  },
  Stop: (_request, currentState) => {
    return currentState
  },
  StartOver: (_request, currentState) => {
    return currentState
  },
  Previous: (_request, currentState) => {
    return currentState
  },
  Next: (_request, currentState) => {
    return currentState
  },
  Rewind: (_request, currentState) => {
    return currentState
  },
  FastForward: (_request, currentState) => {
    return currentState
  },
  SkipChannels: (request, currentState) => {
    let newChannel =
      currentState.channel + request.directive.payload.channelCount
    return {
      channel: newChannel <= 1 ? 999 : newChannel % 999,
    }
  },
  SetPercentage: (request, currentState) => {
    const newState = { percentage: request.directive.payload.percentage }

    if (currentState.template === 'BLINDS') {
      newState['instance'] = 'Blinds.Position'
      newState['mode'] =
        request.directive.payload.percentage == 100
          ? 'Position.Up'
          : 'Position.Down'
    }
    return newState
  },
  SetVolume: (request, _currentState) => ({
    volume: request.directive.payload.volume,
  }),
  AdjustVolume: (request, currentState) => {
    let newVolume = currentState.volume + request.directive.payload.volume
    if (newVolume < 0) {
      newVolume = 0
    } else if (newVolume > 100) {
      newVolume = 100
    }
    return {
      volume: newVolume,
    }
  },
  SetMute: (request, _currentState) => ({
    muted: request.directive.payload.mute,
  }),
  AdjustBrightness: (request, currentState) => {
    let newBrightness =
      currentState.brightness + request.directive.payload.brightnessDelta
    if (newBrightness < 0) {
      newBrightness = 0
    } else if (newBrightness > 100) {
      newBrightness = 100
    }
    return {
      brightness: newBrightness,
      powerState: newBrightness > 0 ? 'ON' : 'OFF',
    }
  },
  SetColor: (request, _currentState) => ({
    color: request.directive.payload.color,
    lightMode: 'hsb',
    powerState: 'ON',
  }),
  SetColorTemperature: (request, _currentState) => ({
    colorTemperatureInKelvin:
      request.directive.payload.colorTemperatureInKelvin,
    lightMode: 'temp',
    powerState: 'ON',
  }),
  IncreaseColorTemperature: (_request, currentState) => {
    const currentTemp = currentState.colorTemperatureInKelvin
    const supportedTemps = [
      2200, // warm, warm white
      2700, // incandescent, soft white
      4000, // white
      5500, // daylight, daylight white
      7000, // cool, cool white
    ]
    const newTemp = supportedTemps.find((t) => t > currentTemp) || 10000
    return {
      colorTemperatureInKelvin: newTemp,
      lightMode: 'temp',
    }
  },
  DecreaseColorTemperature: (_request, currentState) => {
    const currentTemp = currentState.colorTemperatureInKelvin
    const supportedTemps = [
      2200, // warm, warm white
      2700, // incandescent, soft white
      4000, // white
      5500, // daylight, daylight white
      7000, // cool, cool white
    ]
    const newTemp = supportedTemps.find((t) => t < currentTemp) || 1000
    return {
      colorTemperatureInKelvin: newTemp,
      lightMode: 'temp',
    }
  },
  Lock: (_request, _currentState) => ({
    lockState: 'LOCKED',
  }),
  Unlock: (_request, _currentState) => ({
    lockState: 'UNLOCKED',
  }),
  SetMode: (request, currentState) => {
    const newState = {
      mode: request.directive.payload.mode,
      instance: request.directive.header.instance,
    }
    if (currentState.template === 'BLINDS') {
      newState['percentage'] =
        request.directive.payload.mode === 'Position.Up' ? 100 : 0
    }
    return newState
  },
  Activate: (_request, _currentState) => ({
    isActivated: true,
  }),
  Deactivate: (_request, _currentState) => ({
    isActivated: false,
  }),
  AdjustTargetTemperature: (request, currentState) => ({
    targetTemperature:
      currentState.targetTemperature +
      request.directive.payload.targetSetpointDelta.value,
  }),
  SelectInput: (request, _currentState) => ({
    input: request.directive.payload.input,
  }),
  SetTargetTemperature: (request, _currentState) => ({
    targetTemperature: request.directive.payload.targetSetpoint.value,
    targetScale: request.directive.payload.targetSetpoint.scale,
    powerState: 'ON',
  }),
  SetThermostatMode: (request, _currentState) => {
    const newState = {
      thermostatMode: request.directive.payload.thermostatMode.value,
    }
    if (
      request.directive.payload.thermostatMode.value === 'COOL' ||
      request.directive.payload.thermostatMode.value === 'HEAT' ||
      request.directive.payload.thermostatMode.value === 'ECO'
    ) {
      newState['powerState'] = 'ON'
    } else if (request.directive.payload.thermostatMode.value === 'OFF') {
      newState['powerState'] = 'OFF'
    }
    return newState
  },
  AdjustRangeValue: (request, currentState) => {
    if (currentState.template === 'FAN') {
      const currentSpeed = currentState.speed
      let newSpeed = currentSpeed + request.directive.payload.rangeValueDelta
      if (newSpeed < 0) {
        newSpeed = 0
      } else if (newSpeed > 10) {
        newSpeed = 10
      }
      return {
        speed: newSpeed,
        powerState: newSpeed > 0 ? 'ON' : 'OFF',
      }
    } else if (currentState.template === 'BLINDS') {
      let newPercentage =
        currentState.percentage + request.directive.payload.rangeValueDelta
      if (newPercentage < 0) {
        newPercentage = 0
      } else if (newPercentage > 100) {
        newPercentage = 100
      }
      return {
        percentage: newPercentage,
      }
    }
  },
  SetRangeValue: (request, currentState) => {
    if (currentState.template === 'FAN') {
      return {
        speed: request.directive.payload.rangeValue,
        powerState: request.directive.payload.rangeValue > 0 ? 'ON' : 'OFF',
      }
    } else if (currentState.template === 'BLINDS') {
      return {
        percentage: request.directive.payload.rangeValue,
        mode:
          request.directive.payload.rangeValue == 100
            ? 'Position.Up'
            : 'Position.Down',
      }
    } else {
      return {}
    }
  },
}

function makeProperty(namespace, name, value, instance = null) {
  const property = {
    namespace,
    name,
    value,
  }

  if (instance) {
    property.instance = instance
  }

  return property
}

function annotateChanges(newProperties, oldProperties) {
  return newProperties.map((newProp) => {
    const foundOldProp = oldProperties.find(
      (oldProp) => oldProp.namespace === newProp.namespace
    )

    newProp['changed'] =
      !foundOldProp || !deepEql(foundOldProp.value, newProp.value)

    return newProp
  })
}

function buildNewStateForDirectiveRequest(request, currentState) {
  const directiveName = request.directive.header.name

  if (!directives[directiveName]) {
    throw new Error(`unsupported directive ${directiveName}`)
  }

  const newState = directives[directiveName](request, currentState)

  newState['directive'] = directiveName
  newState['source'] = 'alexa'

  return newState
}

function buildPropertiesFromState(state) {
  const properties = []

  if (state.hasOwnProperty('brightness')) {
    properties.push(
      makeProperty('Alexa.BrightnessController', 'brightness', state.brightness)
    )
  }

  if (state.hasOwnProperty('detectionState')) {
    const namespaceMap = {
      CONTACT_SENSOR: 'Alexa.ContactSensor',
      MOTION_SENSOR: 'Alexa.MotionSensor',
      DOORBELL_EVENT_SOURCE: 'Alexa.DoorbellEventSource',
    }

    properties.push(
      makeProperty(
        namespaceMap[state.template],
        'detectionState',
        state.detectionState
      )
    )
  }

  if (state.hasOwnProperty('channel')) {
    properties.push(
      makeProperty('Alexa.ChannelController', 'channel', {
        number: `${state.channel}`, //must be string
      })
    )
  }

  if (state.hasOwnProperty('color') && state.lightMode == 'hsb') {
    properties.push(
      makeProperty('Alexa.ColorController', 'color', {
        hue: state.color.hue,
        saturation: state.color.saturation,
        brightness: state.color.brightness,
      })
    )
  }

  if (
    state.hasOwnProperty('colorTemperatureInKelvin') &&
    state.lightMode == 'temp'
  ) {
    properties.push(
      makeProperty(
        'Alexa.ColorTemperatureController',
        'colorTemperatureInKelvin',
        state.colorTemperatureInKelvin
      )
    )
  }

  if (state.hasOwnProperty('input')) {
    properties.push(makeProperty('Alexa.InputController', 'input', state.input))
  }

  if (state.hasOwnProperty('lockState')) {
    properties.push(
      makeProperty('Alexa.LockController', 'lockState', state.lockState)
    )
  }

  if (state.hasOwnProperty('mode')) {
    properties.push(
      makeProperty('Alexa.ModeController', 'mode', state.mode, state.instance)
    )
  }

  if (state.hasOwnProperty('thermostatMode')) {
    properties.push(
      makeProperty(
        'Alexa.ThermostatController',
        'thermostatMode',
        state.thermostatMode
      )
    )
  }

  if (state.hasOwnProperty('muted')) {
    properties.push(
      makeProperty('Alexa.Speaker', 'muted', {
        muted: state.muted,
      })
    )
  }

  if (state.hasOwnProperty('percentage')) {
    properties.push(
      makeProperty(
        'Alexa.RangeController',
        'rangeValue',
        state.percentage,
        'Blind.Lift'
      )
    )

    if (state.template === 'BLINDS') {
      properties.push(
        makeProperty(
          'Alexa.ModeController',
          'mode',
          state.percentage == 100 ? 'Position.Up' : 'Position.Down',
          'Blinds.Position'
        )
      )
    }
  }

  if (state.hasOwnProperty('powerState')) {
    properties.push(
      makeProperty('Alexa.PowerController', 'powerState', state.powerState)
    )
  }

  if (state.hasOwnProperty('speed')) {
    properties.push(
      makeProperty(
        'Alexa.RangeController',
        'rangeValue',
        state.speed,
        'Fan.Speed'
      )
    )
  }

  if (state.hasOwnProperty('targetTemperature')) {
    properties.push(
      makeProperty('Alexa.ThermostatController', 'targetSetpoint', {
        value: state.targetTemperature,
        scale: state.targetScale,
      })
    )
  }

  if (state.hasOwnProperty('temperature')) {
    properties.push(
      makeProperty('Alexa.TemperatureSensor', 'temperature', {
        value: state.temperature,
        scale: state.scale,
      })
    )
  }

  if (state.hasOwnProperty('volume')) {
    properties.push(
      makeProperty('Alexa.Speaker', 'volume', {
        volume: state.volume,
      })
    )
  }

  return properties
}

module.exports = {
  buildNewStateForDirectiveRequest,
  buildPropertiesFromState,
  annotateChanges,
}
