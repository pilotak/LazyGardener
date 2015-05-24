function valve_control (data){
	var valve = [
		[{object: new gpio(12, 'out'), id: 1}],
		[{object: new gpio(20, 'out'), id: 2}],
		[{object: new gpio(13, 'out'), id: 3}],
		[{object: new gpio(19, 'out'), id: 4}]
	];

	for (var i = 0; i < valve.length; i++) {
		//OFF
		var valve_id = valve[i][0].id;

		if(valve_id != data.valve || (data.status === 0 && valve_id == data.valve) || (data.all == 1 && data.status === 0)){
			valve[i][0].object.write(0, function(err){
				if (err) console.log("Valve error when switching OFF");
			});
		}
		else {//ON
			valve[i][0].object.write(1, function(err){
				if (err) console.log("valve error when switching ON");
			});
		}
	}

	if (data.valve !== undefined) {
		var timestamp = Math.floor(new Date().getTime()/1000);
		io.emit('chart-data-update', {
			type: "valve",
			sensor_id: data.valve,
			data: {
				status: data.status,
				timestamp: timestamp
			}
		});

		mysql.getConnection(function(err, connection) {
			connection.query('INSERT INTO valve (valve_id,status,timestamp) VALUES (?,?,?);', [data.valve, data.status, timestamp], function(err, rows) {
				if (err) {
					console.log("Error when saving into database");
				}
				connection.release();
			});
		});

		console.log("Valve", data.valve, "is now", data.status);
	}
}