module.exports = function(config, app, io, mysql, rx, tx, send, fs, i2c){
	var dateFormat	= require('date-format-lite'),
		path		= require('path'),
		util		= require('util');

	var ATtiny      = new i2c(config.i2c_this, {device: config.i2cDev, debug: false});
		ATtiny.setAddress(config.ATtiny_addr);

	io.sockets.on('connection', function(socket){
		socket.on('2.4ghz', function (data) {
			console.log('message: ' + data);
			send(data);
		});

		socket.on('433mhz', function (data) {
			ATtiny.writeBytes(1,[data.id,data.value], function(err) { // function 1
				if(err === null){
					console.log("I2C sent:", data.id, data.value);
				}
				else {
					console.log("I2C error when sending:", err);
				}
			});
		});
	});

	rx.on('data', function (d) {
		var now = new Date();
		var timestamp = Math.floor(now.getTime()/1000);
		var datetime = new Date(now.valueOf() + 1000*3600);
		datetime = datetime.format('YYYY-MM-DD hh:mm:ss');
		var raw = d.toString().split("").reverse().join("");
		var toWrite = util.format(datetime, " ", raw, "\n");
		var data = raw.split("/");
		//console.log(toWrite);

		if (data[0] > 0) {
			fs.appendFile(path.resolve(__dirname, "..", "logs", "rf24.log"), toWrite, encoding='utf8', function (err) {
				if (err){
					console.log("file writing error");
				}
			});

			mysql.getConnection(function(err, connection) {
				connection.query('INSERT INTO probes (sensor_id,value,voltage,timestamp) VALUES (?,?,?,?);', [data[0],data[2], data[3]/1000, timestamp], function(err, rows) {
					if (err) {
						console.log("Error when saving into database");
					}
					connection.release();
				});
			});

			io.emit('rf-data', {datetime: datetime, data: raw});
			if (data[0] > 0) {
				io.emit('chart-data-update', {
					type: "data",
					sensor_id: parseInt(data[0], 10),
					data: {
						value: parseInt(data[2], 10),
						timestamp: timestamp
					}
				});
			}
		}

		
	});
};