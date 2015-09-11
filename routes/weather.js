module.exports = function(config, io, mysql, cron, i2c, async){
	var ds18b20		= require('ds18b20');

	var ATtiny      = new i2c(config.i2c_this, {device: config.i2cDev, debug: false});
		ATtiny.setAddress(config.ATtiny_addr);

	var	HTU21D		= require('htu21d-i2c'),
		humidity	= new HTU21D();

	var	BMP085		= require('bmp085'),
		barometer	= new BMP085({'mode': 3,'address': config.BMP085_addr, 'device': config.i2cDev});
	
	var BH1750		= require('bh1750'),
		light		= new BH1750({address: config.BH1750_addr, device: config.i2cDev, command: 0x10, length: 2});


	new cron('*/15 * * * *', function(){
		async.series([
			function(callback){
				
				callback(null, 1);
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
				/*ATtiny.readBytes(2,4,function(err, res) { // function 2, request 4 bytes
					if(err === null){
						var value = res[0] << 8 | res[1];
						var value2 = res[2] << 8 | res[3];
						console.log("Reading analog value from I2C:", value, ";", value2);
						callback(null, 3);
					}
					else {
						console.log("I2C error when requesting from ATtiny:", err);
					}
				});*/
				callback(null, 3);
			},
			function(callback){
				humidity.readTemperature(function (temp) {
				    console.log('Temperature, C:', temp);
				    callback(null, 4);
				});
			},
			function(callback){
			    humidity.readHumidity(function (humidity) {
			        console.log('Humidity, RH %:', humidity);
			        callback(null, 5);
			    });
			},
			function(callback){
			    barometer.read(function (data) {
				    console.log("Temperature:", data.temperature);
				    console.log("Pressure:", data.pressure.toFixed(2));
				    callback(null, 6);
				});
			},
	
			function(callback){
				light.readLight(function(value){
				    console.log("light", value);
				    callback(null, 7);
				});
			},
		]);
	}, null, true);
};
