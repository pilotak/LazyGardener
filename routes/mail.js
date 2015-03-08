module.exports = function(mysql, cron){
	var util = require('util');
	var gmail = require('nodemailer').createTransport({
		service: 'Gmail',
		auth: {
			user: '***@gmail.com',
			pass: '****'
		}
	});

	var mailOptions = {
		from: '***@gmail.com',
		to: '***@gmail.com',
		subject: 'LazyGardener: Baterie jsou téměr vybité',
		text: '',
		html: ''
	};

	var interval = 10; // hours

	Date.prototype.minusHours= function(h){
		this.setHours(this.getHours()-h);
		return this;
	};
	
	// Check low battery voltage and send email
	new cron('*/1 * * * *', function(){ //   0 */3 * * *
		mysql.getConnection(function(err, connection) {
			connection.query("SELECT probes.sensor_id, voltage, timestamp FROM probes JOIN (SELECT sensor_id, MAX(id) id FROM probes GROUP BY sensor_id) t2 ON probes.id = t2.id AND probes.sensor_id = t2.sensor_id;", function(err, array) {
				if (err) {
					console.log("Error when selecting from database probe details for email");
				}

				for (var i = array.length - 1; i >= 0; i--) {
					if(array[i].voltage < 2.1 && !!voltage){ //1.9V is dead voltage; exclude sensors powered from electrical outlet
						var sensor_id = array[i].sensor_id;
						var voltage = array[i].voltage;
						console.log("Sensor id:", sensor_id, "Low voltage:",voltage);

						connection.query("SELECT timestamp FROM emails WHERE sensor_id = ? ORDER BY id DESC LIMIT 1;", [sensor_id], function(err2, result) {
							if (err2) {
								console.log("Error when selecting last emails from database");
							}
							
							if(result.length === 0 || (new Date((result.timestamp*1000)) <= new Date().minusHours(interval))){
								connection.query("INSERT INTO emails (sensor_id,timestamp) VALUES (?,?);", [sensor_id, Math.floor(Date.now()/1000)], function(err3, row) {
									if (err3) {
										console.log("Error when inserting email into database");
									}

									mailOptions.html = util.format("Baterie sensoru '%d' jsou téměř vybité: %d V", sensor_id, voltage);
									/*gmail.sendMail(mailOptions, function(error, info){
										if(!error){
											console.log('Message sent: ' + info.response);
										}
										else{
											console.log("Error when sending email:", error);
										}
									});*/
								});
							}
						});
					}
				}
				connection.release();
			});
		});
	}, null, true);
};

