self.onmessage = function (event) {
	process(event.data);
}

var i = 0;
function process(data) {
	postMessage(data[i]);
	i = i + 10;
	if (i < data.length) {
		setTimeout(function(){ process(data) }, 0.5);
	} else {
		postMessage('done');
		return true;
	}
}