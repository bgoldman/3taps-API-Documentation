if (typeof require != 'undefined') {
	var threeTapsClientLib = require('./3taps-client');
	var threeTapsClient = threeTapsClientLib.threeTapsClient;
}

var threeTaps = function(authId, agentId) {
	this.client = new threeTapsClient(authId, agentId);
	
	for (var type in threeTaps.apis) {
		var api = threeTaps.apis[type];
		this[type] = new api(this);
	}
};

threeTaps.apis = {};

threeTaps.register = function(type, api) {
	threeTaps.apis[type] = api;
};

threeTaps.prototype = {
	_getReferenceData: function(reference, callback) {
		return this._request('reference', reference + '/get', null, null, function(unkeyedResults) {
			if (!unkeyedResults) {
				callback(null);
				return;
			}
			
			if (!unkeyedResults[1] || unkeyedResults[1].length == 0) {
				callback(null);
				return;
			}
			
			var unkeyed_keys = unkeyedResults[0];
			var keys = [];

			for (var i in unkeyed_keys) {
				var key = unkeyed_keys[i];
				keys.push(key[0]);
			}

			var results = [];
			
			for (var key in unkeyedResults[1]) {
				var unkeyedResult = unkeyedResults[1][key];
				var result = {};
				
				for (var i in keys) {
					var key = keys[i];
					result[key] = unkeyedResult[i];
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
		
		callback(null);
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
	}
};

/**
	Three Taps Posting
 */

var threeTapsPosting = function(authId, agentId) {
	if (authId instanceof threeTaps) {
		this.api = authId;
	} else {
		this.api = new threeTaps(authId, agentId);
	}
};

threeTapsPosting.prototype = {
	api: null,
	
	checkduplicates: function(src, externalIDs, callback) {
		externalIDsJSON = JSON.stringify(externalIDs);
		return this.api.client.posting.checkduplicates(src, externalIDsJSON, function(unkeyedResults) {
			if (!unkeyedResults) {
				callback(null);
				return;
			}
			
			var results = {};
			
			for (var key in externalIDs) {
				var id = externalIDs[key];
				results[id] = unkeyedResults[key];
			}
	
			callback(results);
		});
	},
	
	'delete': function(IDs, callback) {
		var data = JSON.stringify(IDs);
		return this.api.client.posting['delete'](data, function(unkeyedResults) {
			if (!unkeyedResults) {
				callback(null);
				return;
			}
			
			var results = {};
			
			for (var key in IDs) {
				var id = IDs[key];
				results[id] = unkeyedResults[key];
			}
	
			callback(results);
		});
	},
	
	get: function(id, callback) {
		return this.api.client.posting.get(id, function(result) {
			if (JSON.stringify(result) == '{}') {
				callback(null);
				return;
			}
			
			callback(result);
		});
	},
	
	post: function(posts, callback) {
		if (posts.length == 0) {
			callback(null);
			return;
		}
		
		var fields = [];
		
		for (var key in posts[0]) {
			fields.push(key);
		}
		
		var postsArray = [];
		
		for (var i in posts) {
			var post = posts[i];
			var unkeyedPost = [];
			
			for (var j in fields) {
				var key = fields[j];
				unkeyedPost.push(post[key]);
			}
			
			postsArray.push(unkeyedPost);
		}
		
		var data = JSON.stringify([fields, postsArray]);
		return this.api.client.posting.post(data, function(unkeyedResults) {
			console.log(unkeyedResults);
		});
	},
	
	'new': function(params, callback) {
		params = params || {};
		var retvals = params.retvals || 'category,location,source,heading,externalURL,timestamp';
		retvals = retvals.split(',');
		return this.api.client.search.new(params, function(unkeyedResults) {
			if (!unkeyedResults) {
				callback(null);
				return;
			}
			
			if (unkeyedResults.length < 3 || !unkeyedResults[2] || unkeyedResults[2].length == 0) {
				callback(null);
				return;
			}
			
			var results = [];
			
			for (var key in unkeyedResults[2]) {
				var unkeyedResult = unkeyedResults[2][key];
				var result = {};
				
				for (var i in retvals) {
					var key = retvals[i];
					result[key] = unkeyedResult[i];
				}
				
				results.push(result);
			}
	
			callback(results);
		});
	}
};

threeTaps.register('posting', threeTapsPosting);

/**
	Three Taps Search
 */

var threeTapsSearch = function(authId, agentId) {
	if (authId instanceof threeTaps) {
		this.api = authId;
	} else {
		this.api = new threeTaps(authId, agentId);
	}
};

threeTapsSearch.prototype = {
	api: null,
	
	'new': function(params, callback) {
		params = params || {};
		var retvals = params.retvals || 'category,location,source,heading,externalURL,timestamp';
		retvals = retvals.split(',');
		return this.api.client.search.new(params, function(unkeyedResults) {
			if (!unkeyedResults) {
				callback(null);
				return;
			}
			
			if (unkeyedResults.length < 3 || !unkeyedResults[2] || unkeyedResults[2].length == 0) {
				callback(null);
				return;
			}
			
			var results = [];
			
			for (var key in unkeyedResults[2]) {
				var unkeyedResult = unkeyedResults[2][key];
				var result = {};
				
				for (var i in retvals) {
					var key = retvals[i];
					result[key] = unkeyedResult[i];
				}
				
				results.push(result);
			}
	
			callback(results);
		});
	}
};

threeTaps.register('search', threeTapsSearch);

exports.threeTaps = threeTaps;
