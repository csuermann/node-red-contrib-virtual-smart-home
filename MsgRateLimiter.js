'use strict'

const Bottleneck = require('bottleneck/es5')

function MsgRateLimiter(logger) {
  this.profileConfigs = {
    DEFAULT: {
      maxConcurrent: 1,
      minTime: 1000, //1 sec
      highWater: 0,
      strategy: 'BLOCK',
      penalty: 30 * 1000, //30 sec
      reservoir: 60,
      reservoirIncreaseInterval: 60 * 1000, //60 sec
      reservoirIncreaseAmount: 1,
      reservoirIncreaseMaximum: 60,
    },
  }

  this.profileMapping = {}

  this.rateLimiters = {}

  this.logger = logger

  /**
   * returns the most specific rate limiter profile for a given classication
   *
   * the following search cascade is applied:
   * 1. <causeType>_<template>    i.e. PHYSICAL_INTERACTION_DIMMER_SWITCH
   * 2. <causeType>_DEFAULT       i.e. PHYSICAL_INTERACTION_DEFAULT
   * 3. DEFAULT                   i.e. DEFAULT
   */
  this.getProfileForClassification = function ({ causeType, template }) {
    if (
      this.profileMapping[`${causeType}_${template}`] &&
      this.profileConfigs[this.profileMapping[`${causeType}_${template}`]]
    ) {
      return this.profileMapping[`${causeType}_${template}`]
    } else if (
      this.profileMapping[`${causeType}_DEFAULT`] &&
      this.profileConfigs[this.profileMapping[`${causeType}_DEFAULT`]]
    ) {
      return this.profileMapping[`${causeType}_DEFAULT`]
    } else {
      return 'DEFAULT'
    }
  }

  this.getRateLimiterForClassification = function (classification) {
    const { causeType, template, endpointId } = classification

    const key = `${endpointId}-${causeType}`

    if (!this.rateLimiters[key]) {
      const profileName = this.getProfileForClassification({
        causeType,
        template,
      })

      const bottleneckConfig = {
        maxConcurrent: 1,
        minTime: 0,
        highWater: 1,
        ...this.profileConfigs[profileName],
        strategy:
          Bottleneck.strategy[this.profileConfigs[profileName]['strategy']],
      }

      //console.log(`new bottleneck for ${key}`, bottleneckConfig)

      const logger = this.logger

      const rateLimiter = new Bottleneck(bottleneckConfig)
      // rateLimiter.on('debug', function (message, data) {
      //   console.log(message, data)
      // })
      // rateLimiter.on('queued', function (info) {
      //   console.log('QUEUED', info.options.id)
      // })
      // rateLimiter.on('scheduled', function (info) {
      //   console.log('SCHEDULED', info.options.id)
      // })
      // rateLimiter.on('executing', function (info) {
      //   console.log('EXECUTING', info.options.id)
      // })
      // rateLimiter.on('done', function (info) {
      //   console.log('DONE', info.options.id)
      // })
      rateLimiter.on('dropped', function (info) {
        logger(
          `MsgRateLimiter: dropping ${template}:${endpointId}:${causeType}`,
          null,
          'warn'
        )

        //console.log('DROPPED', info.options.id)
      })
      rateLimiter.on('error', function (error) {
        logger('ERROR', error)
      })

      this.rateLimiters[key] = rateLimiter
    }

    return this.rateLimiters[key]
  }

  this.destroyAllRateLimiters = async function () {
    const promises = Object.keys(this.rateLimiters).map((key) =>
      this.rateLimiters[key].stop()
    )
    await Promise.all(promises)
    this.rateLimiters = {}
  }
}

MsgRateLimiter.prototype.execute = function (
  classification,
  callback,
  jobId = '<no-id>'
) {
  const { causeType, template, endpointId } = classification

  const rateLimiter = this.getRateLimiterForClassification(classification)

  // let counts
  // counts = rateLimiter.counts()
  // console.log('counts BEFORE submit', counts)

  rateLimiter.submit({ id: jobId }, callback, () => {})

  // counts = rateLimiter.counts()
  // console.log('counts AFTER submit', counts)
}

MsgRateLimiter.prototype.overrideConfig = async function (config) {
  this.logger(
    'MsgRateLimiter.overrideConfig: ' + JSON.stringify(config, null, 2)
  )
  const { profiles, profileMapping } = config
  this.profileConfigs = { ...this.profileConfigs, ...profiles } //merge
  this.profileMapping = profileMapping //override
  await this.destroyAllRateLimiters()
}

MsgRateLimiter.prototype.destroy = async function () {
  await this.destroyAllRateLimiters()
}

module.exports = MsgRateLimiter
