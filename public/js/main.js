jQuery(document).ready(function() {
	
});

function charts(hours){
	jQuery(document).ready(function() {
		var chart = [
			{
				element: "chart1",
				title: "Zelenina",
				object: null,
				valve: 1,
				sensors: [2,3],
				events: [],
				data: []
			},
			{
				element: "chart2",
				title: "Ovoce",
				object: null,
				valve: 2,
				sensors: [10],
				events: [],
				data: []
			},
			{
				element: "chart3",
				title: "Kytičky",
				object: null,
				valve: 3,
				sensors: [11],
				events: [],
				data: []
			}
		];
		var timestamp = [[null], [null], [null]];

		var socket = io();
		
		socket.emit('request-chart-data', {hours: hours});

		socket.on('chart-data', function(chartData){
			//data
			for (var i = 0; i <= chartData[0].length - 1; i++) {
				for (var ii = 0; ii < chart.length; ii++) {
					var index = chart[ii].sensors.indexOf(chartData[0][i].sensor_id);
					if(index != -1){
						var toPush = {};

						for (var iii = 0; iii < chart[ii].sensors.length; iii++) {
							if (iii == index) {
								toPush["value" + iii] = chartData[0][i].value;
							}
							else {
								toPush["value" + iii] = undefined;
							}
							toPush["timestamp"] = chartData[0][i].timestamp;
						}

						chart[ii].data.push(toPush);
						//console.debug(JSON.stringify(chart[ii].data.value));
					}
				}
			}

			//events
			var first = true;

			for (var i = 0; i < chartData[1].length; i++) {
				for (var ii = 0; ii < chart.length; ii++) {
					if(chartData[1][i].valve_id == chart[ii].valve){
						if(first == true && chartData[1][i].status == 0){
						}
						else {
							if(chartData[1][i].status == 1) {
								timestamp[ii] = chartData[1][i].timestamp;
							}
							else {
								chart[ii].events.push([
									timestamp[ii],
									chartData[1][i].timestamp
								]);
								//timestamp[ii] = null
							}
						}
					}
					first = false;
				}
			}

			//generate charts
			for (var i = 0; i < chart.length; i++) {
				var len = chart[i].sensors.length;
				var keys = [];
				var labels = [];

				for (var key in chart[i].data[0]) {
					if(key != "timestamp"){
						keys.push(key);
						labels.push("Vlhkost");
					}
				}

				//console.debug(Object.keys(chart[i].data)[0]);

				var pointSize, lineWidth;


				switch(Math.abs(hours)){
					case 6:
						pointSize =  5;
						lineWidth =  4;
						break;
					case 24:
						pointSize =  4;
						lineWidth =  3;
						break;
					case 48:
						pointSize =  2;
						lineWidth =  2;
						break;
					case 64:
						pointSize =  2;
						lineWidth =  2;
						break;
				}

				chart[i].object = Morris.Line({
					element: chart[i].element,
					data: chart[i].data,
					xkey: 'timestamp',
					ykeys: keys,
					labels: labels,
					ymin: "auto",
					xmax: "auto",
					hideHover: 'auto',
					resize: true,
					events: chart[i].events,
					continuousLine: true,
					eventLineColors: ["#87B6E5"],
					lineColors: ["#009949","#80C944"],
					trendLineColors: ["#009949","#80C944"],
					gridTextFamily: "'Roboto Slab', serif",
					gridTextSize: 16,
					gridTextWeight: 700,
					gridTextColor: "#943323",
					pointSize: pointSize,
					lineWidth: lineWidth,
					postUnits: "%",
					xLabelFormat: function(x){
						/*var timestamp_milis = x*1000;
						var date = new Date(timestamp_milis);
						return date.format('hh:mm')*/
						return "";
					},
					dateFormat: function (x) {
						var timestamp_milis = x*1000;
						var date = new Date(timestamp_milis);
						return date.format('D.M. hh:mm:ss')
					}
				});

				//add title for chart
				$("#"+chart[i].element).before("<h1>"+chart[i].title);

				//add buttons to start/stop watering
				$("#"+chart[i].element).after(function(){
					var to_return;

					to_return = "<div class='row control'><div class='col-sm-6'><div class='buttons'>";
					to_return += "<button data-status='1' data-valve='"+chart[i].valve+"'>Zalít</button><button data-status='0' data-valve='"+chart[i].valve+"'>Vypnout</button>";
					to_return += "</div></div><div class='col-sm-6'><p>Naposledy zalito: <time datetime=''></time></p></div></div>";

					return to_return;
				});
				console.debug("chart:" + JSON.stringify(chart[i].sensors));
			}

			//last on
			for (var i = 0; i < chartData[2].length; i++) {
				for (var ii = 0; ii < chart.length; ii++) {
					if(chart[ii].valve == chartData[2][i].valve_id){
						var time = new Date(chartData[2][i].timestamp*1000);

						var $element = $("#"+chart[ii].element).next().find("time");

						$element.attr("datetime", time.format("iso"));
						$element.text(time.format("D.M. hh:mm:ss"));
						$element.timeago();
					}
				}
			}
		});

		socket.on('chart-data-update', function(array){
			console.debug(array);
			for (var ii = 0; ii < chart.length; ii++) {
				if(array.type == "data"){
					var index = chart[ii].sensors.indexOf(array.sensor_id);

					if(index != -1){
						var toPush = {};
						toPush["value" + index] = array.data.value;
						toPush["timestamp"] = array.data.timestamp;

						chart[ii].data.splice(0,1);
						chart[ii].data.push(toPush);
						console.debug(JSON.stringify(toPush));

						while(chart[ii].events.length > 0){
							if(chart[ii].events[0][0] < chart[ii].data[0].timestamp){
								chart[ii].events.splice(0, 1);
							}
							else {
								break;
							}
						}
						chart[ii].object.setData(chart[ii].data);
					}
				}
				else if(array.type == "valve"){
					if(chart[ii].valve == array.sensor_id){
						if (array.data.status == 1) {
							chart[ii].events.push(array.data.timestamp);

							//update timeago
							$("#"+chart[ii].element).next().find("time").data("timeago", { datetime: new Date(array.data.timestamp*1000) });
						}
						else {
							var length = chart[ii].events.length;

							if (length > 0) {
								var start_timestamp = chart[ii].events[length - 1];

								if (!(start_timestamp instanceof Array)) {
									chart[ii].events.splice(-1,1);
									chart[ii].events.push([start_timestamp, array.data.timestamp]);
								}
							}
							
						}
						
						chart[ii].object.options.events = chart[ii].events;
						chart[ii].object.setData(chart[ii].data);
					}
				}
			}
		});
		$("body").on("click", ".buttons button", function(event) {
			socket.emit('valve', {valve: $(this).data("valve"), status: $(this).data("status")});
		});
	});
}
function weather(rain_gauge_precision){
	jQuery(document).ready(function() {
		var tempChart = [
			{
				element: "chart3",
				title: "Teplota ovládací desky",
				object: null,
				id: 0,
				data: [],
				colour: ["#F3931A"]
			}
		];
		var rainChart = {
			element: "chart1",
			title: "Srážky",
			object: null,
			data: []
		};
		var socket = io();

		socket.emit('request-weather-data', {});

		socket.on('weather-data', function(data){

			// Fill "dry days" with zero
			for (var i = 0; i < data[0].length; i++) {
				var day = data[0][i].datetime.date("D");
				var next_record = i+1;

				if (next_record < data[0].length) {
					var next_day = data[0][next_record].datetime;

					if (Number(day)+1 == next_day.date("D")) {
						rainChart.data.push({datetime: data[0][i].datetime.date("YYYY-MM-DD"), value: (data[0][i].value)*rain_gauge_precision});
					}
					else { // fill with zero until next available day
						var start = new Date(data[0][i].datetime);
						var end = new Date(next_day);

						while(start < end){
							rainChart.data.push({datetime: start.format("YYYY-MM-DD"), value: 0});           

							var newDate = start.setDate(start.getDate() + 1);
							start = new Date(newDate);
						}
					}
				}
				else { // last record
					rainChart.data.push({datetime: data[0][i].datetime.date("YYYY-MM-DD"), value: data[0][i].value});
				}
			}

			rainChart.object = Morris.Bar({
				element: rainChart.element,
				data: rainChart.data,
				xkey: 'datetime',
				ykeys: ['value'],
				labels: ['Srážky'],
				hideHover: 'auto',
				postUnits: " mm",
				resize: true,
				xLabelAngle: 30,
				barColors: ["#87B6E5"],
				gridTextFamily: "'Roboto Slab', serif",
				gridTextSize: 14,
				gridTextWeight: 300,
				gridTextColor: "#943323",
				xLabelFormat: function(x){
					return x.src.datetime.date("D.M.");
				}
			});
			$("#"+rainChart.element).before("<h1>"+rainChart.title);

			/*======================================================================*/
			// Add temperature data to array
			for (var i = 0; i <= data[1].length - 1; i++) {
				for (var ii = 0; ii < tempChart.length; ii++) {
					if(tempChart[ii].id == data[1][i].temp_id){
						tempChart[ii].data.push({timestamp: data[1][i].timestamp, temp: data[1][i].temp});
					}
				}
			}

			// Generate charts for temperature
			for (var i = 0; i < tempChart.length; i++) {
				tempChart[i].object = Morris.Area({
					element: tempChart[i].element,
					data: tempChart[i].data,
					xkey: 'timestamp',
					ykeys: ['temp'],
					labels: ["Teplota"],
					ymin: "auto",
					xmax: "auto",
					hideHover: 'auto',
					resize: true,
					lineColors: tempChart[i].colour,
					trendLineColors: tempChart[i].colour,
					gridTextFamily: "'Roboto Slab', serif",
					gridTextSize: 14,
					gridTextWeight: 300,
					gridTextColor: "#943323",
					pointSize: 4,
					lineWidth: 3,
					behaveLikeLine: true,
					xLabelFormat: function(x){
						var timestamp_milis = x*1000;
						var date = new Date(timestamp_milis);
						return date.format('hh:mm')
					},
					yLabelFormat: function (y) {
						return y.toFixed(2).toString() + " °C";
					},
					dateFormat: function (x) {
						var timestamp_milis = x*1000;
						var date = new Date(timestamp_milis);
						return date.format('D.M. hh:mm')
					}
				});

				$("#"+tempChart[i].element).before("<h1>"+tempChart[i].title);
			}
		});
		socket.on('temp-update', function(data){
			for (var i = 0; i < tempChart.length; i++) {
				if(tempChart[i].id == data.temp_id){
					tempChart[i].data.push({timestamp: data.timestamp, temp: data.temp});

					tempChart[i].data.splice(0,1);
					tempChart[i].object.setData(tempChart[i].data);
				}
			}
		});
		socket.on('rain-update', function(data){
			var index = null;

			// get index of incoming day; start from end
			for (var i = rainChart.data.length - 1; i >= 0; i--) {
				if(rainChart.data[i].datetime == data.datetime){
					index = i;
					break;
				}
			}

			if(!!index){
				var value = rainChart.data[index].value;
				rainChart.data[index].value = value+rain_gauge_precision;
			}
			else {
				rainChart.data.splice(0,1);
				rainChart.data.push({datetime: data.datetime, value: rain_gauge_precision});
			}
			rainChart.object.setData(rainChart.data);
		});
	});
}
