var async = require('async')
var moment = require('moment')
var http = require('json-http')
var util = require('util')
var logger = require('../lib/logger')
var config = require('../config/config')
var db = require('../config/db')

async.waterfall([
  function get_weather (callback) {
    // config.auto_control.weather.lat
    // config.auto_control.weather.lng
    if (config.auto_control.weather.enabled) {
      var url = util.format('http://api.openweathermap.org/data/2.5/forecast?lat=%d&lon=%d&units=%s&APPID=%s', 35, 39, config.auto_control.weather.units, config.auto_control.weather.api)
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
          logger.error('AUTO', "Can't get weather")
          callback("Can't get weather")
        }
      })
    } else {
      callback(null)
    }
  },
  function db_data (data, callback) {
    var valve = [
      {
        id: 1,
        last_on: new Date().getTime(),
        moisture: 40
      },
      {
        id: 2,
        last_on: new Date().getTime(),
        moisture: 20
      },
      {
        id: 3,
        last_on: new Date().getTime(),
        moisture: 30
      }
    ]

    data.valve = valve
    callback(null, data)
  }
],
  function (err, results) {
    /* var hour = moment().format("H")
    if(hour <= 20 && hour >= 6) {
      console.log("Watering time")
      console.log("AUTO", "results", results)
    }
    else {
      console.log("no watering time")
    }*/
    if (!err) {
      logger.info('AUTO', 'results', results)
    } else {
      logger.error('AUTO', 'error')
    }
  })
