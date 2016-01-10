var logger = require('../lib/logger')
var io = require('../config/server').io
var valve_control = require('../lib/valve_control')

module.exports = function (router) {
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
      valve_control(data.valve, data.status)
    })
  })
}
