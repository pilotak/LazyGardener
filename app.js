var express        = require('express');
var app            = express();
var path           = require('path');
var favicon        = require('serve-favicon');
var bodyParser     = require('body-parser');
var io             = require('socket.io').listen(app.listen(3000));
var gpio           = require('onoff').Gpio;
var login          = require('./routes/login');
var cron           = require('cron').CronJob;
var fs             = require('fs');


var mysql = require('mysql').createPool({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'raspi'
});

var spiDev  = "/dev/spidev0.0";
var cePin   = 24;
var irqPin  = 25;
var pipes   = [0xF0F0F0F0E3, 0xF0F0F0F0E2];
var rain_gauge_precision = 0.3;
var user = "***";
var password = "***";

var nrf = require("nrf").connect(spiDev, cePin, irqPin);


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/img/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use('/', login.basicAuth(user, password));


nrf.setStates({EN_DPL: 0});
nrf.channel(0x4c).transmitPower('PA_MAX').dataRate('1Mbps').crcBytes(2).autoRetransmit({count:15, delay:4000}).begin(function () {
	var rx = nrf.openPipe('rx', pipes[0]),
	tx = nrf.openPipe('tx', pipes[0]);

	function send(data){
		console.log("Sending...", data);
		data = data.split("").reverse().join("");
		tx.write(String(data));
	}

	require('./routes/rf24')(app, io, mysql, rx, tx, send, fs);

	tx.on('error', function (e) {
		console.log("Error sending: ", e);
	});

	
	tx.on('ready', function(e){
		console.log("Ready to go...");
		//nrf.printDetails();
	});
});
//include custom functions
eval(fs.readFileSync(path.join(__dirname, 'js', 'node_functions.js'))+'');
//set all valves to off after restart
valve_control({status: 0, all: 1});

require('./routes/routes')(app, io, mysql, rain_gauge_precision);
require('./routes/temp')(io, gpio, mysql, cron);
require('./routes/gpio')(io, gpio, mysql, valve_control);
require('./routes/queries')(io, mysql);
require('./routes/mail')(mysql, cron);
require('./routes/i2c')(io, mysql, cron);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('pages/error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;