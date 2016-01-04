var logger = require('../lib/logger')
var io = require('../config/server').io
var valve_control = require('../lib/valve_control')

module.exports = function (router) {
  /*
  'use strict'
  // This will handle the url calls for /users/:user_id
  router.route('/:userId')
  .get(function(req, res, next) {
    // Return user
  })
  .put(function(req, res, next) {
    // Update user
  })
  .patch(function(req, res,next) {
    // Patch
  })
  .delete(function(req, res, next) {
    // Delete record
  });*/

  router.route('/').get(function (req, res, next) {
    res.render('pages/index', {
      page: 'watering',
      title: 'Zavlažování',
      hours: (req.query.hours ? req.query.hours : 6)
    })
  })

  io.on('connection', function (socket) {
    socket.on('request-chart-data', function (data) {
      logger.debug('SOCKET', 'request-chart-data:', data)
    })

    socket.on('valve', function (data) {
      valve_control(data.id, data.status);  
    })
  })
}
