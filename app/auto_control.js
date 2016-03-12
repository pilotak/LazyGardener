var async = require('async')
var moment = require('moment')
var http = require('json-http')
var util = require('util')
var logger = require('../lib/logger')
var config = require('../config/config')
var db = require('../config/db')
var mqtt = require('mqtt')
var email = require('nodemailer').createTransport(config.auto_control.email.settings)

if (config.auto_control.email.enabled) {
  var mailOptions = {
    from: config.auto_control.email.settings.auth.user,
    to: config.auto_control.email.settings.auth.user,
    subject: '',
    text: '',
    html: ''
  }
}

var client = mqtt.connect('mqtt://localhost')

client.on('connect', function () {
  client.subscribe({'/feeds/probe': 1})
})

client.on('message', function (topic, message, packet) {
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
      for (var i = 0; i < message.d.length; i++) {
        if (message.hasOwnProperty('v')) {
          var voltage = parseFloat(parseInt(message.v, 10) / 10)

          if (config.auto_control.email.enabled) {
            mailOptions.html = util.format("Baterie sensoru '%d' jsou téměř vybité: %d V", message.id, voltage)

            email.sendMail(mailOptions, function (error, info) {
              if (!error) {
                logger.info('AUTO', 'Email send: ' + info.response)
              } else {
                logger.error('AUTO', 'Error when sending email: ' + error)
              }
            })
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
          logger.error('AUTO', "Can't get weather", response)
          callback("Can't get weather")
        }
      })
    } else {
      callback(null)
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
        callback('cant get valve')
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
