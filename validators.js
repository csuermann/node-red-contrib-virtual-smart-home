module.exports = {
  powerState: val => val == 'ON' || val == 'OFF',
  brightness: val => Number.isInteger(val) && val >= 0 && val <= 100
}
