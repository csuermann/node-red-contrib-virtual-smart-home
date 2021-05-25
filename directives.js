'use strict'

const deepEql = require('deep-eql')

const directives = {
  TurnOn: (request, currentState) => ({
    powerState: 'ON',
    brightness: currentState.brightness === 0 ? 100 : currentState.brightness,
  }),
  TurnOff: (request, currentState) => ({ powerState: 'OFF' }),
  SetBrightness: (request, currentState) => ({
    brightness: request.directive.payload.brightness,
    powerState: request.directive.payload.brightness > 0 ? 'ON' : 'OFF',
  }),
  // SetPercentage: (request, currentState) => {
  //   const newState = { percentage: request.directive.payload.percentage }
  //   const newProperties = []
  //   newProperties.push(
  //     makeProperty(
  //       'Alexa.PercentageController',
  //       'percentage',
  //       request.directive.payload.percentage
  //     )
  //   )
  //   if (request.directive.endpoint.cookie.template === 'BLINDS') {
  //     const instance = 'Blinds.Position'
  //     const mode =
  //       request.directive.payload.percentage == 100
  //         ? 'Position.Up'
  //         : 'Position.Down'
  //     newProperties.push(
  //       makeProperty('Alexa.ModeController', 'mode', mode, instance)
  //     )
  //     newState['instance'] = instance
  //     newState['mode'] = mode
  //   }
  //   return {
  //     newProperties,
  //     newState,
  //   }
  // },
  // AdjustBrightness: (request, currentState) => {
  //   const currentBrightness = currentState.state.reported?.brightness || 50
  //   let newBrightness =
  //     currentBrightness + request.directive.payload.brightnessDelta
  //   if (newBrightness < 0) {
  //     newBrightness = 0
  //   } else if (newBrightness > 100) {
  //     newBrightness = 100
  //   }
  //   return {
  //     newProperties: [
  //       makeProperty('Alexa.BrightnessController', 'brightness', newBrightness),
  //       makeProperty(
  //         'Alexa.PowerController',
  //         'powerState',
  //         newBrightness > 0 ? 'ON' : 'OFF'
  //       ),
  //     ],
  //     newState: {
  //       brightness: newBrightness,
  //       powerState: newBrightness > 0 ? 'ON' : 'OFF',
  //     },
  //   }
  // },
  // SetColor: (request, currentState) => ({
  //   newProperties: [
  //     makeProperty(
  //       'Alexa.ColorController',
  //       'color',
  //       request.directive.payload.color
  //     ),
  //     makeProperty('Alexa.PowerController', 'powerState', 'ON'),
  //   ],
  //   newState: {
  //     color: request.directive.payload.color,
  //     lightMode: 'hsb',
  //     powerState: 'ON',
  //   },
  // }),
  // SetColorTemperature: (request, currentState) => ({
  //   newProperties: [
  //     makeProperty(
  //       'Alexa.ColorTemperatureController',
  //       'colorTemperatureInKelvin',
  //       request.directive.payload.colorTemperatureInKelvin
  //     ),
  //     makeProperty('Alexa.PowerController', 'powerState', 'ON'),
  //   ],
  //   newState: {
  //     colorTemperatureInKelvin:
  //       request.directive.payload.colorTemperatureInKelvin,
  //     lightMode: 'temp',
  //     powerState: 'ON',
  //   },
  // }),
  // IncreaseColorTemperature: (request, currentState) => {
  //   const currentTemp = shadow.state?.reported?.colorTemperatureInKelvin || 4000
  //   const supportedTemps = [
  //     2200, // warm, warm white
  //     2700, // incandescent, soft white
  //     4000, // white
  //     5500, // daylight, daylight white
  //     7000, // cool, cool white
  //   ]
  //   const newTemp = supportedTemps.find((t) => t > currentTemp) || 10000
  //   return {
  //     newProperties: [
  //       makeProperty(
  //         'Alexa.ColorTemperatureController',
  //         'colorTemperatureInKelvin',
  //         newTemp
  //       ),
  //     ],
  //     newState: {
  //       colorTemperatureInKelvin: newTemp,
  //       lightMode: 'temp',
  //     },
  //   }
  // },
  // DecreaseColorTemperature: (request, currentState) => {
  //   const currentTemp = shadow.state?.reported?.colorTemperatureInKelvin || 4000
  //   const supportedTemps = [
  //     2200, // warm, warm white
  //     2700, // incandescent, soft white
  //     4000, // white
  //     5500, // daylight, daylight white
  //     7000, // cool, cool white
  //   ]
  //   const newTemp = supportedTemps.find((t) => t < currentTemp) || 1000
  //   return {
  //     newProperties: [
  //       makeProperty(
  //         'Alexa.ColorTemperatureController',
  //         'colorTemperatureInKelvin',
  //         newTemp
  //       ),
  //     ],
  //     newState: {
  //       colorTemperatureInKelvin: newTemp,
  //       lightMode: 'temp',
  //     },
  //   }
  // },
  // // Lock: (request, currentState) => ({
  // //   newProperties: [
  // //     makeProperty('Alexa.LockController', 'lockState', 'LOCKED')
  // //   ],
  // //   newState: { lockState: 'LOCKED' }
  // // }),
  // // Unlock: (request, currentState) => ({
  // //   newProperties: [
  // //     makeProperty('Alexa.LockController', 'lockState', 'UNLOCKED')
  // //   ],
  // //   newState: { lockState: 'UNLOCKED' }
  // // }),
  // SetMode: (request, currentState) => {
  //   const newProperties = [
  //     makeProperty(
  //       'Alexa.ModeController',
  //       'mode',
  //       request.directive.payload.mode,
  //       request.directive.header.instance
  //     ),
  //   ]
  //   const newState = {
  //     mode: request.directive.payload.mode,
  //     instance: request.directive.header.instance,
  //   }
  //   if (request.directive.endpoint.cookie.template === 'BLINDS') {
  //     const percentage =
  //       request.directive.payload.mode === 'Position.Up' ? 100 : 0
  //     newProperties.push(
  //       makeProperty('Alexa.PercentageController', 'percentage', percentage)
  //     )
  //     newState['percentage'] = percentage
  //   }
  //   return {
  //     newProperties,
  //     newState,
  //   }
  // },
  // Activate: (request, currentState) => ({
  //   newProperties: [],
  //   newState: {
  //     isActivated: true,
  //   },
  // }),
  // Deactivate: (request, currentState) => ({
  //   newProperties: [],
  //   newState: {
  //     isActivated: false,
  //   },
  // }),
  // AdjustTargetTemperature: (request, currentState) => {
  //   const currentTargetTemp = shadow.state.reported?.targetTemperature || 0
  //   const newTargetTemp =
  //     currentTargetTemp + request.directive.payload.targetSetpointDelta.value
  //   return {
  //     newProperties: [
  //       makeProperty('Alexa.ThermostatController', 'targetSetpoint', {
  //         value: newTargetTemp,
  //         scale: request.directive.payload.targetSetpointDelta.scale,
  //       }),
  //     ],
  //     newState: {
  //       targetTemperature: newTargetTemp,
  //     },
  //   }
  // },
  // SetTargetTemperature: (request, currentState) => ({
  //   newProperties: [
  //     makeProperty(
  //       'Alexa.ThermostatController',
  //       'targetSetpoint',
  //       request.directive.payload.targetSetpoint
  //     ),
  //     makeProperty('Alexa.ThermostatController', 'thermostatMode', 'AUTO'),
  //   ],
  //   newState: {
  //     targetTemperature: request.directive.payload.targetSetpoint.value,
  //     targetScale: request.directive.payload.targetSetpoint.scale,
  //   },
  // }),
  // AdjustRangeValue: (request, currentState) => {
  //   const deviceType = request.directive.endpoint.cookie.template
  //   if (deviceType === 'FAN') {
  //     const currentSpeed = shadow.state?.reported?.speed || 0
  //     let newSpeed = currentSpeed + request.directive.payload.rangeValueDelta
  //     if (newSpeed < 0) {
  //       newSpeed = 0
  //     } else if (newSpeed > 10) {
  //       newSpeed = 10
  //     }
  //     return {
  //       newProperties: [
  //         makeProperty(
  //           'Alexa.RangeController',
  //           'rangeValue',
  //           newSpeed,
  //           request.directive.header.instance
  //         ),
  //         makeProperty(
  //           'Alexa.PowerController',
  //           'powerState',
  //           newSpeed > 0 ? 'ON' : 'OFF'
  //         ),
  //       ],
  //       newState: {
  //         speed: newSpeed,
  //         powerState: newSpeed > 0 ? 'ON' : 'OFF',
  //       },
  //     }
  //   } else if (deviceType === 'BLINDS') {
  //     const currentPercentage = shadow.state?.reported?.percentage || 100
  //     let newPercentage =
  //       currentPercentage + request.directive.payload.rangeValueDelta
  //     if (newPercentage < 0) {
  //       newPercentage = 0
  //     } else if (newPercentage > 100) {
  //       newPercentage = 100
  //     }
  //     return {
  //       newProperties: [
  //         makeProperty(
  //           'Alexa.RangeController',
  //           'rangeValue',
  //           newPercentage,
  //           request.directive.header.instance
  //         ),
  //       ],
  //       newState: {
  //         percentage: newPercentage,
  //       },
  //     }
  //   }
  // },
  // SetRangeValue: (request, currentState) => {
  //   const newProperties = [
  //     makeProperty(
  //       'Alexa.RangeController',
  //       'rangeValue',
  //       request.directive.payload.rangeValue,
  //       request.directive.header.instance
  //     ),
  //   ]
  //   let newState = {}
  //   if (request.directive.endpoint.cookie.template === 'FAN') {
  //     newProperties.push(
  //       makeProperty(
  //         'Alexa.PowerController',
  //         'powerState',
  //         request.directive.payload.rangeValue > 0 ? 'ON' : 'OFF'
  //       )
  //     )
  //     newState = {
  //       speed: request.directive.payload.rangeValue,
  //       powerState: request.directive.payload.rangeValue > 0 ? 'ON' : 'OFF',
  //     }
  //   } else if (request.directive.endpoint.cookie.template === 'BLINDS') {
  //     newState = {
  //       percentage: request.directive.payload.rangeValue,
  //       mode:
  //         request.directive.payload.rangeValue == 100
  //           ? 'Position.Up'
  //           : 'Position.Down',
  //     }
  //   }
  //   return {
  //     newProperties,
  //     newState,
  //   }
  // },
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

  if (state.hasOwnProperty('percentage')) {
    properties.push(
      makeProperty(
        'Alexa.RangeController',
        'rangeValue',
        state.percentage,
        'Blind.Lift'
      )
    )
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

  return properties
}

module.exports = {
  buildNewStateForDirectiveRequest,
  buildPropertiesFromState,
  annotateChanges,
}
