var threeTapsClient = function(authId, agentId) {
	this.agentId = agentId;
	this.authId = authId;
	
	for (var type in threeTapsClient.clients) {
		var client = threeTapsClient.clients[type];
		this[type] = new client(this);
	}
};

threeTapsClient.clients = {};

threeTapsClient.register = function(type, client) {
	threeTapsClient.clients[type] = client;
};

threeTapsClient.prototype = {
	agentId: null,
	authId: null,
	host: '3taps.net',
	response: null,

	request: function(path, method, getParams, postParams, callback) {
		postParams = postParams || {};
		var url = path + method;

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
					var response = data ? JSON.parse(data) : null;
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
	}
};

/**
 * @class The Geocoder API is a web service within the 3taps Network that allows other programs (both external systems and other parts of the 3taps Network) to calculate the location to use for a posting based on location-specific details within the posting such as a street address or a latitude and longitude value.  This process of calculating the location for a posting is known as geocoding.
 * @constructor
 */
var threeTapsGeocoderClient = function(authId, agentId) {
	if (authId instanceof threeTapsClient) {
		this.client = authId;
	} else {
		this.client = new threeTapsClient(authId, agentId);
	}
};

threeTapsGeocoderClient.prototype = {
	client: null,

	auth: true,
	path: '/geocoder/',
	
	/**
	 * @public

	 * @desc Calculate the location for a posting

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request.  Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
	 * @param {String} authID The authID value is a string which authorizes the external system to make this request.  The specific value to send will be defined when the external system is whitelisted.  For non-whitelisted systems, this should be left blank.
	 * @param {Array} data data should be a JSON-encoded array of postings to geocode.  Each entry in this array should be a JSON object containing one or more of the following:
	 * 
	 * latitude The GPS latitude value as a decimal degree.
	 * longitude The GPS longitude value as a decimal degree.
	 * country The name of the country.
	 * state The name or code of the state or region.
	 * city The name of the city.
	 * locality The name of a suburb, area or town within the specified city.
	 * street The full street address for this location.
	 * postal A zip or postal code.
	 * text An unstructured location or address value.
	 * 
	 * Note that, with the exception of the text and locality fields, this matches the structure used by Yahoo Pipes to represent locations; because many postings will come via Yahoo Pipes, using the same format will make the import process easier.  The text field should be used where unstructured address or location information is used; this field will be checked for all possible address tokens (city name, zip code, country name, etc).

	 * @return {Array} The body of the response will consist of a JSON-encoded array with one entry for each posting. Each array entry will itself be an array with three entries:
	 * 
	 * (locationCode, latitude, longitude)
	 * 
	 * where locationCode is the three-character location code to use for this posting, and latitude and longitude represent the calculated GPS coordinate for this posting’s location, in the form of floating-point numbers representing decimal degrees.
	 * 
	 * If the posting could not be geocoded at all, locationCode will be set to a null value.  If the geocoder was unable to calculate a lat/long value for the posting based on the supplied location details, latitude and longitude will be set to null values.
	 */
	geocode: function(data, callback) {
		var params = {
			agentID: this.client.agentId
			,authID: this.client.authId
			,data: data
		};
		return this.client.request(this.path, 'geocode', null, params, function(results) {
			callback(results);
		});
	}
};

threeTapsClient.register('geocoder', threeTapsGeocoderClient);

/**
 * @class The Reference API will provides a mechanism for accessing the standard "reference information" used by the 3taps system.
 * 
 * There are currently two types of reference information: the master list of locations, and the master list of search categories.  More types of reference information may be added in the future.
 * 
 * Reference information, for example the list of locations, is simply a flat list of records, where each record is a collection of fields.  Every record has the same fields, and each field has a name and a type associated with it.
 * 
 * The list of field names and field types for a given type of reference information is described using a schema.  External applications can ask the Reference API for the schema associated with a given type of information.
 * 
 * The schema for each type of reference information is stored in a file on the 3taps Network Server.  These schema documents can be updated as required, but do not need any external administration — the schema (probably stored in XML format) can be treated as part of the Reference API’s source code, and can be updated as part of a software update.  Note that the initial version of the schema to use for each type of reference information is provided as an addendum to this specification.
 * 
 * The schema is simply an ordered list of field names and types.  The field name is a string up to 255 characters long; the field type is a string with the following predefined values:
 * 
 * STRING - Text, up to a maximum length of 255 characters.
 * 
 * INT - An integer value.
 * 
 * BOOLEAN - A boolean (true-or-false) value.  Booleans are represented as strings with the value “1” or “0”, representing True and False respectively.

 * @constructor
 */
var threeTapsReferenceClient = function(authId, agentId) {
	if (authId instanceof threeTapsClient) {
		this.client = authId;
	} else {
		this.client = new threeTapsClient(authId, agentId);
	}
};

threeTapsReferenceClient.prototype = {
	client: null,

	auth: false,
	path: '/reference/',
	
	/**
	 * @public

	 * @desc Returns the 3taps categories
	 
	 * @param
	 
	 * @return {Array} The body of the response will be a json-encoded list with two entries: (schema, records)
	 * 
	 * The response will have these fields:
	 * 
	 * majorGroup 	STRING 	The name of the major category group to use for this category entry.  Note that major category groups will always be sorted alphebetically.
	 * minorGroup 	STRING 	The name of the minor category group to use for this category entry.  Note that the minor category groups will always be sorted alphabetically.
	 * categoryRank 	INT 	A number used to sort the categories within the minor category group into a useful order.  This is generally used to place the “Other” category at the bottom of the list of categories within the group.
	 * category 	STRING 	The name of the category.
	 * code 	STRING 	A unique three character code identifying this category within the system.
	 * outgoingHashtags 	STRING 	Used internally.
	 * incomingGroupHashtags 	STRING 	Used internally.
	 * incomingCategoryHashtags 	STRING 	Used internally.
	 * incomingHashtags 	STRING 	Used internally.
	 * hidden 	BOOLEAN 	If this has the value “1”, the category should be hidden in the system’s user-interface.
	 */
	categories: function(callback) {
		return this.client.request(this.path, 'categories/get', null, null, function(results) {
			callback(results);
		});
	},
	
	/**
	 * @public

	 * @desc Returns the 3taps locations
	 
	 * @param
	 
	 * @return {Array} The body of the response will be a json-encoded list with two entries: (schema, records)
	 * 
	 * The response will have these fields:
	 * 
	 * countryRank 	INT 	A number used to sort the countries into a useful order (ie, to place the US at the top, and “Other” at the bottom).
	 * country 	STRING 	The name of the country this location is within.
	 * cityRank 	INT 	A number used to sort the cities within a country into a useful order (eg, to place the most popular cities at the top, and “Other” at the bottom).
	 * city 	STRING 	The name of the city within this country.
	 * stateCode 	STRING 	A brief (usually two-letter) code for the state or region this location is in.  This will be blank for countries which do not have states or regions.
	 * stateName 	STRING 	The name of the state or region this location is in.  This will be blank for countries which do not have states or regions.
	 * code 	STRING 	A unique three letter code identifying this location.
	 * hidden 	BOOLEAN 	If this has the value “1”, the location should be hidden in the system’s user-interface.
	 */
	locations: function(callback) {
		return this.client.request(this.path, 'locations/get', null, null, function(results) {
			callback(results);
		});
	},
	
	/**
	 * @public

	 * @desc Returns the 3taps sources
	 
	 * @param
	 
	 * @return {Array} The body of the response will be a json-encoded list with two entries: (schema, records)
	 * 
	 * The response will have these fields:
	 * 
	 * source 	STRING 	The 5-character code for this source.
	 * name 	STRING 	The name of the external source.
	 * searchURL 	STRING 	The template string for a search query, if this source has a search API.
	 */
	sources: function(callback) {
		return this.client.request(this.path, 'sources/get', null, null, function(results) {
			callback(results);
		});
	}
};

threeTapsClient.register('reference', threeTapsReferenceClient);

/**
 * @class
 * @constructor
 */
var threeTapsPostingClient = function(authId, agentId) {
	if (authId instanceof threeTapsClient) {
		this.client = authId;
	} else {
		this.client = new threeTapsClient(authId, agentId);
	}
};

threeTapsPostingClient.prototype = {
	client: null,

	auth: false,
	path: '/posting/',
	
	checkduplicates: function(src, externalIDs, callback) {
		var params = {
			src: src
			,externalIDs: externalIDs
		};
		return this.client.request(this.path, 'checkduplicates', null, params, function(results) {
			callback(results);
		});
	},
	
	'delete': function(data, callback) {
		var params = {
			agentID: this.client.agentId
			,authID: this.client.authId
			,data: data
		};
		return this.client.request(this.path, 'delete', null, params, function(results) {
			callback(results);
		});
	},
	
	get: function(postID, callback) {
		return this.client.request(this.path, 'get/' + postID, null, null, function(results) {
			callback(results);
		});
	},
	
	post: function(data, callback) {
		var params = {
			agentID: this.client.agentId
			,authID: this.client.authId
			,data: data
		};
		return this.client.request(this.path, 'post', null, params, function(results) {
			callback(results);
		});
	},
	
	update: function() {
	}
};

threeTapsClient.register('posting', threeTapsPostingClient);

/**
 * @class
 * @constructor
 */
var threeTapsNotificationsClient = function(authId, agentId) {
	if (authId instanceof threeTapsClient) {
		this.client = authId;
	} else {
		this.client = new threeTapsClient(authId, agentId);
	}
};

threeTapsNotificationsClient.prototype = {
	client: null,

	auth: false,
	path: '/posting/',
	
	cancel: function() {
	},
		
	request: function() {
	}
};

threeTapsClient.register('notifications', threeTapsNotificationsClient);

/**
 * @class
 * @constructor
 */
var threeTapsSearchClient = function(authId, agentId) {
	if (authId instanceof threeTapsClient) {
		this.client = authId;
	} else {
		this.client = new threeTapsClient(authId, agentId);
	}
};

threeTapsSearchClient.prototype = {
	client: null,

	auth: false,
	path: '/search/',
	
	'new': function(params, callback) {
		return this.client.request(this.path, 'new', params, null, function(results) {
			callback(results);
		});
	}
};

threeTapsClient.register('search', threeTapsSearchClient);

exports.threeTapsClient = threeTapsClient;
