var colors = require('colors/safe')
var io = require('../config/server').io

exports.info = function () {
  var message = ''

  for (var i = 1; i < arguments.length; ++i) {
    message += ' ' + convertToText(arguments[i])
  }

  io.emit('terminal', {type: 'info', name: arguments[0], msg: message})
  console.log(colors.green.inverse(arguments[0]), colors.green(message))
}

exports.error = function () {
  var message = ''

  for (var i = 1; i < arguments.length; ++i) {
    message += ' ' + convertToText(arguments[i])
  }

  io.emit('terminal', {type: 'error', name: arguments[0], msg: message})
  console.log(colors.red.inverse(arguments[0]), colors.red(message))
}

exports.warn = function () {
  var message = ''

  for (var i = 1; i < arguments.length; ++i) {
    message += ' ' + convertToText(arguments[i])
  }

  io.emit('terminal', {type: 'warning', name: arguments[0], msg: message})
  console.log(colors.yellow.inverse(arguments[0]), colors.yellow(message))
}

exports.debug = function () {
  var message = ''

  for (var i = 1; i < arguments.length; ++i) {
    message += ' ' + convertToText(arguments[i])
  }

  io.emit('terminal', {type: 'debug', name: arguments[0], msg: message})
  console.log(colors.grey.inverse(arguments[0]), colors.grey(message))
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
    string.push(JSON.stringify(obj))
  }

  return string.join(',')
}
