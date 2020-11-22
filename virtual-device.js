const merge = require('deepmerge')
const deepEql = require('deep-eql')
const RateLimiter = require('./RateLimiter')
const {
  getValidators,
  getDecorator,
  getDefaultState,
} = require('./device-types')

module.exports = function (RED) {
  function VirtualDeviceNode(config) {
    RED.nodes.createNode(this, config)

    const node = this

    const nodeId = 'vshd-' + node.id.replace('.', '')

    const connectionNode = RED.nodes.getNode(config.connection)

    let localState = getDefaultState(config.template)
    localState['template'] = config.template
    localState['friendlyName'] = config.name || config.template.toLowerCase()

    const validators = getValidators(config.template)
    const decorator = getDecorator(config.template)

    let isIncomingMsgProcessingAllowed = true

    const rater = new RateLimiter({
      highWaterMark: 15,
      intervalInSec: 180,
      onExhaustionCb: () => {
        isIncomingMsgProcessingAllowed = false
        console.log(
          'Blocking device state sync to Alexa from now on! Quota exhausted!'
        )
      },
    })

    const getLocalState = function () {
      return { ...localState }
    }

    const setLocalState = function (state) {
      localState = merge(getLocalState(), state)
      const nodeContext = node.context()
      nodeContext.set('state', localState)
    }

    const validateState = function (state) {
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
      connectionNode.registerChildNode(nodeId, {
        setStatus: (status) => node.status(status),
        getLocalState,
        setLocalState,
        getDeviceConfig: () => {
          return {
            friendlyName: config.name || config.template.toLowerCase(),
            template: config.template,
          }
        },
        emitLocalState: () => {
          const msg = {
            payload: decorator(getLocalState()),
          }
          node.send(msg)
        },
      })
    }

    node.on('input', function (msg, send, done) {
      const oldLocalState = getLocalState()
      const approvedState = validateState(msg.payload)
      const mergedState = merge(oldLocalState, approvedState)
      const newLocalState = { ...mergedState, source: 'device' }

      if (
        isIncomingMsgProcessingAllowed &&
        !deepEql(oldLocalState, newLocalState)
      ) {
        setLocalState(newLocalState)

        rater.execute(() =>
          connectionNode.updateShadow({ nodeId, type: 'desired' })
        )
      }

      if (config.passthrough && Object.keys(approvedState).length > 0) {
        send({ payload: decorator(getLocalState(), true) })
      }

      if (done) {
        done()
      }
    })

    node.on('close', async function (removed, done) {
      if (connectionNode) {
        await connectionNode.unregisterChildNode(nodeId)
      }
      node.status({})
      rater.destroy()
      done()
    })
  }

  RED.nodes.registerType('vsh-virtual-device', VirtualDeviceNode)
}
