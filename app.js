var express        = require('express'),
	app            = express(),
	path           = require('path'),
	favicon        = require('serve-favicon'),
	bodyParser     = require('body-parser'),
	io             = require('socket.io').listen(app.listen(3000)),
	gpio           = require('onoff').Gpio,
	config         = require('./config/config'),
	login          = require('./routes/login'),
	cron           = require('cron').CronJob,
	fs             = require('fs'),
	i2c            = require('i2c'),
	nrf            = require("nrf").connect(config.spiDev, config.cePin, config.irqPin);


var mysql = require('mysql').createPool({
	host     : config.mysql_host,
	user     : config.mysql_user,
	password : config.mysql_pass,
	database : config.mysql_db
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/img/favicon.png'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use('/', login.basicAuth(config.www_user, config.www_pass));


nrf.setStates({EN_DPL: 0});
nrf.channel(0x4c).transmitPower('PA_MAX').dataRate('1Mbps').crcBytes(2).autoRetransmit({count:15, delay:4000}).begin(function () {
	var rx = nrf.openPipe('rx', config.pipes[0]),
	tx = nrf.openPipe('tx', config.pipes[0]);

	function send(data){
		console.log("Sending...", data);
		data = data.split("").reverse().join("");
		tx.write(String(data));
	}

	require('./routes/rf')(config, app, io, mysql, rx, tx, send, fs, i2c);

	tx.on('error', function (e) {
		console.log("Error sending: ", e);
	});

	
	tx.on('ready', function(e){
		console.log("Ready to go...");
		//nrf.printDetails();
	});
});

require('./routes/routes')(app, io, mysql, config.rain_gauge_precision);
require('./routes/weather')(config, io, gpio, mysql, cron, i2c);
require('./routes/gpio')(config, io, gpio, mysql, i2c);
require('./routes/queries')(io, mysql);
require('./routes/mail')(config, mysql, cron);

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