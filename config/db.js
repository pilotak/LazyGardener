var influx = require('influx')
var config = require('./config')
var logger = require('../lib/logger')

var client = influx({
  host: config.db.host,
  port: config.db.port,
  protocol: 'http',
  username: config.db.user,
  password: config.db.pass,
  database: config.db.name
})

logger.info('DB', 'Connected')

module.exports = client
