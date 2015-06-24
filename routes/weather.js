module.exports = function(config, io, gpio, mysql, cron, i2c){
	var ds18b20		= require('ds18b20'),
		fan			= new gpio(config.fan_pin, 'out'),
		fanStatus	= 0;


	var ATtiny      = new i2c(config.i2c_this, {device: config.i2cDev, debug: false});
		ATtiny.setAddress(config.ATtiny_addr);


	fan.write(fanStatus, function(fanErr){
		if (fanErr) console.log("Fan switch error");
	});

	new cron('*/20 * * * *', function(){
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
				});
			}
			else {
				console.log("Error when reading temperature");
			}
		});

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
					});
				});
			}
			else {
				console.log("Error when reading temperature");
			}
		});


		ATtiny.readBytes(2,4,function(err, res) { // function 2, request 4 bytes
			if(err === null){
				var value = res[0] << 8 | res[1];
				var value2 = res[2] << 8 | res[3];
				console.log("Reading analog value from I2C:", value, ";", value2);
			}
			else {
				console.log("I2C error when requesting from ATtiny:", err);
			}
		});


	}, null, true);
};
