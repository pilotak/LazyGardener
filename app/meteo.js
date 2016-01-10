var logger = require('../lib/logger')
var config = require('../config/config')
var Cron = require('cron').CronJob
var async = require('async')
var I2C = require('i2c')
var db = require('../config/db')

var meteo_hub = new I2C(config.i2c.this, {device: config.i2c.dev, debug: false})
meteo_hub.setAddress(config.meteo_station.hub_addr)

var HTU21D = require('htu21d-i2c')
var air = new HTU21D()

var BMP085 = require('bmp085-sensor')
var barometer = BMP085({address: config.meteo_station.BMP085_addr, mode: 3, units: 'metric'})

var BH1750 = require('bh1750')
var light = new BH1750({address: config.meteo_station.BH1750_addr, device: config.i2c.dev, command: 0x10, length: 2})

new Cron(config.meteo_station.interval, function () {
  async.waterfall([
    function (callback) {
      meteo_hub.readBytes(1, 2, function (err, res) { // function 1, request 2 bytes
        if (err === null) {
          var direction = String.fromCharCode(res[0])
          direction += String.fromCharCode(res[1])

          logger.debug('METEO', 'Wind direction:', direction)

          callback(null, {wind_dir: direction})
        } else {
          logger.error('METEO', "Can't request wind direction", err)
        }
      })
    },
    function (res, callback) {
      meteo_hub.readBytes(2, 4, function (err, res) { // function 2, request 4 bytes
        if (err === null) {
          var speed = res[0] << 32 | res[1] << 16 | res[2] << 8 | res[3]
          logger.debug('METEO', 'Wind speed:', speed, 'ms/s')

          res.wind_speed = speed
          callback(null, res)
        } else {
          logger.error('METEO', "Can't request wind speed", err)
        }
      })
    },
    function (res, callback) {
      meteo_hub.readBytes(3, 1, function (err, res) { // function 3, request 1 byte
        if (err === null) {
          logger.debug('METEO', 'UV index', res[0])

          res.uv = res[0]
          callback(null, res)
        } else {
          logger.error('METEO', "Can't request UV index", err)
        }
      })
    },
    function (res, callback) {
      air.readTemperature(function (temp) {
        logger.debug('METEO', 'Temperature is', temp, '°C')
        res.temp = temp
        callback(null, res)
      })
    },
    function (res, callback) {
      air.readHumidity(function (humidity) {
        logger.debug('METEO', 'Humidity is', humidity, '%')

        res.humidity = humidity
        callback(null, res)
      })
    },
    function (res, callback) {
      barometer.read(function (err, data) {
        if (!err) {
          logger.debug('METEO', 'Pressure is ', data, 'hPa')

          res.pressure = data
          callback(null, res)
        } else {
          logger.error('METEO', "Can't request pressure", err)
        }
      })
    },
    function (res, callback) {
      light.readLight(function (value) {
        logger.debug('METEO', 'Light level is', value, 'L')

        res.light = value
        callback(null, res)
      })
    }
  ],
    function (err, results) {
      if (!err) {
        db.writePoint('meteo', results, null, function (err, response) {
          if (!err) {
            logger.info('METEO', 'Saved to db:', results)
          } else {
            logger.error('METEO', 'Error when saving to db')
          }
        })
      }
    })
}, null, true)
