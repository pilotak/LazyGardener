var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var config = require('./config')

http.listen(config.frontend.port, function () {
  console.log('SERVER', 'is ready')
})

module.exports.app = app
module.exports.io = io
module.exports.express = express
