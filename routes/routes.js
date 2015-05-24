module.exports = function(app, io, mysql, rain_gauge_precision){

	app.get('/', function(req, res, next) {
		var hour = req.body.hour;
		res.render('pages/index', {
			page: "watering",
			title: 'Zavlažování',
			hours: (req.query.hours ? req.query.hours : 6)
		});
	});
	app.get('/raw', function(req, res, next) {
		res.render('pages/raw', {
			page: "raw",
			title: 'RAW data'
		});
	});
	app.get('/weather', function(req, res, next) {
		res.render('pages/weather', {
			page: "weather",
			title: 'Počasí',
			hours: 0,
			rain_gauge_precision: rain_gauge_precision
		});
	});
	app.get('/rf', function(req, res, next) {
		res.render('pages/rf', {
			page: "rf",
			title: 'zkouška',
		});
	});
};