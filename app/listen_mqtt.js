var config = require('../config/config')
var mqtt = require('mqtt').connect(config.mqtt_address)
var logger = require('../lib/logger')
var email = require('../lib/email')
var util = require('util')

mqtt.on('connect', function () {
  mqtt.subscribe({'/feeds/probe': 1})
})

mqtt.on('message', function (topic, message, packet) {
  message = message.toString()

  try {
    message = JSON.parse(message)

    var presented = false

    for (var ii = 0; ii < config.probe.length; ii++) {
      if (config.probe[ii].id === message.id) {
        presented = true
      }
    }

    if (presented) {
      logger.debug('PROBE', message)

      if (message.hasOwnProperty('status')) {
        logger.info('PROBE', message.id, 'is ready to be programmed')
      } else {
        for (var i = 0; i < message.d.length; i++) {
          if (config.watch_batteries.enabled) {
            if (message.hasOwnProperty('v')) {
              if (parseFloat(parseInt(message.v, 10) / 1000) <= config.watch_batteries.min) {
                var location = null

                for (var p = 0; p < config.probe.length; p++) {
                  if (config.probe[p].id === message.id) {
                    location = config.probe[p].location
                    break
                  }
                }

                for (var v = 0; v < config.valve.length; v++) {
                  if (config.valve[v].id === location) {
                    email(
                      config.watch_batteries.subject,
                      util.format('Baterie sensoru %d (%s) jsou téměř vybyté', message.id, config.valve[v].name)
                    )
                    break
                  }
                }
              }
            }
          }
        }
      }
    } else {
      logger.warn('AUTO', 'unknown probe', message.id)
    }
  } catch (e) {
    logger.error('AUTO', 'Error when parsing incoming probe data', message, e)
  }
})
