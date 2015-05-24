module.exports = function(io, mysql, cron){
	var i2c = require('i2c');
	var wire = new i2c(0x18, {device: '/dev/i2c-1', debug: false});
		wire.setAddress(0x4);
	var wire2 = new i2c(0x18, {device: '/dev/i2c-1', debug: false});
		wire2.setAddress(0x4);

	/** Request two analog values
	**  FOR FUTURE PURPOSES
	**/
	/*new cron('*10 * * * * *', function(){
		wire.readBytes(2,4,function(err, res) { // function 2, request 4 bytes
			if(err === null){
				var value = res[0] << 8 | res[1];
				var value2 = res[2] << 8 | res[3];
				console.log(value, "-", value2);
			}
			else {
				console.log("I2C error when requesting:", err);
			}
		});
	}, null, true);*/

	io.sockets.on('connection', function(socket){
		socket.on('433mhz', function (data) {
			wire2.writeBytes(1,[data.id,data.value.charCodeAt(0)], function(err) { // function 1
				if(err === null){
					console.log("I2C sent:", data.id, data.value.charCodeAt(0));
				}
				else {
					console.log("I2C error when sending:", err);
				}
			});
			
		});
	});



	
};