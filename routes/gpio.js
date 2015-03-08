module.exports = function(io, gpio, mysql, valve_control){
	var dateFormat	= require('date-format-lite');
	var max_on_time = 1000*60*15; //15 minute
	var button = new gpio(5, 'in', 'both');
	var event;

	button.watch(function(err, state) {
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
				}, max_on_time);
			}
			else {
				clearTimeout(event);
			}
		});
	});


};