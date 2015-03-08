module.exports = function(io, mysql, cron){
	var ds18b20 = require('ds18b20');

	new cron('*/15 * * * *', function(){
		ds18b20.temperature('28-000003b2d8fe', function(err, value) {
			var temp_id = 0;
			console.log("Temperature", temp_id, ":",value);

			var timestamp = Math.floor(Date.now()/1000);
			mysql.getConnection(function(err, connection) {
				connection.query('INSERT INTO temperature (temp_id, temp,timestamp) VALUES (?, ?, ?);', [temp_id, value, timestamp], function(err, temp) {
					if (err) {
						console.log("Error when saving temperature into database");
					}
					connection.release();

					io.emit("temp-update", {timestamp: timestamp, temp: value, temp_id: temp_id});
				});
			});
		});
	}, null, true);
};
