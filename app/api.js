var influx = require('influx')
var config = require('../config/config')
var http = require('http')
var url = require('url')
var mqtt = require('mqtt')
var moment = require('moment')

var db = influx({
  host: config.db.host,
  username: config.api.db.user,
  password: config.api.db.password,
  database: config.db.name
})

var client = mqtt.connect('mqtt://localhost')

client.on('connect', function () {
  client.subscribe({'#': 1})
})

client.on('message', function (topic, message, packet) {
  message = message.toString()

  try {
    message = JSON.parse(message)

    topic = topic.split('/')

    if (topic[1] === 'feeds' && topic[2] === 'probe') {
      var input
      var output
      var presented = false

      for (var ii = 0; ii < config.probe.length; ii++) {
        if (config.probe[ii].id === message.id) {
          input = config.probe[ii].calibration[0]
          output = config.probe[ii].calibration[1]

          presented = true
        }
      }

      if (presented) {
        for (var i = 0; i < message.d.length; i++) {
          var to_save = {}
          to_save.raw = parseInt(message.d[i][0], 10)
          to_save.value = Math.round((100 - multiMap(to_save.raw, input, output)) * 100) / 100 // round to two decimal places + invert
          var time = moment.unix(message.d[i][1]).format('x')
          to_save.time = time
          to_save.id = parseInt(message.id, 10)
          to_save.recno = parseInt(message.r - i, 10)

          if (message.hasOwnProperty('v')) to_save.voltage = parseFloat(parseInt(message.v, 10) / 10)
          if (message.hasOwnProperty('t')) to_save.temp = parseFloat(parseInt(message.t, 10) / 100)

          console.log(to_save)

          db.writePoint('probe', to_save, null, function (err, response) {
            if (!err) {
              console.log('Saved to db')
            } else {
              console.log('Error when saving to db', err)
            }
          })
        }
      } else {
        console.log('unknown probe')
      }
    } else {
      console.log('different topic')
    }
  } catch (e) {
    console.log(message, e)
  }
})

http.createServer(function (request, response) {
  if (request.url.substring(1) === 'time') {
    response.writeHead(200, {'Content-Type': 'text/plain'})
    response.end(Math.floor((Date.now()) / 1000).toString())
  } else {
    response.writeHead(404)
    response.end()
  }
}).listen(config.api.time_port)

function multiMap (val, _in, _out) {
  if (val <= _in[0]) return _out[0]
  if (val >= _in[_in.length - 1]) return _out[_in.length - 1]

  // search right interval
  var pos = 1
  while (val > _in[pos]) pos++

  // this will handle all exact "points" in the _in array
  if (val === _in[pos]) return _out[pos]

  // interpolate in the right segment for the rest
  return (val - _in[pos - 1]) * (_out[pos] - _out[pos - 1]) / (_in[pos] - _in[pos - 1]) + _out[pos - 1]
}
