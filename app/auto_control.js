var logger = require('../lib/logger')
var config = require('../config/config')
var db = require('../config/db')
var yrno = require('yr.no-forecast')
var Cron = require('cron').CronJob
var async = require('async')

new Cron(config.auto_control.interval, function(){
  async.waterfall([
  function get_weather(callback){
      yrno.getWeather({
        lat: config.auto_control.weather.lat,
        lon: config.auto_control.weather.lng
      }, function(err, location) {
        location.getCurrentSummary(function(err, data) {
          if(err === null){
            callback(null, {rain: parseFloat(data.rain.split(" ")[0])})
          }
          else {
            console.log("AUTO", "Can\'t retreave weather data");
              callback(new Error("chyba"))
          }
        });
      }, [1.9]);
  },
  function db_data(data, callback) {
    var valve = [
      {
        id: 1,
        last_on : new Date().getTime(),
        moisture : 40
      },
      {
        id: 2,
        last_on : new Date().getTime(),
        moisture : 20
      },
      {
        id: 3,
        last_on : new Date().getTime(),
        moisture : 30
      }
    ];

    data.valve = valve
      callback(null, data)
  }
],
function(err, results){
  var hour = moment().format("H")
  if(hour <= config.auto_control.hours.off && hour >= config.auto_control.hours.on) {
    console.log("Watering time")
    console.log("AUTO", "results", results);
  }
  else {
    console.log("no watering time")
  }
});
}, null, true);
