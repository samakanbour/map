var w;
var map;
var titles;
var cities;
var markers;

$(document).ready(function () {
	google.maps.event.addDomListener(window, 'load', initialize);
	function initialize() {
		var styles = [ { stylers: [ { hue: "#00ffe6" }, { saturation: -20 } ] },
			{ featureType: "road", elementType: "geometry", stylers: [{ lightness: 100 }, { visibility: "simplified" } ] },
			{ featureType: "road", elementType: "labels", stylers: [ { visibility: "off" } ] } ];
		var styledMap = new google.maps.StyledMapType(styles, {name: "Styled Map"});
		var mapOptions = { zoom: 2, center: new google.maps.LatLng(28.0000, 2.0000), 
			mapTypeControlOptions: { mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style'] } };
		map = new google.maps.Map($('article')[0], mapOptions);
		map.mapTypes.set('map_style', styledMap);
  		map.setMapTypeId('map_style');
	}
	$("#name").keyup(function() { findByName(); });
	$("#city").keyup(function() { findByCity(); });
});

function reset(){
	$('#name').val(''); $('#city').val(''); 
	$('#name').typeahead('setQuery', '');
	$('#city').typeahead('setQuery', '');
	zoom(2, new google.maps.LatLng(28.0000, 2.0000));
}

function zoom(n, position){
	var z = map.getZoom();
	if (z < n) {
		z += 1; map.setZoom(z); setTimeout(function(){ zoom(n, position) }, 50);
	} else if (z > n) {
		z -= 1; map.setZoom(z); setTimeout(function(){ zoom(n, position) }, 50);
	} else {
		map.setCenter(position);
	}
}

function startWorker(output) {
	if (typeof(Worker) !== "undefined") {
		if (typeof(w) == "undefined") {
			w = new Worker("js/worker.js");
		}
		titles = {};
		cities = {};
		markers = [];
		w.postMessage(output);
		var icon = {
			url: 'img/marker.png',
			size: new google.maps.Size(10,10),
			origin: new google.maps.Point(0,0),
			anchor: new google.maps.Point(5,5)	
		};
		w.onmessage = function (event){
			if (event.data == 'done') {
				stopWorker();
			} else {
				var details = event.data.split('~');
				if (details.length > 1) {
					var title = details[1];
					var city = details[4];
					if (city && city.length > 0) {
						while (city[0] == ',') {city = city.slice(1);}
						city = city.replace(/,/g,", ");
						var marker = new google.maps.Marker({
							map: map,
							icon: icon,
							position: new google.maps.LatLng(details[12], details[13]),
							title: title
						});
						titles[title] = marker;
						if (Object.keys(cities).indexOf(city) == -1) {
							cities[city] = marker;
						}
						google.maps.event.addListener(marker, 'click', function() {
							zoom(15, this.getPosition());
						});
						markers.push(marker);
					}
				}
			}
		}
	}
}

function stopWorker(){
	w.terminate();
	var markerCluster = new MarkerClusterer(map, markers);
	$('#name').typeahead({ local: Object.keys(titles).sort() });
	$('#city').typeahead({ local: Object.keys(cities).sort() }); 
}

function readText(file){
	if(file.files && file.files[0]){
		var reader = new FileReader();
		reader.readAsText(file.files[0]);
		reader.onload = function (e) {  
			var output = e.target.result;		
			output = output.split("\n");
			startWorker(output);
			return true;
		}
	} return false;
}

function selectMarker(marker, z){
	map.setZoom(z);
	map.setCenter(marker.getPosition());
}

function findByName(){		
	var title = $.trim($("#name").val());
	if (title.length > 0 && title in titles) {
		selectMarker(titles[title], 12);
	}
}

function findByCity(){		
	var city = $.trim($("#city").val());
	if (city.length > 0 && city in cities) {
		selectMarker(cities[city], 8);
	}
}