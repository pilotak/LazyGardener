module.exports = function(io, mysql, async){
	io.sockets.on('connection', function(socket){
		socket.on('request-chart-data', function (data) {
			mysql.getConnection(function(err, connection) {
				async.series([
					function(callback){
						connection.query("SELECT * FROM (SELECT sensor_id, value, timestamp FROM probes WHERE timestamp > UNIX_TIMESTAMP(TIMESTAMPADD( HOUR, ?, NOW())) ORDER BY timestamp DESC) as result ORDER by timestamp ASC;", [data.hours], function(err, probe_result) {
							if (err) {
								console.log("Error when selecting from database");
							}

							callback(null, probe_result);
						});
					},
					function(callback){
						connection.query("SELECT * FROM (SELECT valve_id, status, timestamp FROM valve WHERE timestamp > UNIX_TIMESTAMP(TIMESTAMPADD( HOUR, ?, NOW())) ORDER BY timestamp DESC) as result ORDER by timestamp ASC;", [data.hours], function(err, valve_result) {
							if (err) {
								console.log("Error when selecting from database");
							}

							callback(null, valve_result);
						});
					},
					function(callback){
						connection.query("SELECT valve_id, status, timestamp FROM valve a WHERE a.timestamp = (SELECT MAX(timestamp) timestamp FROM valve b WHERE a.valve_id = b.valve_id AND status=1);", [data.hours], function(err, last_on_result) {
							if (err) {
								console.log("Error when selecting from database");
							}

							callback(null, last_on_result);
						});
					}
				], function(error, results) {
					connection.release();

					io.emit("chart-data", results);
				});
			});
		});

		socket.on('request-weather-data', function (data) {
			mysql.getConnection(function(err, connection) {
				async.series([
					function(callback){
						connection.query("SELECT * FROM (SELECT DATE(FROM_UNIXTIME(timestamp)) AS datetime, COUNT(*) AS value FROM rain GROUP BY DATE(FROM_UNIXTIME(timestamp)) ORDER BY datetime DESC) as result ORDER BY datetime LIMIT 30;", function(err, rain) {
							if (err) {
								console.log("Error when selecting from database");
							}

							callback(null, rain);
						});

						
					},
					function(callback){
						connection.query("SELECT * FROM (SELECT temp_id, temp, timestamp FROM temperature WHERE timestamp > UNIX_TIMESTAMP(TIMESTAMPADD( HOUR, -24, NOW())) ORDER BY timestamp DESC) as result ORDER by timestamp ASC;", function(err, temp) {
							if (err) {
								console.log("Error when selecting from database");
							}

							callback(null, temp);
						});
					}
				], function(error, results) {
					connection.release();
					io.emit("weather-data", results);
				});
			});
		});
	});
};

