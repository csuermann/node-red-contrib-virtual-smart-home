const merge = require('deepmerge')
const deepEql = require('deep-eql')
//const RateLimiter = require('./RateLimiter')
//const RateLimiter = require('./RateLimiter2')
const {
  getValidators,
  getDecorator,
  getDefaultState,
} = require('./device-types')

module.exports = function (RED) {
  function VirtualDeviceNode(config) {
    RED.nodes.createNode(this, config)

    const node = this

    const deviceId = 'vshd-' + node.id.replace('.', '')

    const connectionNode = RED.nodes.getNode(config.connection)

    let localState = getDefaultState(config.template)

    const validators = getValidators(config.template)
    const decorator = getDecorator(config.template, config.diff)

    let isIncomingMsgProcessingAllowed = true

    // const rater = new RateLimiter({
    //   highWaterMark: 15,
    //   intervalInSec: 180,
    //   onExhaustionCb: () => {
    //     isIncomingMsgProcessingAllowed = false
    //     console.log(
    //       'Blocking device state sync to Alexa from now on! Quota exhausted!'
    //     )
    //   },
    // })

    // const rater = new RateLimiter(
    //   [
    //     { period: 60000, limit: 10, repeat: 1 },
    //     { period: 60000, limit: 5 },
    //   ],
    //   (deviceName) => {
    //     isIncomingMsgProcessingAllowed = false
    //     console.log(
    //       `Blocking device state sync to Alexa for ${deviceName} from now on! Quota exhausted!`
    //     )
    //   }
    // )

    const getLocalState = () => ({ ...localState })

    const setLocalState = (targetState) => {
      const oldLocalState = getLocalState()
      localState = merge(oldLocalState, targetState)
      const decoratedOldState = decorator({
        localState: oldLocalState,
        template: config.template,
        friendlyName: config.name,
      })

      node.context().set('state', localState)

      return localState
    }

    const emitLocalState = () => {
      let payload

      payload = decorator({
        localState: getLocalState(),
        template: config.template,
        friendlyName: config.name,
      })

      if (Object.keys(payload).length > 0) {
        const msg = {
          topic: config.topic,
          payload,
        }
        node.send(msg)
      }
    }

    const validateState = (state) => {
      const approvedState = {}

      for (const key in state) {
        if (validators[key]) {
          let validatorResult = validators[key](state[key])

          if (false !== validatorResult) {
            approvedState[validatorResult.key] = validatorResult.value
          }
        }
      }

      return approvedState
    }

    if (connectionNode) {
      //connection is configured
      //register callbacks. This way connectionNode can communicate with us:
      connectionNode.registerChildNode(deviceId, {
        setStatus: (status) => node.status(status),
        getLocalState,
        setLocalState,
        emitLocalState,
        getDeviceConfig: () => {
          return {
            friendlyName: config.name || config.template.toLowerCase(),
            template: config.template,
          }
        },
      })
    }

    node.on('input', function (msg, send, done) {
      if (config.filter && msg.payload.name !== config.name) {
        if (done) {
          done()
        }
        console.log(
          `ignoring inbound msg because msg.payload.name (${
            msg.payload.name ? `'${msg.payload.name}'` : '<undefined>'
          }) does not match '${config.name}'`
        )
        return
      }

      const oldLocalState = getLocalState()
      const approvedState = validateState(msg.payload)
      approvedState['directive'] = 'OverrideLocalState'
      const mergedState = merge(oldLocalState, approvedState)
      const newLocalState = { ...mergedState, source: 'device' }
      const confirmedNewLocalState = setLocalState(newLocalState)

      if (
        isIncomingMsgProcessingAllowed &&
        !deepEql(oldLocalState, newLocalState)
      ) {
        // rater.execute(() =>
        //   connectionNode.updateShadow({
        //     state: confirmedNewLocalState,
        //     deviceId,
        //     type: 'desired',
        //   })
        // )

        //rater.execute(`${config.name}`, () =>
        connectionNode.updateShadow({
          state: confirmedNewLocalState,
          deviceId,
          type: 'desired',
        })
        //)
      }

      if (config.passthrough && Object.keys(approvedState).length > 0) {
        emitLocalState()
      }

      if (done) {
        done()
      }
    })

    node.on('close', async function (removed, done) {
      if (connectionNode) {
        await connectionNode.unregisterChildNode(deviceId)
      }
      node.status({})
      //rater.destroy()
      return done()
    })
  }

  RED.nodes.registerType('vsh-virtual-device', VirtualDeviceNode)
}
