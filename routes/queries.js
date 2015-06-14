module.exports = function(io, mysql){
	io.sockets.on('connection', function(socket){
		socket.on('request-chart-data', function (data) {
			mysql.getConnection(function(err, connection) {
				connection.query("SELECT * FROM (SELECT sensor_id, value, timestamp FROM probes WHERE timestamp > UNIX_TIMESTAMP(TIMESTAMPADD( HOUR, ?, NOW())) ORDER BY timestamp DESC) as result ORDER by timestamp ASC;", [data.hours], function(err1, probe_result) {
					if (err1) {
						console.log("Error when selecting from database");
					}

					connection.query("SELECT * FROM (SELECT valve_id, status, timestamp FROM valve WHERE timestamp > UNIX_TIMESTAMP(TIMESTAMPADD( HOUR, ?, NOW())) ORDER BY timestamp DESC) as result ORDER by timestamp ASC;", [data.hours], function(err2, valve_result) {
						if (err2) {
							console.log("Error when selecting from database");
						}

						connection.query("SELECT valve_id, status, timestamp FROM valve a WHERE a.timestamp = (SELECT MAX(timestamp) timestamp FROM valve b WHERE a.valve_id = b.valve_id AND status=1);", [data.hours], function(err3, last_on_result) {
							if (err3) {
								console.log("Error when selecting from database");
							}
							connection.release();

							io.emit("chart-data", [probe_result,valve_result,last_on_result]);
						});
					});
				});
			});
		});

		socket.on('request-weather-data', function (data) {
			mysql.getConnection(function(err, connection) {
				connection.query("SELECT * FROM (SELECT DATE(FROM_UNIXTIME(timestamp)) AS datetime, COUNT(*) AS value FROM rain GROUP BY DATE(FROM_UNIXTIME(timestamp)) ORDER BY datetime DESC) as result ORDER BY datetime LIMIT 30;", function(err, rain) {
					if (err) {
						console.log("Error when selecting from database");
					}

					connection.query("SELECT * FROM (SELECT temp_id, temp, timestamp FROM temperature WHERE timestamp > UNIX_TIMESTAMP(TIMESTAMPADD( HOUR, -24, NOW())) ORDER BY timestamp DESC) as result ORDER by timestamp ASC;", function(err2, temp) {
						if (err2) {
							console.log("Error when selecting from database");
						}
						connection.release();
						io.emit("weather-data", [rain, temp]);
					});
				});
			});
		});
    });
};

