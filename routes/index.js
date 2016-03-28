var io = require('../config/server').io
var valve_control = require('../lib/valve_control')
var config = require('../config/config')

module.exports = function (router) {
  router.route('/').get(function (req, res, next) {
    if (req.authenticated) {
      res.render('pages/index', {
        page: 'watering',
        title: 'Zavlažování',
        valves: config.valve
      })
    } else {
      res.status(401).send()
    }
  })

  io.on('connection', function (socket) {
    socket.on('valve', function (data) {
      valve_control(data.valve, data.status)
    })
  })
}
