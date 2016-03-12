var colors = require('colors/safe')
var io = require('../config/server').io
var config = require('../config/config')
var moment = require('moment')

moment.locale(config.general.lng)

exports.info = function () {
  send('info', arguments)
}

exports.error = function () {
  send('error', arguments)
}

exports.warn = function () {
  send('warning', arguments)
}

exports.debug = function () {
  send('debug', arguments)
}

function send (type, data) {
  var message = ''

  for (var i = 1; i < data.length; ++i) {
    message += ' ' + convertToText(data[i])
  }

  var output = {type: type, name: data[0], msg: message, datetime: moment().toISOString(), title: moment().format('LLL')}
  io.emit('terminal', output)

  if (type === 'info') console.log(colors.green.inverse(data[0]), colors.green(message))
  else if (type === 'warning') console.log(colors.yellow.inverse(data[0]), colors.yellow(message))
  else if (type === 'error') console.log(colors.red.inverse(data[0]), colors.red(message))
  else if (type === 'debug' && config.general.show_debug) console.log(colors.grey.inverse(data[0]), colors.grey(message))

  delete output.title
}

function convertToText (obj) {
  // create an array that will later be joined into a string.
  var string = []

  // is object
  //    Both arrays and objects seem to return "object"
  //    when typeof(obj) is applied to them. So instead
  //    I am checking to see if they have the property
  //    join, which normal objects don't have but
  //    arrays do.
  if (obj == undefined) {
    return String(obj)
  } else if (typeof (obj) === 'object' && (obj.join == undefined)) {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        string.push(prop + ': ' + convertToText(obj[prop]))
      }
    }
    return '{' + string.join(',') + '}'

  // is array
  } else if (typeof (obj) === 'object' && !(obj.join == undefined)) {
    for (var props in obj) {
      string.push(convertToText(obj[props]))
    }
    return '[' + string.join(',') + ']'

  // is function
  } else if (typeof (obj) === 'function') {
    string.push(obj.toString())

  // all other values can be done with JSON.stringify
  } else if (typeof (obj) === 'string') {
    string.push(obj)
  } else {
    string.push(JSON.stringify(obj, null, '\t'))
  }

  return string.join(',')
}
