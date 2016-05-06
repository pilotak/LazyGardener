var config = require('../config/config')
var logger = require('./logger')
var async = require('async')
var Pins = require('onoff').Gpio
var db = require('../config/db')
var util = require('util')
var http = require('json-http')

var event
var event_is_attached = false
var current_status = []

for (var i = 0; i < config.valve.length; i++) {
  current_status[config.valve[i].id] = false
}

var forward = async.seq(pump, valve_power, valve_control)
var back = async.seq(valve_control, valve_power, pump)

module.exports = function (valve, status) {
  if (valve !== undefined) {
    if (status) {
      forward(valve, status, function (err, result) {
        if (err) console.log(err)
      })
    } else {
      back(valve, status, function (err, result) {
        if (err) console.log(err)
      })
    }
  } else {
    logger.error('VALVE', 'is undefined')
  }
}

function pump (valve, status, callback) {
  if (config.pump.enabled && !event_is_attached) {
    var address = util.format('%s/status=%s', config.pump.address, (status ? 'on' : 'off'))

    http.getJson(address, function (err, response) {
      if (!err) {
        logger.info('PUMP', 'is', (status ? 'on' : 'off'))
        callback(null, valve, status)
      } else {
        logger.error('PUMP', "Can't reach the host")
        callback(new Error('pump power'), valve, status)
      }
    })
  } else {
    callback(null, valve, status)
  }
}

function valve_power (valve, status, callback) {
  if (config.valve_power.enabled && !event_is_attached) {
    var relay = new Pins(config.valve_power.pin, 'out')

    relay.write(+status, function (err) {
      if (!err) {
        logger.info('VALVE_POWER', 'is', (status ? 'ON' : 'OFF'))
        callback(null, valve, status)
      } else {
        logger.error('VALVE_POWER', 'Error when switching', (status ? 'ON' : 'OFF'))
        callback(new Error('valve power'), valve, status)
      }
    })
  } else {
    callback(null, valve, status)
  }
}

function valve_control (valve, status, callback) {
  var timeout
  var delay = (status ? (config.valve_power.enabled ? config.valve_power.delay : 0) : 0)

  setTimeout(
    function () {
      async.times(config.valve.length, function (n, next) {
        var on

        if (current_status[config.valve[n].id] === true && config.valve[n].id !== valve) {
          logger.info('VALVE', 'id: ', config.valve[n].id, 'is OFF')

          async.waterfall([
            function (callback) {
              db.writePoint('valve', {id: String(config.valve[n].id), status: 1}, null, function (err_db, response) {
                if (err_db) callback(err_db)
                else callback(null)
              })
            },
            function (callback) {
              db.writePoint('valve', {id: String(config.valve[n].id), status: 0}, null, function (err_db, response) {
                if (err_db) callback(err_db)
                else callback(null)
              })
            }
          ], function (err, results) {
            if (err) {
              logger.error('VALVE', 'Error when saving to db')
            } else {
              logger.debug('VALVE', 'Saved to db')
            }
          })
          current_status[config.valve[n].id] = false
        }

        if (config.valve[n].id === valve) {
          timeout = config.valve[n].timeout
          on = status
          current_status[config.valve[n].id] = true
        } else {
          on = false
        }

        valveSwitch(config.valve[n], on, function (err) {
          next(err)
        })
      },
        function handleTimeout (err) {
          if (!status && event_is_attached) {
            event_is_attached = false
            clearTimeout(event)

            for (var i = 0; i < config.valve.length; i++) {
              current_status[config.valve[i].id] = false
            }
          } else if (status) {
            if (event_is_attached) clearTimeout(event)

            event_is_attached = true

            event = setTimeout(
              function () {
                event_is_attached = false

                back(valve, false, function (err, result) {
                  if (err) logger.error('VALVE', err)
                })
              },
              timeout)
          }

          if (valve !== false && !err) { // prevent to do when command all off
            logger.info('VALVE', 'id: ', valve, 'is', (status ? 'ON' : 'OFF'))

            setTimeout(
              function () {
                db.writePoint('valve', {id: String(valve), status: status}, null, function (err_db, response) {
                  if (!err_db) {
                    logger.debug('VALVE', 'Saved to db')
                  } else {
                    logger.error('VALVE', 'Error when saving to db', err_db)
                  }
                })
              },
              100)
          }

          setTimeout(
            function () {
              callback(null, valve, status)
            },
            (config.valve_power.enabled ? config.valve_power.delay : 0))
        })
    },
    delay)
}

function valveSwitch (valve, status, callback) {
  var relay = new Pins(valve.pin, 'out')
  logger.debug('VALVE', 'id: ', valve.id, 'is', (status ? 'on' : 'off'))

  relay.write(+status, function (err) {
    if (!err) {
      callback(null)
    } else {
      logger.error('VALVE', 'id: ', valve.id, 'when switching', (status ? 'on' : 'off'))
      callback(new Error('Valve error'))
    }
  })
}
