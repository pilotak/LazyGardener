var async = require('async')
var moment = require('moment')
var http = require('json-http')
var util = require('util')
var logger = require('../lib/logger')
var email = require('../lib/email')
var config = require('../config/config')
var db = require('../config/db')

var Cron = require('cron').CronJob

new Cron(config.auto_control.interval, function () {
  var hour = moment().format('H')

  if (hour <= config.auto_control.hours.off && hour >= config.auto_control.hours.on) {
    async.waterfall([
      function get_weather (callback) {
        if (config.auto_control.weather.enabled) {
          var url = util.format('http://api.openweathermap.org/data/2.5/forecast?lat=%d&lon=%d&units=%s&APPID=%s', config.auto_control.weather.lat, config.auto_control.weather.lng, config.auto_control.weather.units, config.auto_control.weather.api)
          var today_rain = 0
          var max_temp = null
          var earliest_rain = null
          var earliest_rain_set = false

          http.getJson(url, function (err, response) {
            if (!err) {
              for (var i = 0; i < Object.keys(response.list).length; i++) {
                if (moment.unix(response.list[i].dt).isSame(moment(), 'day')) {
                  if (response.list[i].hasOwnProperty('rain')) {
                    if (Object.keys(response.list[i].rain).length > 0) {
                      today_rain += response.list[i].rain['3h']

                      if (!earliest_rain_set) {
                        earliest_rain = response.list[i].dt
                        earliest_rain_set = true
                      }
                    }
                  }

                  max_temp = (response.list[i].main.temp_max > max_temp ? response.list[i].main.temp_max : max_temp)
                } else {
                  break
                }
              }

              callback(null, {
                today_rain: today_rain,
                max_temp: max_temp,
                earliest_rain: earliest_rain
              })
            } else {
              callback("Can't get weather data")
            }
          })
        } else {
          callback(null, {})
        }
      },
      function valve_data (data, callback) {
        var valve = []
        var query = ''

        for (var i = 0; i < config.valve.length; i++) {
          query += util.format('SELECT * FROM valve WHERE id = %d AND status = 1 ORDER BY time DESC LIMIT 1;', config.valve[i].id)
        }

        db.query(query, function (err, results) {
          if (err) {
            logger.error('AUTO', 'db', err)
            callback("Can't get valve")
          } else {
            logger.debug('AUTO', 'db', results[0])
            results = results[0]

            for (var i = 0; i < results.length; i++) {
              if (results[i] !== undefined && results[i].hasOwnProperty('time')) {
                valve.push({
                  id: results[i].id,
                  last_on: moment(results[i].time).format('x')
                })
              }
            }

            data.valve = valve
            callback(null, data)
          }
        })
      },
      function probe_data (data, callback) {
        var probe = []
        var query = ''

        for (var i = 0; i < config.probe.length; i++) {
          query += util.format('SELECT * FROM probe WHERE id = %d ORDER BY time DESC LIMIT 1;', config.probe[i].id)
        }

        db.query(query, function (err, results) {
          if (err) {
            logger.error('AUTO', 'db', err)
            callback('cant get probes')
          } else {
            logger.debug('AUTO', 'db', results[0])
            results = results[0]

            for (var i = 0; i < results.length; i++) {
              if (results[i] !== undefined && results[i].hasOwnProperty('time')) {
                probe.push({
                  id: results[i].id,
                  last_on: moment(results[i].time).format('x')
                })
              }
            }

            data.probe = probe
            callback(null, data)
          }
        })
      }
    ],
      function (err, results) {
        if (!err) {
          logger.info('AUTO', 'results', results)

          if (config.auto_control.email) {
            email('AUTO', results)
          }
        } else {
          logger.error('AUTO', err)
        }
      })
  }
}, null, true)
