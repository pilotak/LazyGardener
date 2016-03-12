var path = require('path')
var favicon = require('serve-favicon')
var bodyParser = require('body-parser')
var server = require('./config/server')
var config = require('./config/config')
var express = server.express
var app = server.app
var valve_control = require('./lib/valve_control')

// switch all valves off on start
valve_control(false, false)

// Configure express
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.use(favicon(path.join(__dirname, 'public', 'img', 'favicon.png')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'bower_components')))

// add routes
require('./routes/default')(app)

if (config.meteo_station.enabled === true) {
  require('./app/meteo')
}

if (config.fan.enabled === true) {
  require('./app/fan')
}

if (config.auto_control.enabled === true) {
  require('./app/auto_control')
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render(path.join('pages', 'error'), {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})
