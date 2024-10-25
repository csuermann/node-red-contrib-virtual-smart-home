const EventEmitter = require('node:events')
const mqtt = require('mqtt')

class MqttClient extends EventEmitter {
  constructor(options) {
    super()

    this.options = {
      ...options,
      reconnectPeriod: 60_000, //in milliseconds, interval between two reconnections.
      connectTimeout: 30_000, //in milliseconds, time to wait before a CONNACK is received
      keepalive: 90, //in seconds
      rejectUnauthorized: true,
      resubscribe: false,
      clean: true,
      protocolVersion: 5,
    }

    this.client = null
  }

  connect() {
    this.client = mqtt.connect(`mqtts://${this.options.host}`, this.options)

    this.client.on('connect', (conAck) => {
      //console.log('EVENT connect', conAck)
      this.emit('connect', conAck)
    })

    // this.client.on('disconnect', (args) => {
    //   console.log('EVENT disconnect (initiated by broker)', args)
    // })

    this.client.on('offline', () => {
      //console.log('EVENT offline')
      this.emit('offline')
    })

    this.client.on('close', () => {
      //console.log('EVENT close')
      this.emit('close')
    })

    this.client.on('error', (error) => {
      //console.log('EVENT error', error)
      this.emit('error', error)
    })

    this.client.on('message', (topic, message, _packet) => {
      const parsedMsg = JSON.parse(message.toString())
      //console.log('EVENT message', topic, parsedMsg)
      this.emit('message', topic, parsedMsg)
    })
  }

  async end() {
    try {
      return this.client.endAsync()
    } catch (err) {
      return false
    }
  }

  async publish(topic, json) {
    return new Promise((resolve, reject) => {
      const message = JSON.stringify(json)
      const options = {
        qos: 1,
      }

      this.client.publish(topic, message, options, (err, result) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  async subscribe(topics) {
    const options = {
      qos: 1,
    }

    return new Promise((resolve, reject) => {
      this.client.subscribe(topics, options, (err, result) => {
        if (err) {
          console.log('Error during subscribe()', err)
          reject(err)
        } else {
          //console.log('EVENT subscribed')
          this.emit('subscribed', result)
          resolve(result)
        }
      })
    })
  }

  isConnected() {
    return this.client && this.client.connected
  }

  isReconnecting() {
    return this.client && this.client.reconnecting
  }
}

module.exports = MqttClient
