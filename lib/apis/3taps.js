var threeTapsClient = function(authId, agentId) {
	this.agentId = agentId;
	this.authId = authId;
};

threeTapsClient.prototype = {
	agentId: null,
	authId: null,
	host: '3taps.net',
	response: null,
	
	endpoints: {
		geocoder: {
			auth: true
			,path: '/geocoder/'
		},
		posting: {
			auth: true
			,path: '/posting/'
		},
		reference: {
			auth: false
			,path: '/reference/'
		},
		search: {
			auth: false
			,path: '/search/'
		},
	},
	
	_getReferenceData: function(reference, callback) {
		return this._request('reference', reference + '/get', null, null, function(unkeyed_results) {
			if (!unkeyed_results) {
				callback(null);
				return;
			}
			
			if (!unkeyed_results[1] || unkeyed_results[1].length == 0) {
				callback(null);
				return;
			}
			
			var unkeyed_keys = unkeyed_results[0];
			var keys = [];

			for (var i in unkeyed_keys) {
				var key = unkeyed_keys[i];
				keys.push(key[0]);
			}

			var results = [];
			
			for (var key in unkeyed_results[1]) {
				var unkeyed_result = unkeyed_results[1][key];
				var result = {};
				
				for (var i in keys) {
					var key = keys[i];
					result[key] = unkeyed_result[i];
				}
				
				results.push(result);
			}
	
			callback(results);
		});
	},

	_request: function(api, method, getParams, postParams, callback) {
		postParams = postParams || {};
		
		var url = this.endpoints[api].path + method;
		
		if (this.endpoints[api].auth) {
			postParams.agentID = this.agentId;
			postParams.authID = this.authId;
		}

		if (typeof require == 'function') {
			var querystring = require('querystring');
			
			if (getParams) {
				url += '?' + querystring.stringify(getParams);
			}

			if (postParams) {
				var post = querystring.stringify(postParams);
			} else {
				var post = '';
			}
			
			var http = require('http');
			var client = http.createClient(80, this.host);
			
			if (!client) {
				return false;
			}

			var request = client.request('post', url, {
				'Content-Length': post.length
				,'Content-Type': 'application/x-www-form-urlencoded'
				,Host: this.host
			});
			
			if (post.length > 0) foo = request.write(post);
			request.end();
			request.on('response', function(response) {
				var data = '';
				response.on('data', function(chunk) {
					data += chunk;
				});
				response.on('end', function() {
					var response = JSON.parse(data);
					callback(response);
				});
			});
			return true;
		} else if (typeof jQuery != 'undefined') {
			if (getParams) {
				url += '?' + $.param(getParams);
			}
			
			url = 'http://' + this.host + url;
			var proxy_url = '/proxy?url=' + encodeURIComponent(url);
			$.post(proxy_url, postParams, function(response) {
				callback(response);
			}, 'json');
			
			return true;
		}
		
		callback(false);
		return false;
	},
	
	checkDuplicates: function(source, externalIds, callback) {
		if (typeof externalIds == 'string') {
			externalIds = externalIds.split(',');
		}

		return this._request('posting', 'checkduplicates', null, {
			src: source
			,externalIDs: JSON.stringify(externalIds)
		}, callback);
	},
	
	geocodeAll: function(data, callback) {
		data = JSON.stringify(data);
		return this._request('geocoder', 'geocode', null, {data: data}, function(results) {
			var keys = ['code', 'latitude', 'longitude'];
			var locations = [];
			
			for (var i in results) {
				var result = results[i];
				var location = {};
				
				for (var j in keys) {
					location[keys[j]] = result[j];
				}
				
				locations.push(location);
			}
			
			callback(locations);
		});
	},
	
	geocodeOne: function(data, callback) {
		this.geocodeAll([data], function(response) {
			var item = response && response[0] || null;
			callback(item);
		});
	},
	
	get: function(postId, callback) {
		return this._request('posting', 'get/' + postId, null, null, callback);
	},
	
	getCategories: function(callback) {
		return this._getReferenceData('categories', callback);
	},
	
	getLocations: function(callback) {
		return this._getReferenceData('locations', callback);
	},
	
	getSources: function(callback) {
		return this._getReferenceData('sources', callback);
	},
	
	postAll: function(dataObjects, callback) {
		if (!dataObjects || dataObjects.length == 0) {
			return false;
		}
	
		var fields = [];
		var dataItems = [];
		
		var firstObject = dataObjects[0];

		for (var field in firstObject) {
			fields.push(field);
		}
		
		for (var key in dataObjects) {
			var object = dataObjects[key];
			var item = [];
			
			for (var field in object) {
				var value = object[field];
				items.push(value);
			}
			
			dataItems.push(item);
		}
		
		var data = [fields, dataItems];
		var json = JSON.stringify(data);
		return this._request('posting', 'post', null, {data: json}, callback);
	},
	
	postOne: function(dataObject, callback) {
		return this.postAll([dataObject], function(response) {
			var item = response && response[0] || null;
			callback(item);
		});
	},
	
	search: function(params, callback) {
		if (!params.retvals || params.retvals.length == 0) {
			params.retvals = 'source,postKey,price,category,location,heading,externalURL,timestamp';
		}
		
		return this._request('search', 'new', params, null, function(unkeyed_results) {
			if (!unkeyed_results) {
				callback(null);
				return;
			}
			
			var retvals = params.retvals.split(',');
			
			if (unkeyed_results.length < 3 || !unkeyed_results[2] || unkeyed_results[2].length == 0) {
				callback(null);
				return;
			}
			
			var results = [];
			
			for (var key in unkeyed_results[2]) {
				var unkeyed_result = unkeyed_results[2][key];
				var result = {};
				
				for (var i in retvals) {
					var key = retvals[i];
					result[key] = unkeyed_result[i];
				}
				
				results.push(result);
			}
	
			callback(results);
		});
	}
};

exports.threeTapsClient = threeTapsClient;
