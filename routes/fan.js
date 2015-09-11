module.exports = function(config, io, gpio, mysql, cron){
	var ds18b20		= require('ds18b20'),
		fan			= new gpio(config.fan_pin, 'out'),
		fanStatus	= 0;

	fan.write(fanStatus, function(fanErr){
		if (fanErr) console.log("Fan switch error");
	});

	new cron('*/3 * * * *', function(){
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

	}, null, true);
};
