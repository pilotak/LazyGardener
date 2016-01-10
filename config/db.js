var influx = require('influx')
var config = require('./config')
var logger = require('../lib/logger')

var client = influx({
  host: config.db.host,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name
})

logger.info('DB', 'Connected')

module.exports = client
