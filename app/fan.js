var Gpio = require('onoff').Gpio
var ds18b20 = require('ds18b20')
var logger = require('../lib/logger')
var config = require('../config/config')
var Cron = require('cron').CronJob
var async = require('async')
var db = require('../config/db')

new Cron(config.fan.interval, function () {
  async.waterfall([
    function get_dallas_id (callback) {
      ds18b20.sensors(function (err, id) {
        if (!err) {
          callback(null, id)
        } else {
          logger.error('FAN', '1-Wire error')
          callback('1-Wire error')
        }
      })
    },
    function get_temp (id, callback) {
      ds18b20.temperature(id, function (err, temp) {
        if (!err && temp < 85 && temp > -125) {
          callback(null, temp)
        } else {
          logger.error('FAN', "Can't read board temperature")
          callback("Can't read board temperature")
        }
      })
    },
    function fan (temp, callback) {
      var fan = new Gpio(config.fan.pin, 'out')
      var fan_status = (temp >= config.fan.too_hot ? 1 : 0)

      fan.write(fan_status, function (err) {
        if (!err) {
          callback(null, temp, fan_status)
        } else {
          logger.error('FAN', 'Switch error')
          callback('Fan switch error')
        }
      })
    }
  ], function done (err, temp, fan_status) {
    if (!err) {
      logger.info('FAN', 'temperature: ', temp, 'fan is', (fan_status ? 'on' : 'off'))

      db.writePoint('fan', {temp: temp, status: fan_status}, null, function (err, response) {
        if (!err) {
          logger.debug('FAN', 'Saved to db')
        } else {
          logger.error('FAN', 'Error when saving to db')
        }
      })
    }
  })
}, null, true)
