var logger = require('../lib/logger')
var config = require('../config/config')
var Cron = require('cron').CronJob
var async = require('async')
var I2C = require('i2c')
var db = require('../config/db')

var wire = new I2C(config.i2c.this, {device: config.i2c.dev, debug: false})
wire.setAddress(config.meteo_station.hub_addr)

var BMP085 = require('bmp085-sensor')
var barometer = BMP085({address: config.meteo_station.BMP085_addr, mode: 3, units: 'metric'})

new Cron(config.meteo_station.interval, function () {
  async.waterfall([
    function (callback) {
      wire.readBytes(1, 2, function (err, res) { // function 1, request 2 bytes
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
      wire.readBytes(2, 4, function (err, res) { // function 2, request 4 bytes
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
      wire.readBytes(3, 1, function (err, res) { // function 3, request 1 byte
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
      wire.setAddress(config.meteo_station.HTU21D_addr)
      wire.writeByte(0xF3, function (err) { // read temp
        if (err) {
          logger.error('METEO', 'Temperature', err)
          callback(err)
        } else {
          setTimeout(function () {
            wire.read(3, function (err, data) {
              if (err) {
                logger.error('METEO', 'Temperature', err)
                callback(err)
              } else {
                if ((data.length === 3) && calc_crc8(data, 3)) {
                  var rawtemp = ((data[0] << 8) | data[1]) & 0xFFFC
                  var temperature = ((rawtemp / 65536.0) * 175.72) - 46.85

                  logger.debug('METEO', 'Temp is', temperature.toFixed(2), '°C')
                  res.temp = temperature
                  callback(null, res)
                }
              }
            })
          }, 50)
        }
      })
    },
    function (res, callback) {
      wire.setAddress(config.meteo_station.HTU21D_addr)
      wire.writeByte(0xF5, function (err) { // read humidity
        if (err) {
          logger.error('METEO', 'Humidity', err)
          callback(err)
        } else {
          setTimeout(function () {
            wire.read(3, function (err, data) {
              if (err) {
                logger.error('METEO', 'Humidity', err)
                callback(err)
              } else {
                if ((data.length === 3) && calc_crc8(data, 3)) {
                  var rawhumi = ((data[0] << 8) | data[1]) & 0xFFFC
                  var humidity = ((rawhumi / 65536.0) * 125.0) - 6.0
                  logger.debug('METEO', 'Relative Humidity is', humidity.toFixed(2), '%')

                  res.humidity = humidity
                  callback(null, res)
                }
              }
            })
          }, 16)
        }
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
      wire.setAddress(config.meteo_station.BH1750_addr)

      wire.writeByte(0x11, function (err) { // read humidity
        if (err) {
          logger.error('METEO', 'Light', err)
          callback(err)
        } else {
          setTimeout(function () {
            wire.read(2, function (err, data) {
              if (err) {
                logger.error('METEO', 'Light', err)
                callback(err)
              } else {
                var value = (data[0] << 8) + data[1]

                logger.debug('METEO', 'Light level is', value, 'lx')
                res.light = value
                callback(null, res)
              }
            })
          }, 120)
        }
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

function calc_crc8 (buf, len) {
  var dataandcrc
  // Generator polynomial: x**8 + x**5 + x**4 + 1 = 1001 1000 1
  var poly = 0x98800000
  var i

  if (len === null) return -1
  if (len != 3) return -1
  if (buf === null) return -1

  // Justify the data on the MSB side. Note the poly is also
  // justified the same way.
  dataandcrc = (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8)
  for (i = 0; i < 24; i++) {
    if (dataandcrc & 0x80000000)
      dataandcrc ^= poly
    dataandcrc <<= 1
  }
  return (dataandcrc === 0)
}
