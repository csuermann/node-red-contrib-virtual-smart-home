'use strict'

function RateLimiter(
  iterations,
  onExhaustionCb = undefined,
  logger = undefined
) {
  this.iterations = iterations
  this.isFirstIteration = true
  this.onExhaustionCb = onExhaustionCb
  this.groups = {}
  this.limit = 0
  this.logger = logger || function (logMsg) {}

  this.nextIteration = function () {
    let newConfig

    if (this.iterations.length > 1) {
      this.iterations[0].repeat--
      if (this.iterations[0].repeat > 0) {
        newConfig = this.iterations[0]
      } else {
        newConfig = this.iterations.shift()
      }
    } else {
      newConfig = this.iterations[0]
      newConfig.repeat = 999
    }

    this.lastLimit = this.isFirstIteration ? newConfig.limit : this.limit
    this.lastPenalty = this.isFirstIteration ? newConfig.penalty : this.penalty

    this.limit = newConfig.limit
    this.penalty = newConfig.penalty || 0

    this.resetGroups(this.lastLimit, this.lastPenalty)

    this.isFirstIteration = false

    this.timoutHandle = setTimeout(
      this.nextIteration.bind(this),
      newConfig.period
    )
  }

  this.initGroup = function (group) {
    if (!this.groups.hasOwnProperty(group)) {
      this.groups[group] = {
        executions: 0,
        remaining: this.limit,
        penaltySum: 0,
      }
    }
  }

  this.resetGroups = function (lastLimit, lastPenalty) {
    for (const group in this.groups) {
      if (this.groups[group].executions > lastLimit + 1) {
        //limit of last iteration was violated!
        this.groups[group].penaltySum += lastPenalty
        if (this.groups[group].penaltySum > lastLimit) {
          this.groups[group].penaltySum = lastLimit
        }
      } else {
        //limit of last iteration was not violated!
        this.groups[group].penaltySum -= lastPenalty
        if (this.groups[group].penaltySum < 0) {
          this.groups[group].penaltySum = 0
        }
      }

      let remainingBeforeReset = this.groups[group].remaining

      this.groups[group].remaining = this.limit - this.groups[group].penaltySum

      //always allow at least one request per iteration
      if (this.groups[group].remaining <= 0) {
        this.groups[group].remaining = 1
      }

      if (remainingBeforeReset != this.groups[group].remaining) {
        this.logger(
          `resetting quota for group '${group}' to ${this.groups[group].remaining}`
        )
      }

      this.groups[group].executions = 0
    }

    // if (Object.keys(this.groups).length > 0) {
    //   console.log(this.groups)
    // }
  }

  this.nextIteration()
}

RateLimiter.prototype.execute = function (group, callback) {
  this.initGroup(group)

  this.groups[group].executions++
  this.groups[group].remaining--

  if (this.groups[group].remaining >= 0) {
    callback()
  } else {
    this.logger(`blocking execution of ${callback.name} for group '${group}'`)
  }

  if (this.groups[group].remaining == 0) {
    this.logger(`quota for group '${group}' exhausted`)

    if (this.onExhaustionCb) {
      this.onExhaustionCb(group)
    }
  }
}

RateLimiter.prototype.overrideConfig = function (iterations) {
  clearTimeout(this.timoutHandle)
  this.iterations = iterations
  this.isFirstIteration = true
  this.limit = 0
  this.groups = {}
  this.logger(
    'RateLimiter.overrideConfig: ' + JSON.stringify(iterations, null, 2)
  )
  this.nextIteration()
}

RateLimiter.prototype.destroy = function () {
  clearTimeout(this.timoutHandle)
}

module.exports = RateLimiter
