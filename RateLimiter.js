'use strict'

function RateLimiter ({
  highWaterMark = 10,
  intervalInSec = 5,
  onExhaustionCb
} = {}) {
  this.highWaterMark = highWaterMark
  this.intervalInSec = intervalInSec * 1000
  this.exhaustedCallback = onExhaustionCb
  this.counter = 0

  this.resetCounter = function () {
    this.counter = 0
  }

  this.intervalHandle = setInterval(
    this.resetCounter.bind(this),
    this.intervalInSec
  )
}

RateLimiter.prototype.execute = function (callback) {
  this.counter++

  if (this.counter <= this.highWaterMark) {
    callback()
  }

  if (this.counter == this.highWaterMark) {
    this.exhaustedCallback()
  }
}

module.exports = RateLimiter
