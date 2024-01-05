module.exports = function (func, delay) {
  let timeoutId

  return function () {
    const context = this
    const args = arguments

    // If there is a scheduled execution, cancel it
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Immediately execute the function for the first invocation
    if (!timeoutId) {
      func.apply(context, args)
    }

    // Schedule the next execution after the specified delay
    timeoutId = setTimeout(() => {
      timeoutId = null // Reset timeoutId after the delay
      func.apply(context, args)
    }, delay)
  }
}
