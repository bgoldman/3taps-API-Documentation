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

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request. Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
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
 * @class The Posting API accepts incoming data in a standardized format that is then added to the posting database.
 * 
 * What is a Posting?
 * 
 * A posting is the central unit of data on which the 3taps Network operates. Each posting has:
 * 
 * A source, which is a 5-character code identifying where this posting came from.
 * 
 * A category, which is a 4-character code identifying the search category to associate with this posting. The category must be supplied.
 * 
 * A location, which is a 3-character code identifying the location at which this post resides. The location will generally be supplied, but is optional.
 * 
 * A latitude and longitude value, which are floating-point numbers representing the real or estimated GPS location for the posting, in decimal degrees.
 * 
 * A language, which is a two-letter code defining the language used by this posting. Note that the language code must conform to the ISO 639-1 standard.
 * 
 * A heading, which is a short (up to 255-character long) piece of text that summarizes the posting. The heading is optional.
 * 
 * Some body text, which can be up to 5,000 characters long. This can contain any text you like.
 * 
 * A price, which is the price associated with this posting, if any.
 * 
 * A currency, which is a three-letter code identifying which currency the price is in. Note that the currency code must conform to the ISO 4217 standard.
 * 
 * A posting key, which is an eight-character string that uniquely identifies this posting within the 3taps system.
 * 
 * An optional password which an anonymous user can enter to identify themselves as the author of a posting.
 * 
 * An optional image.
 * 
 * An optional external URL which links back to the original source of the posting.
 * 
 * An optional account name which identifies the author of the posting in the originating system.
 * 
 * The 3taps user ID of the person who made this posting, if it is known.
 * 
 * A timestamp indicating the date and time at which this posting was made.
 * 
 * An expiration date/time indicating when the posting should be deleted from the 3taps system.
 * 
 * An external ID, which is simply a piece of text which can be used to find the original posting in some external system. The 3taps network simply stores this value if it has been provided, and does not use this information in any way.
 * 
 * A set of annotations providing additional meta-data about this posting. The annotations can be any data structure encoded using the JSON format. Note that these annotations can come from an untrusted source.
 * 
 * A set of trustedAnnotations which provide additional “trusted” meta-data about this posting. As with the annotations, the trusted annotations are a JSON-encoded string containing any arbitrary data structure. The trusted annotations can only come from 3taps or some other authorised source.
 * 
 * The rawData, which is simply some text or binary data copied directly from an external system.
 
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
	
	/**
	 * @public

	 * @desc The checkduplicates request queries the system for a post already matching the data provided.

	 * @param {String} src src should be a valid 5-character 3taps source code, while externalIDs should be a JSON-encoded array of strings, where each string value is the posting’s unique identifier, as defined by its system of origin. The string can be any combination of alpha-numeric characters.
	 * @param {String} externalIDs externalIDs should be a comma-separated list of IDs from the data source
	 * @param

	 * @return {Array} The body of the response will consist of a JSON-encoded array of integers, one for each entry in the externalIDs list. Each integer will have the value 1 if the corresponding posting already exists in the 3taps database, or 0 if it does not.
	 */
	checkduplicates: function(src, externalIDs, callback) {
		var params = {
			src: src
			,externalIDs: externalIDs
		};
		return this.client.request(this.path, 'checkduplicates', null, params, function(results) {
			callback(results);
		});
	},
	
	/**
	 * @public
	 * @function
	 * @name delete
	 * @memberOf threeTapsPostingClient
	 
	 * @desc The delete request deletes postings from the 3taps posting database.

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request. Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
	 * @param {String} authID The authID value is a string which authorizes the external system to make this request.  The specific value to send will be defined when the external system is whitelisted.  For non-whitelisted systems, this should be left blank.
	 * @param {Array} data data should be a JSON-encoded array with one entry for each posting to be deleted. Each posting’s entry in the array should be a string consisting of the posting key for the posting to be deleted.

	 * @return {Array} The body of the response should consist of a JSON-encoded array with one entry for each posting that was included in the request. Each array entry should be an integer with the value 1 if the posting was successfully deleted, or 0 if the posting could not be deleted (for example, because the posting has already been deleted).
	 */
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
	
	/**
	 * @public

	 * @desc The get request returns information about a single posting. 

	 * @param {String} postKey The posting key for the desired posting. This is in the URL, not a GET or POST parameter!
	 * @param

	 * @return {Array} The body of the response will consist of a JSON-encoded array with some or all of the following fields:
	 * 
	 * source is a 5-character code identifying where this posting came from [required].
	 * 
	 * category is a 4-character code identifying the search category to associate with this posting [required].
	 * 
	 * location is a 3-character code identifying the location at which this post resides. If the posting does not have a location, an empty string should be supplied [required].
	 * 
	 * latitude is a floating-point number representing the real or estimated GPS latitude for this posting, in decimal degrees [optional].
	 * 
	 * longitude is a floating-point number representing the real or estimated GPS longitude for this posting, in decimal degrees [optional].
	 * 
	 * language is a two-character code identifying the language. If supplied, this must match one of the valid ISO 693-1 language codes [optional].
	 * 
	 * heading is a short (up to 255-character long) piece of text that summarizes the posting [required].
	 * 
	 * body is the body text to use for this posting, up to 5,000 characters long [optional].
	 * 
	 * price is the optional price to associate with this posting, as a floating-point number [optional].
	 * 
	 * currency is the three-letter code identifying which currency the price is in. If supplied, this must match one of the valid ISO 4217 currency codes [must be present if a price has been supplied].
	 * 
	 * password is an optional password to associate with this posting. This should be a blank string if no passsword is to be used [optional].
	 * 
	 * image is the image to associate with this posting. The image should be a JSON array where the first entry in the array is a string indicating the source of the image:
	 * 
	 * url
	 * embedded
	 * 
	 * For URL-based images, the second item in the array should be the URL to obtain the image from. For embedded images, the second item in the array should be the image data itself, in base64 encoding [optional].
	 * 
	 * If no image is to be associated with this posting, the image value should be set to null.
	 * 
	 * Note: the image is currently ignored by the posting API.
	 * 
	 * externalURL is a string containing the external URL to use for this posting, if any. If no external URL is to be used, this should be set to an empty string [optional].
	 * 
	 * accountName is a string containing the account name of the author of the posting in the originating system [optional].
	 * 
	 * userID should be the ID of the user who created this posting, as a string. If the user is not known, this should be set to an empty string [optional].
	 * 
	 * timestamp should be the date and time at which this posting was made, as a string in YYYYMMDDHHMMSS format, in UTC. If no timestamp is specified, an empty string should be passed instead [optional].
	 * 
	 * expiration should be the date and time at which this posting should be deleted from the system, as a string in YYYYMMDDHHMMSS format, in UTC. If no expiration date/time value is specified, the system will calculate a default expiration date based on the posting’s source [optional].
	 * 
	 * externalID can be any text that identifies this posting in an external system. It should be an empty string if this value is not supplied [optional].
	 * 
	 * annotations is a string, up to 65,535 characters long, containing the untrusted annotations to associate with this posting, encoded using JSON.
	 * 
	 * trustedAnnotations is a string, up to 65,535 characters long, containing the trusted annotations to associate with this posting, encoded using JSON. Note that only trusted sources such as 3taps can created trusted annotations [optional].
	 * 
	 * rawData is a string, up to 65,535 characters long, containing the raw data copied from some external source [optional].
	 */
	get: function(postID, callback) {
		return this.client.request(this.path, 'get/' + postID, null, null, function(results) {
			callback(results);
		});
	},
	
	/**
	 * @public

	 * @desc The post request is used to add new records to the 3taps posting database.
	 * 
	 * The posting API will attempt to process each of the supplied postings in turn, checking the validity of the posting (for example, ensuring that field lengths are not exceeded, that the category and location codes match up against the master list of all known categories and locations, checking that the timestamp is valid, etc). If it is acceptable, the posting will have a unique posting key calculated, a copy of the posting will be sent to the Notifier Service so that external data consumers can be notified about the posting, and the posting will be queued for later insertion into the 3taps database. Upon completion, a response will be sent back listing the posting key and initial pre-processing success for each posting.

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request. Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
	 * @param {String} authID The authID value is a string which authorizes the external system to make this request.  The specific value to send will be defined when the external system is whitelisted.  For non-whitelisted systems, this should be left blank.
	 * @param {Array} data data should be a JSON-encoded array with two entries:
	 * 
	 * [fieldList, postings]
	 * 
	 * The fieldList should itself be a JSON array of strings, where each string defines the name of a field that is being included with these postings. The name of the currently-supported fields is given below.
	 * 
	 * postings should be a JSON array with one entry per posting. Each item in this array should itself be an array of field values, where the values are in the same order as defined in the field list.
	 * 
	 * Note that the format of the required data has been selected to allow new fields to be added to the posting database as time goes on, without breaking existing clients which use a given sub-set of the available fields.
	 * 
	 * The following field names are currently supported:
	 * 
	 * source is a 5-character code identifying where this posting came from [required].
	 * 
	 * category is a 4-character code identifying the search category to associate with this posting [required].
	 * 
	 * location is a 3-character code identifying the location at which this post resides. If the posting does not have a location, an empty string should be supplied [required].
	 * 
	 * latitude is a floating-point number representing the real or estimated GPS latitude for this posting, in decimal degrees [optional].
	 * 
	 * longitude is a floating-point number representing the real or estimated GPS longitude for this posting, in decimal degrees [optional].
	 * 
	 * language is a two-character code identifying the language. If supplied, this must match one of the valid ISO 693-1 language codes [optional].
	 * 
	 * heading is a short (up to 255-character long) piece of text that summarizes the posting [required].
	 * 
	 * body is the body text to use for this posting, up to 5,000 characters long [optional].
	 * 
	 * price is the optional price to associate with this posting, as a floating-point number [optional].
	 * 
	 * currency is the three-letter code identifying which currency the price is in. If supplied, this must match one of the valid ISO 4217 currency codes [must be present if a price has been supplied].
	 * 
	 * password is an optional password to associate with this posting. This should be a blank string if no passsword is to be used [optional].
	 * 
	 * image is the image to associate with this posting. The image should be a JSON array where the first entry in the array is a string indicating the source of the image:
	 * 
	 * url
	 * embedded
	 * 
	 * For URL-based images, the second item in the array should be the URL to obtain the image from. For embedded images, the second item in the array should be the image data itself, in base64 encoding [optional].
	 * 
	 * If no image is to be associated with this posting, the image value should be set to null.
	 * 
	 * Note: the image is currently ignored by the posting API.
	 * 
	 * externalURL is a string containing the external URL to use for this posting, if any. If no external URL is to be used, this should be set to an empty string [optional].
	 * 
	 * accountName is a string containing the account name of the author of the posting in the originating system [optional].
	 * 
	 * userID should be the ID of the user who created this posting, as a string. If the user is not known, this should be set to an empty string [optional].
	 * 
	 * timestamp should be the date and time at which this posting was made, as a string in YYYYMMDDHHMMSS format, in UTC. If no timestamp is specified, an empty string should be passed instead [optional].
	 * 
	 * expiration should be the date and time at which this posting should be deleted from the system, as a string in YYYYMMDDHHMMSS format, in UTC. If no expiration date/time value is specified, the system will calculate a default expiration date based on the posting’s source [optional].
	 * 
	 * externalID can be any text that identifies this posting in an external system. It should be an empty string if this value is not supplied [optional].
	 * 
	 * annotations is a string, up to 65,535 characters long, containing the untrusted annotations to associate with this posting, encoded using JSON.
	 * 
	 * trustedAnnotations is a string, up to 65,535 characters long, containing the trusted annotations to associate with this posting, encoded using JSON. Note that only trusted sources such as 3taps can created trusted annotations [optional].
	 * 
	 * rawData is a string, up to 65,535 characters long, containing the raw data copied from some external source [optional].

	 * @return {Array} The body of the response should consist of a JSON-encoded array with one entry for each posting that was supplied. Each array entry should be a [success, response] array, where success will have the value 1 if the posting was successfully added, or 0 if an error occurred. If the posting was successfully added, response should be set to the posting key value for that posting; if an error occurred, response should be set to a brief textual message describing why the posting was rejected.
	 */
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
	
	/**
	 * @public

	 * @desc Calculate the location for a posting

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request. Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
	 * @param {String} authID The authID value is a string which authorizes the external system to make this request.  The specific value to send will be defined when the external system is whitelisted.  For non-whitelisted systems, this should be left blank.
	 * @param {Array} data data should be a JSON-encoded array with one entry for each posting to be updated. Each posting’s entry in the array should itself be an array with two entries: [postingKey, changes], where postingKey is the posting key identifying the posting to update, and changes is a JSON object mapping field names to their updated values.
	 * 
	 * The following fields are able to be changed using the /update request:
	 * 
	 * category
	 * location
	 * latitude
	 * longitude
	 * language
	 * heading
	 * body
	 * price
	 * currency
	 * image
	 * externalURL
	 * accountName
	 * userID
	 * timestamp
	 * expiration
	 * externalID
	 * annotations
	 * trustedAnnotations
	 * rawData

	 * @return {Array} the body of the response should consist of a JSON-encoded array with one entry for each posting that was included in the request. Each array entry should be an integer with the value 1 if the posting was successfully updated, or 0 if the posting could not be updated (for example, because the posting has been deleted or there was a problem with the supplied changes).
	 */
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
