var proxy = function(method, req, res) {
	if (!req.query.url) {
		return;
	}

	var http = require('http');
	var url = require('url').parse(req.query.url);
	var urlString = url.pathname + (url.search || '');
	var proxy = http.createClient(80, url.hostname)
	var request = proxy.request(method, urlString, {
		'Content-Length': req.rawBody ? req.rawBody.length: 0
		,'Content-Type': 'application/x-www-form-urlencoded'
		,Host: url.hostname
	});
	request.on('response', function(result) {
		var data = '';
		result.on('data', function(chunk) {
			data += chunk;
		});
		result.on('end', function() {
			res.write(data);
			console.log(urlString);
			console.log(data);
			console.log(req.rawBody);
			res.end();
		});
		res.writeHead(result.statusCode, result.headers);
	});
	if (method == 'post' && req.rawBody) request.write(req.rawBody);
	request.end();
};

exports.controller = function(app, render) {
	app.get('/proxy', function(req, res){
		proxy('get', req, res);
	});
	
	app.post('/proxy', function(req, res){
		proxy('post', req, res);
	});
};
