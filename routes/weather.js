module.exports = function(io, gpio, mysql, cron, i2c){
	var ds18b20 = require('ds18b20');
	var fan = new gpio(26, 'out');
	var fanStatus = 0;
	var address = ['28-000003b2d8fe', '28-000004a84917'];
	var ATtiny = new i2c(0x18, {device: '/dev/i2c-1', debug: false});
		ATtiny.setAddress(0x4);


	fan.write(fanStatus, function(fanErr){
		if (fanErr) console.log("Fan switch error");
	});

	new cron('*/20 * * * *', function(){/*28-000004a84917*/
		ds18b20.temperature(address[0], function(tempErr, value) {
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

		ds18b20.temperature(address[1], function(tempErr, value) {
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
				console.log(value, "-", value2);
			}
			else {
				console.log("I2C error when requesting from ATtiny:", err);
			}
		});


	}, null, true);
};
