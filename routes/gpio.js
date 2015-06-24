module.exports = function(config, io, gpio, mysql, i2c){
	var dateFormat	= require('date-format-lite'),
		max_on_time = 1000*60*15, //15 minute
		gauge		= new gpio(config.gaunge_pin, 'in', 'both'),
		event;

	//set all valves to off after restart
	valve_control({status: 0, all: 1});

	gauge.watch(function(err, state) {
		if (state) {
			console.log("Rain trigger");

			mysql.getConnection(function(err, connection) {
				connection.query('INSERT INTO rain (timestamp) VALUES (?);', [Math.floor(Date.now()/1000)], function(err, rows) {
					if (err) {
						console.log("Error when saving into database");
					}
					connection.release();

					io.emit("rain-update", {datetime: new Date().format("YYYY-MM-DD").toString()});
				});
			});
		}
	});

	io.sockets.on('connection', function(socket){
		socket.on('valve', function (data) {
			valve_control(data);

			if(data.status == 1){
				event = setTimeout(function(){
					valve_control({valve: data.valve, status: 0});
				}, config.valve_timout[(data.valve-1)]);
			}
			else {
				clearTimeout(event);
			}
		});
	});

	function valve_control (data){
		var valve		= [
				[{object: new gpio(config.valve1_pin, 'out'), id: 1}],
				[{object: new gpio(config.valve2_pin, 'out'), id: 2}],
				[{object: new gpio(config.valve3_pin, 'out'), id: 3}],
				[{object: new gpio(config.valve4_pin, 'out'), id: 4}]
			];

		var ATtiny      = new i2c(config.i2c_this, {device: config.i2cDev, debug: false});
			ATtiny.setAddress(config.ATtiny_addr);

		ATtiny.writeBytes(1,[config.remote_relay_id,data.status], function(err) { // function 1
			if(err === null){
				console.log("I2C sent:", config.remote_relay_id, data.status);
			}
			else {
				console.log("I2C error when sending:", err);
			}
		});

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

};