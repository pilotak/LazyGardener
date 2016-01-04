var influx = require('influx')
var config = require('./config/config')
var async = require('async')

var client = influx({
  host: config.db.host,
  port: config.db.port,
  protocol: 'http',
  username: config.db.user,
  password: config.db.pass
})

client.createDatabase(config.db.name, function(err, result) {
  if(!err){
    console.log("Database has been created")
  }
  else {
    console.log("Error when creating database")
  }
})