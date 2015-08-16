module.exports = function(config, io, gpio, mysql, cron, i2c, async){
	var ds18b20		= require('ds18b20'),
		fan			= new gpio(config.fan_pin, 'out'),
		bmp085 = require('bmp085-sensor'),
		pressure = bmp085({address: config.BMP085_addr, mode: 3});
		fanStatus	= 0;

	var ATtiny      = new i2c(config.i2c_this, {device: config.i2cDev, debug: false});
		ATtiny.setAddress(config.ATtiny_addr);
	var BMP085      = new i2c(config.i2c_this, {device: config.i2cDev, debug: false});
		BMP085.setAddress(config.BMP085_addr);
	var BH1750      = new i2c(config.i2c_this, {device: config.i2cDev, debug: false});
		BH1750.setAddress(config.BH1750_addr);
	var HTU21D      = new i2c(config.i2c_this, {device: config.i2cDev, debug: false});
		HTU21D.setAddress(config.HTU21D_addr);

	fan.write(fanStatus, function(fanErr){
		if (fanErr) console.log("Fan switch error");
	});

	new cron('*/20 * * * *', function(){
		async.series([
			function(callback){
				ds18b20.temperature(config.dallas_addr[0], function(tempErr, value) {
					if(!tempErr){
						var temp_id = 0;
						console.log("Temperature", temp_id, ":",value);

						var timestamp = Math.floor(Date.now()/1000);
						mysql.getConnection(function(conErr, connection) {
							connection.query('INSERT INTO temperature (temp_id, temp,timestamp) VALUES (?, ?, ?);', [temp_id, value, timestamp], function(tableErr, temp) {
								if (tableErr) {
									console.log("Error when saving temperature into database");
								}
								connection.release();

								io.emit("temp-update", {timestamp: timestamp, temp: value, temp_id: temp_id});
							});
						});

						if(value > 35) fanStatus = 1;
						else fanStatus = 0;

						fan.write(fanStatus, function(fanErr){
							if (fanErr) console.log("Fan switch error");
							callback(null, 1);
						});
					}
					else {
						console.log("Error when reading temperature");
					}
				});
				
			},
			function(callback){
				ds18b20.temperature(config.dallas_addr[1], function(tempErr, value) {
					if(!tempErr){
						var temp_id = 1;
						console.log("Temperature", temp_id, ":",value);

						var timestamp = Math.floor(Date.now()/1000);
						mysql.getConnection(function(conErr, connection) {
							connection.query('INSERT INTO temperature (temp_id, temp,timestamp) VALUES (?, ?, ?);', [temp_id, value, timestamp], function(tableErr, temp) {
								if (tableErr) {
									console.log("Error when saving temperature into database");
								}
								connection.release();

								io.emit("temp-update", {timestamp: timestamp, temp: value, temp_id: temp_id});
								callback(null, 2);
							});
						});
					}
					else {
						console.log("Error when reading temperature");
					}
				});
				
			},
			function(callback){
				ATtiny.readBytes(2,4,function(err, res) { // function 2, request 4 bytes
					if(err === null){
						var value = res[0] << 8 | res[1];
						var value2 = res[2] << 8 | res[3];
						console.log("Reading analog value from I2C:", value, ";", value2);
						callback(null, 3);
					}
					else {
						console.log("I2C error when requesting from ATtiny:", err);
					}
				});
			},
			/*function(callback){
				HTU21D.writeByte(0xF5, function(err) {
					if (err) {
						console.log("HTU21D:", err);
					}
					else {
						setTimeout(function() {
							HTU21D.read(3, function(err, data) {
								if (err) {
									console.log("HTU21D:", err);
								} else {
									if ((data.length === 3) && calc_crc8(data, 3)) {
										var rawhumi = ((data[0] << 8) | data[1]) & 0xFFFC;
										var humidity = ((rawhumi / 65536.0) * 125.0) - 6.0;
										console.log("Relative Humidity, %:", humidity);
										callback(null, 4);
									}
								}
							});
						}, 16);
					}
				});
			},*/
			/*function(callback){
				pressure.read(function (err, data) {
					console.log(data);
					callback(null, 5);
				});
			},*/
			/*function(callback){
				BH1750.writeByte(0x10, function(err) {
					if (err) {
						console.log("BH1750:", err);
					}
					else {
						setTimeout(function() {
							BH1750.readBytes(2, 2, function(err, data) {
								if (err) {
									console.log("BH1750:", err);
								} else {
									var value = res[0] << 8 | res[1];
									value = value/1.2;
									console.log(data, ":", value);
								}
								callback(null, 6);
							});
						}, 20);
					}
				});
			},*/
		]);
	}, null, true);


	function calc_crc8(buf, len){
		var dataandcrc;
		// Generator polynomial: x**8 + x**5 + x**4 + 1 = 1001 1000 1
		var poly = 0x98800000;
		var i;

		if (len === null) return -1;
		if (len != 3) return -1;
		if (buf === null) return -1;

		// Justify the data on the MSB side. Note the poly is also
		// justified the same way.
		dataandcrc = (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8);
		for (i = 0; i < 24; i++) {
			if (dataandcrc & 0x80000000)
				dataandcrc ^= poly;
			dataandcrc <<= 1;
		}
		return (dataandcrc === 0);
	}
};
