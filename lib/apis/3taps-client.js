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
 * @class The 3taps Notifier constantly monitors all incoming postings, and sends out notifications via email or Twitter as postings that match certain criteria are received.  External users and systems are able to send a request to the Notification API to have notifications sent out to a given destination for all postings that meet a given set of criteria.  These notifications will continue to be sent out until the request is explicitly cancelled or the request times out, usually after a period of seven days.
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
	
	/**
	 * @public

	 * @desc Cancel a notification request.

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request. Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
	 * @param {String} authID The authID value is a string which authorizes the external system to make this request.  The specific value to send will be defined when the external system is whitelisted.  For non-whitelisted systems, this should be left blank.
	 * @param {String} requestID The requestID is the string identifying a notification request created by a previous call to request.

	 * @return {Boolean} The body of the response will be set to the value “1” if the request was successfully cancelled, or “0” if the request could not be cancelled. Note that if the request has timed out (ie, has been active for seven days and then automatically removed), the response will be “0” indicating that the request no longer existed.
	 */
	cancel: function() {
	},

	/**
	 * @public

	 * @desc Ask the notifier to start sending out notifications.Cancel a notification request.

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request. Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
	 * @param {String} authID The authID value is a string which authorizes the external system to make this request.  The specific value to send will be defined when the external system is whitelisted.  For non-whitelisted systems, this should be left blank.
	 * @param {Object} request request should be a JSON-encoded object with the following fields:
	 * 
	 * filter is a list of filter criteria to use to select which postings to send out notifications for.  The filter should be an array, where each entry in the array is an object with the following fields:
	 * 
	 * type
	 * 
	 * A string identifying the type of filter to create.  The following filter types are currently supported:
	 * 
	 * category
	 * location
	 * source
	 * majorGroup
	 * minorGroup
	 * tag
	 * text
	 * 
	 * value
	 * 
	 * A string containing the value the posting must have if it is to match this filter criteria.  For category, location and source, the value must be the appropriate 3taps code for the category, location and source respectively.  For the other filter criteria, the value can be any freeform text.
	 * 
	 * format is a string defining how the notifications should be formatted.  The following formats are currently supported
	 * 
	 * brief
	 * 
	 * This format is intended for short, human-readable messages such as watching notifications on a chat client or getting a push notification to a mobile phone.  The notification has two lines for each post included in the batch: the heading, followed by a line break and the URL used to access the post within the 3taps system.  If multiple posts are batched together, there will be two line breaks between each post.
	 * 
	 * full
	 * extended
	 * 
	 * These two formats are intended for sending notifications to external systems for further use.  The data is sent as a JSON-encoded array with two entries: [fieldList, postings], where fieldList is an array of field names, and postings is an array of postings, where each posting is itself an array of field values, in the same order as the fieldList list.
	 * 
	 * For the full format, the following fields will be included:
	 * 
	 * postKey
	 * source
	 * category
	 * location
	 * heading
	 * body
	 * workspaceURL
	 * created
	 * 
	 * The extended format includes all the fields from the full format, plus:
	 * 
	 * externalURL
	 * externalID
	 * trustedAnnotations
	 * latitude
	 * longitude
	 * price
	 * currency
	 * language
	 * 
	 * html
	 * 
	 * This format is intended for human-readable notifications such as emails.  The following information is presented in HTML format:
	 * 
	 * postKey
	 * source
	 * category
	 * location
	 * heading
	 * body
	 * workspaceURL
	 * created
	 * 
	 * text140
	 * 
	 * This format is intended to send notifications to Twitter; a minimal set of fields are included, and limited to 140 characters so that the notification can be sent out as a Twitter status update.
	 * 
	 * destination is a string defining how the notifications will be sent out.  The following destinations are currently supported:
	 * 
	 * email
	 * twitter
	 * xmpp
	 * 
	 * destInfo is an object containing additional information needed to send the notifications to a given destination.  The fields required in this object will vary depending on the destination:
	 * 
	 * email
	 * 
	 * For notification requests sent out via email, the destInfo object should include the following fields:
	 * 
	 * emailAddress
	 * 
	 * subject
	 * 
	 * Note that the email address to send the notifications to is required, while the subject is optional.
	 * 
	 * twitter
	 * 
	 * For notification requests via Twitter, the destInfo object should include the following fields:
	 * 
	 * username
	 * password
	 * 
	 * These define the Twitter account to use to create the notification tweets.  Both fields must be supplied.
	 * 
	 * xmpp
	 * 
	 * For notification requests via XMPP, the destInfo object should include the following fields:
	 * 
	 * jid
	 * username
	 * password
	 * 
	 * jid defines the Jabber (XMPP) account to send notifications to, while username and password are used to sign in to the XMPP server.
	 * 
	 * batchSize is an integer defining how many postings to send out at once.  If this is set to 1, notifications will be sent out as soon as the postings are received rather than being batched.
	 * 
	 * maxPerHour is an integer defining the maximum number of notifications (batched or individual) that should be sent out in any given hour.  Note that this number cannot exceed the maximum value specified by the destination itself; if you attempt to send out more notifications than is supported by the destination, the notification request will be rejected.
	 * 
	 * maxPerDay is an integer defining the maximum number of notifications (batched or individual) that should be sent out in any given 24-hour period.  Note that this number cannot exceed the maximum value specified by the destination itself; if you attempt to send out more notifications than is supported by the destination, the notification request will be rejected.
	 * 

	 * @return {Boolean} The body of the response should consist of a JSON-encoded array with two entries: [success, response].  success should have the value 1 if the notification request succeeded, or 0 if an error occurred.  If the request succeeded, response will be a unique string identifying this particular request; this string will be needed to cancel the request. If an error occurred, response will be set to a brief textual message describing why the notification request failed.
	 */
	request: function() {
	}
};

threeTapsClient.register('notifications', threeTapsNotificationsClient);

/**
 * @class The Search API accepts incoming search requests, and returns information about matching postings back to the caller.
 * 
 * At this time, the Search API only works in a synchronous manner — that is, once a search request has been issued the system processes the request and the returns the results back to the caller, all in a single HTTP call.  A later version of the Search API will add support for asynchronous searching, where searches are initiated in one request, and can be polled to see if the search has finished before the results are obtained using a separate request.
 
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
	
	/**
	 * @public
	 * @function
	 * @name new
	 * @memberOf threeTapsSearchClient

	 * @desc The new request creates a new search request.

	 * @param {Integer} rpp The number of results to return for a synchonous search. If this is not specified, a maximum of ten postings will be returned at once.  If this is set to -1, all matching postings will be returned at once.  Note that this is ignored for asynchronous searches.
	 * @param {Integer} page The page number of the results to return for a synchronous search, where zero is the first page of results.  If this is not specified, the most recent page of postings will be returned. Note that this is ignored for asynchronous searches.
	 * @param {String} src The 2-character source code a posting must have if is to be included in the list of search results.
	 * @param {String} cat The 4-character category code a posting must have if it is to be included in the list of search results.
	 * @param {String} loc The 3-character location code a posting must have if it is to be included in the list of search results.
	 * @param {String} head A string which must occur within the heading of the posting if it is to be included in the list of search results.
	 * @param {String} body A string which must occur within the body of the posting if it is to be included in the list of search results.
	 * @param {String} text A string which must occur in either the heading or the body of the posting if it is to be included in the list of search results.
	 * @param {String} poster The user ID of the person who created the posts.  If this is specified, only postings created by the specified user will be included in the list of search results.
	 * @param {String} extID A string which must match the “externalID” field for a posting if it is to be included in the list of search results.
	 * @param {String} annotation An annotation value.  Only postings which include this (trusted or untrusted) annotation value will be included in the list of search results.
	 * @param {String} start (YYYYMMDDHHMMSS) This defines the desired starting timeframe for the search query.  Only postings with a timestamp greater than or equal to the given value will be included in the list of search results.
	 * @param {String} end (YYYYMMDDHHMMSS) This defines the desired ending timeframe for the search query.  Only postings with a timestamp less than or equal to the given value will be included in the list of search results.
	 * @param {String} retvals A comma-separated list of the fields to return for each posting that matches the desired set of search criteria.  The following field names are currently supported:
	 * 
	 * source
	 * category
	 * location
	 * longitude
	 * latitude
	 * heading
	 * body
	 * image
	 * externalURL
	 * userID
	 * timestamp
	 * externalID
	 * contextualTags
	 * postKey
	 * 
	 * These fields match the fields with the same name as defined in the Posting API.
	 * 
	 * If no retvals =… argument is supplied, the following list of fields will be returned by default:
	 * 
	 * category
	 * location
	 * heading
	 * externalURL
	 * timestamp

	 * @return {Array} The body of the response is a JSON-encoded array, where the contents of the array will vary depending on the success or failure of the request.
	 * 
	 * If the search was successful the returned array will look like this:
	 * 
	 * [1, numPostings, data]
	 * 
	 * where numPostings is the number of matching postings, and data is a JSON array of postings within the desired page of results.  Each entry in the data array corresponds to a single posting, and will itself be a JSON array of field values, in the order they were specified in the retvals argument.
	 * 
	 * If the search failed for some reason, the returned array will look like this:
	 * 
	 * [0, errMsg]
	 * 
	 * In this case, errMsg will be a brief string describing why the search failed.
	 */
	'new': function(params, callback) {
		return this.client.request(this.path, 'new', params, null, function(results) {
			callback(results);
		});
	}
};

threeTapsClient.register('search', threeTapsSearchClient);

exports.threeTapsClient = threeTapsClient;
