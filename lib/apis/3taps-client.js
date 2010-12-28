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
	 
	 * @restStructure POST /geocoder/geocode

	 * @desc Calculate the location for a posting

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request. Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
	 * @param {String} authID The authID value is a string which authorizes the external system to make this request.  The specific value to send will be defined when the external system is whitelisted.  For non-whitelisted systems, this should be left blank.
	 * @param {Array} data data should be a JSON-encoded array of postings to geocode.  Each entry in this array should be a JSON object containing one or more of the following:
	 * 
	 * <table>
	 *     <tr>
	 *         <td>latitude</td><td>The GPS latitude value as a decimal degree.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>longitude</td><td>The GPS longitude value as a decimal degree.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>country</td><td>The name of the country.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>state</td><td>The name or code of the state or region.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>city</td><td>The name of the city.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>locality</td><td>The name of a suburb, area or town within the specified city.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>street</td><td>The full street address for this location.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>postal</td><td>A zip or postal code.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>text</td><td>An unstructured location or address value.</td>
	 *     </tr>
	 * </table>
	 * Note that, with the exception of the text and locality fields, this matches the structure used by Yahoo Pipes to represent locations; because many postings will come via Yahoo Pipes, using the same format will make the import process easier.  The text field should be used where unstructured address or location information is used; this field will be checked for all possible address tokens (city name, zip code, country name, etc).

	 * @return {Array} The body of the response will consist of a JSON-encoded array with one entry for each posting. Each array entry will itself be an array with three entries:
	 * 
	 * (locationCode, latitude, longitude)
	 * 
	 * where locationCode is the three-character location code to use for this posting, and latitude and longitude represent the calculated GPS coordinate for this posting’s location, in the form of floating-point numbers representing decimal degrees.
	 * 
	 * If the posting could not be geocoded at all, locationCode will be set to a null value.  If the geocoder was unable to calculate a lat/long value for the posting based on the supplied location details, latitude and longitude will be set to null values.
	 
	 * @example
	 * [["SFO",37.77493,-122.41942],["LAX",34.05223,-118.24368]]
	 
	 * @example
	 * var textLocation = prompt('Enter a location to geocode', 'San Francisco, California');
	 * var textLocation2 = prompt('Enter another location to geocode', 'Los Angeles, California');
	 * var data = [
	 * 	{text: textLocation},
	 * 	{text: textLocation2}
	 * ];
	 * threeTapsGeocoderClient.geocode(JSON.stringify(data), callback);
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
 * BOOLEAN - A boolean (true-or-false) value.  Booleans are represented as strings with the value "1" or "0", representing True and False respectively.

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
	 
	 * @restStructure GET /reference/categories/get
	 * @restUrlExample http://3taps.net/reference/categories/get

	 * @desc Returns the 3taps categories
	 
	 * @param
	 
	 * @return {Array} The body of the response will be a json-encoded list with two entries: (schema, records)
	 * 
	 * The response will have these fields:
	 * 
	 * <table>
	 *     <tr>
	 *         <td>majorGroup</td><td>STRING</td><td>The name of the major category group to use for this category entry.  Note that major category groups will always be sorted alphebetically.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>minorGroup</td><td>STRING</td><td>The name of the minor category group to use for this category entry.  Note that the minor category groups will always be sorted alphabetically.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>categoryRank</td><td>INT</td><td>A number used to sort the categories within the minor category group into a useful order.  This is generally used to place the "Other" category at the bottom of the list of categories within the group.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>category</td><td>STRING</td><td>The name of the category.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>code</td><td>STRING</td><td>A unique three character code identifying this category within the system.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>outgoingHashtags</td><td>STRING</td><td>Used internally.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>incomingGroupHashtags</td><td>STRING</td><td>Used internally.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>incomingCategoryHashtags</td><td>STRING</td><td>Used internally.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>incomingHashtags</td><td>STRING</td><td>Used internally.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>hidden</td><td>BOOLEAN</td><td>If this has the value "1", the category should be hidden in the system’s user-interface.</td>
	 *     </tr>
	 * </table>
	 
	 * @example
	 * [[["majorGroup","STRING"],["minorGroup","STRING"],["categoryRank","INT"],["category","STRING"],["code","STRING"],["outgoingHashtags","STRING"],["incomingGroupHashtags","STRING"],["incomingCategoryHashtags","STRING"],["incomingHashtags","STRING"],["hidden","BOOLEAN"]],[["Animals",null,100,null,"AZZZ",null,null,null,null,"0"],["Animals","Farm Animals",100,null,"ANZZ",null,null,null,null,"0"],["Animals","Farm Animals",100,"Farm Supplies","ANSU","#animals #supplies","#animal","#supplies","#animal #supplies","0"],["Animals","Farm Animals",100,"Livestock","ANLI","#animals #livestock","#animal","#livestock","#animal #livestock","0"],["Animals","Pets",100,null,"ANYZ",null,null,null,null,"0"],["Animals","Pets",100,"Foster Pets","ANFO","#animals #foster","#animal","#foster","#animal #foster","0"],["Animals","Pets",100,"Other Animals","ANOT","#animals #other","#animal","#other","#animal #other","0"],["Animals","Pets",100,"Pet Adoptions","ANAS","#animals #pet","#animal","#pet","#animal #pet","0"],["Animals","Pets",100,"Pet Rescues","ANRE","#animals #rescue","#animal","#rescue","#animal #rescue","0"],["Community",null,100,null,"CZZZ",null,null,null,null,"0"],["Community","Bulletin",100,null,"CEBZ",null,null,null,null,"0"],["Community","Bulletin",100,"Activities","OACT","#community #activities","#community","#activity","#community #activity","0"],["Community","Bulletin",100,"Events","EVNT","#community #events","#community","#events","#community #event","0"],["Community","Bulletin",100,"Rideshares","ORID","#community #rideshare","#community","#rideshare","#rideshare","0"],["Community","Emergency",100,null,"CEMZ",null,null,null,null,"0"],["Community","Emergency",100,"Accidents","EACC","#911 #accident","#emergency","#accident","#emergency #accident","0"],["Community","Emergency",100,"Fires","EFIR","#911 #fire","#emergency","#fire","#emergency #fire","0"],["Community","Emergency",100,"Incidents","EINC","#911 #incident","#emergency","#incident","#emergency #incident","0"],["Community","Emergency",100,"Medical","EMED","#911 #medical","#emergency","#medical","#emergency #medical","0"],["Community","Lost & Found",100,null,"CLFZ",null,null,null,null,"0"],["Community","Lost & Found",100,"Found Items","LFFO","#found #other",null,null,null,"0"],["Community","Lost & Found",100,"Found Pets","LFFP","#found #pet",null,null,null,"0"],["Community","Lost & Found",100,"Lost Items","LFLO","#lost #other",null,null,null,"0"],["Community","Lost & Found",100,"Lost Pets","LFLP","#lost #pet",null,null,null,"0"],["Community","Tipster",100,null,"CTIZ",null,null,null,null,"0"],["Community","Tipster",100,"Abuse","TABU","#tipster #abuse","#311","#abuse","#311 #abuse","0"],["Community","Tipster",100,"Corruption","TCOR","#tipster #corruption","#311","#corruption","#311 #corruption","0"],["Community","Tipster",100,"Deception","TDEC","#tipster #deception","#311","#deception","#311 #deception","0"],["Community","Tipster",100,"Fraud","TFRA","#tipster #fraudulent","#311","#fraudulent","#311 #fraudulent","0"],["Community","Tipster",100,"Injustice","TDIS","#tipster #discrimination","#311","#discrimination","#311 #discrimination","0"],["Community","Tipster",100,"Nuisance","TNUI","#tipster #nuisance","#311","#nuisance","#311 #nuisance","0"],["Community","Tipster",100,"Reckless","TREC","#tipster #reckless","#311","#reckless","#311 #reckless","0"],["Community","Tipster",100,"Violence","TVIO","#tipster #violence","#311","#violence","#311 #violence","0"],["Deals","Deals",100,"Deals","DEAL","#forsale #deals",null,null,null,"0"],["Discussions","Discussions",100,"Discussions","DISC",null,null,null,null,"0"],["Dispatch",null,100,null,"DZZZ",null,null,null,null,"0"],["Dispatch","Courier",100,null,"DIZZ",null,null,null,null,"0"],["Dispatch","Courier",100,"Provide Delivery","TDXA","#courier #available",null,null,null,"0"],["Dispatch","Courier",100,"Want Delivery","TDXW","#courier #needed",null,null,null,"0"],["Dispatch","Taxi",100,null,"DIYZ",null,null,null,null,"0"],["Dispatch","Taxi",100,"Provide Taxi","TTXA","#dispatch #available #taxi","#transport","#available","#transport #taxi #available","0"],["Dispatch","Taxi",100,"Want Taxi","TTXW","#dispatch #wanted #taxi","#transport","#wanted","#transport #taxi #wanted","0"],["Dispatch","Towing",100,null,"DIXZ",null,null,null,null,"0"],["Dispatch","Towing",100,"Provide Tow","TTWA","#dispatch #available #tow","#transport","#available","#transport #tow #available","0"],["Dispatch","Towing",100,"Want Tow","TTWW","#dispatch #wanted #tow","#transport","#wanted","#transport #tow #wanted","0"],["Dispatch","Transport & Delivery",100,"Delivery","TDEL","#dispatch #delivery","#transport","#delivery","#transport #delivery","0"],["Ebay","Ebay",100,"Ebay Uncategorized","EBAY",null,null,null,null,"0"],["For Sale",null,100,null,"FZZZ",null,null,null,null,"0"],["For Sale","For Sale",100,"Mobile Phones","SGCE","#forsale #mphone","#sale","#mphone","#sale #mphone","0"],["For Sale","Goods For Free",100,null,"FSFZ",null,null,null,null,"0"],["For Sale","Goods For Free",100,"Business Barters","SFBB","#free #barter #business","#forsale","#business","#forsale #barter #business","0"],["For Sale","Goods For Free",100,"Offers For Free","SFOF","#free #offered","#forsale","#offered","#forsale #offered","0"],["For Sale","Goods For Free",100,"Personal Barters","SFBP","#free #barter #personal","#forsale","#personal","#forsale #barter #personal","0"],["For Sale","Goods For Free",100,"Wanted","SFWA","#free #wanted","#forsale","#wanted","#forsale #wanted","0"],["For Sale","Goods For Sale",100,null,"FSSZ",null,null,null,null,"0"],["For Sale","Goods For Sale",100,"Antiques","SGAN","#forsale #antiques","#sale","#antiques","#sale #antiques","0"],["For Sale","Goods For Sale",100,"Apparel","SGCL","#forsale #apparel","#sale","#apparel","#sale #apparel","0"],["For Sale","Goods For Sale",100,"Appliances","SGAP","#forsale #appliances","#sale","#appliances","#sale #appliances","0"],["For Sale","Goods For Sale",100,"Art & Crafts","SGAR","#forsale #arts","#sale","#arts","#sale #arts","0"],["For Sale","Goods For Sale",100,"Babies & Kids","SGBA","#forsale #kids","#sale","#kids","#sale #kids","0"],["For Sale","Goods For Sale",100,"Beauty","SGBE","#forsale #beauty","#sale","#beauty","#sale #beauty","0"],["For Sale","Goods For Sale",100,"Bicycles","SGBI","#forsale #bikes","#sale","#bikes","#sale #bikes","0"],["For Sale","Goods For Sale",100,"Businesses","SGOF","#forsale #business","#sale","#business","#sale #business","0"],["For Sale","Goods For Sale",100,"Collections","SGCO","#forsale #collectibles","#sale","#collectibles","#sale #collectibles","0"],["For Sale","Goods For Sale",100,"Computers","SGCM","#forsale #computer","#sale","#computer","#sale #computer","0"],["For Sale","Goods For Sale",100,"Educational","SEDU","#forsale #giftcard","#sale","#education","#sale #education","0"],["For Sale","Goods For Sale",100,"Electronics","SGEL","#forsale #electronics","#sale","#electronics","#sale #electronics","0"],["For Sale","Goods For Sale",100,"Food & Beverage","SGFO","#forsale #food","#sale","#food","#sale #food","0"],["For Sale","Goods For Sale",100,"Furniture","SGFU","#forsale #furniture","#sale","#furniture","#sale #furniture","0"],["For Sale","Goods For Sale",100,"Gasoline","STGA","#forsale #gas","#sale","#gas","#sale #gas","0"],["For Sale","Goods For Sale",100,"Gift Cards","SGFT",null,"#sale","#giftcard","#sale #giftcard","0"],["For Sale","Goods For Sale",100,"Health Goods","SGHG","#forsale #health",null,null,null,"0"],["For Sale","Goods For Sale",100,"Home & Garden","SGHO","#forsale #household","#sale","#household","#sale #household","0"],["For Sale","Goods For Sale",100,"Jewelry","SGJE","#forsale #jewelry","#sale","#jewelry","#sale #jewelry","0"],["For Sale","Goods For Sale",100,"Literature","SGBO","#forsale #books","#sale","#books","#sale #books","0"],["For Sale","Goods For Sale",100,"Materials","SGMT","#forsale #materials",null,null,null,"0"],["For Sale","Goods For Sale",100,"Movies & Music","SGMM","#forsale #media","#sale","#media","#sale #media","0"],["For Sale","Goods For Sale",100,"Musical Instruments","SGMU","#forsale #music #instrument","#sale","#instrument","#sale #music #instrument","0"],["For Sale","Goods For Sale",100,"Other Goods","SGOT","#forsale #other","#sale","#other","#sale #other","0"],["For Sale","Goods For Sale",100,"Pet Supplies","SPSU","#forsale #supplies #pet","#sale","#pet","#sale #supplies #pet","0"],["For Sale","Goods For Sale",100,"Pets","SPPP","#forsale #pets",null,null,null,"0"],["For Sale","Goods For Sale",100,"Science","SGIN","#forsale #science","#sale","#science","#sale #science","0"],["For Sale","Goods For Sale",100,"Sports & Fitness","SGSP","#forsale #sports","#sale","#sports","#sale #sports","0"],["For Sale","Goods For Sale",100,"Tickets","STIC","#forsale #tickets","#sale","#tickets","#sale #tickets","0"],["For Sale","Goods For Sale",100,"Tools","SGTL","#forsale #tools","#sale","#tools","#sale #tools","0"],["For Sale","Goods For Sale",100,"Toys & Hobbies","SGTO","#forsale #toys","#sale","#toys","#sale #toys","0"],["For Sale","Goods For Sale",100,"Video Games","SGVG","#forsale #videogames","#sale","#videogames","#sale #videogames","0"],["Jobs & Resumes",null,100,null,"JZZZ",null,null,null,null,"0"],["Jobs & Resumes","Job Openings",100,null,"JJOZ",null,null,null,null,"0"],["Jobs & Resumes","Job Openings",100,"Accounting","JAAC","#job #accounting","#jobs","#accounting","#jobs #accounting","0"],["Jobs & Resumes","Job Openings",100,"Administrative","JAAD","#job #admin","#jobs","#admin","#jobs #admin","0"],["Jobs & Resumes","Job Openings",100,"Aerospace & Defense","JAAE","#job #aerospace","#jobs","#aerospace","#jobs #aerospace","0"],["Jobs & Resumes","Job Openings",100,"Analyst","JAAY","#job #analyst","#jobs","#analyst","#jobs #analyst","0"],["Jobs & Resumes","Job Openings",100,"Animals","JAAN","#job #animals","#jobs","#animals","#jobs #animals","0"],["Jobs & Resumes","Job Openings",100,"Architecture","JAAT","#job #architecture","#jobs","#architecture","#jobs #architecture","0"],["Jobs & Resumes","Job Openings",100,"Art","JAAR","#job #art","#jobs","#art","#jobs #art","0"],["Jobs & Resumes","Job Openings",100,"Automobile","JAAU","#job #autos","#jobs","#autos","#jobs #autos","0"],["Jobs & Resumes","Job Openings",100,"Beauty","JABE","#job #salon","#jobs","#salon","#jobs #salon","0"],["Jobs & Resumes","Job Openings",100,"Business Development","JABU","#job #bizdev","#jobs","#bizdev","#jobs #bizdev","0"],["Jobs & Resumes","Job Openings",100,"Casual & Temporary","JAGI","#job #temp","#jobs","#temp","#jobs #temp","0"],["Jobs & Resumes","Job Openings",100,"Computer & Web","JACO","#job #computer","#jobs","#computer","#jobs #computer","0"],["Jobs & Resumes","Job Openings",100,"Construction & Facilities","JACR","#job #construction","#jobs","#construction","#jobs #construction","0"],["Jobs & Resumes","Job Openings",100,"Consulting","JACN","#job #consulting","#jobs","#consulting","#jobs #consulting","0"],["Jobs & Resumes","Job Openings",100,"Customer Service","JACU","#job #customerservice","#jobs","#customerservice","#jobs #customerservice","0"],["Jobs & Resumes","Job Openings",100,"Design","JADE","#job #design","#jobs","#design","#jobs #design","0"],["Jobs & Resumes","Job Openings",100,"Education","JAED","#job #education","#jobs","#education","#jobs #education","0"],["Jobs & Resumes","Job Openings",100,"Energy","JAEN","#job #energy","#jobs","#energy","#jobs #energy","0"],["Jobs & Resumes","Job Openings",100,"Engineering","JAEG","#job #engineering","#jobs","#engineering","#jobs #engineering","0"],["Jobs & Resumes","Job Openings",100,"Entertainment & Media","JAET","#job #media","#jobs","#media","#jobs #media","0"],["Jobs & Resumes","Job Openings",100,"Events","JAEV","#job #events ","#jobs","#events","#jobs #events ","0"],["Jobs & Resumes","Job Openings",100,"Finance","JABF","#job #finance","#jobs","#finance","#jobs #finance","0"],["Jobs & Resumes","Job Openings",100,"Food & Beverage","JAFO","#job #food","#jobs","#food","#jobs #food","0"],["Jobs & Resumes","Job Openings",100,"Government","JAFE","#job #government","#jobs","#government","#jobs #government","0"],["Jobs & Resumes","Job Openings",100,"Healthcare","JAHC","#job #healthcare","#jobs","#healthcare","#jobs #healthcare","0"],["Jobs & Resumes","Job Openings",100,"Hospitality & Travel","JAHO","#job #hospitality","#jobs","#hospitality","#jobs #hospitality","0"],["Jobs & Resumes","Job Openings",100,"Human Resources","JAHR","#job #HR","#jobs","#HR","#jobs #HR","0"],["Jobs & Resumes","Job Openings",100,"Installation, Maintenance & Repair","JAIM","#job #maintenance","#jobs","#maintenance","#jobs #maintenance","0"],["Jobs & Resumes","Job Openings",100,"Insurance","JAIN","#job #insurance","#jobs","#insurance","#jobs #insurance","0"],["Jobs & Resumes","Job Openings",100,"Law Enforcement","JALE","#job #enforcement","#jobs","#enforcement","#jobs #enforcement","0"],["Jobs & Resumes","Job Openings",100,"Legal","JALG","#job #legal","#jobs","#legal","#jobs #legal","0"],["Jobs & Resumes","Job Openings",100,"Management & Directorship","JAMG","#job #management","#jobs","#management","#jobs #management","0"],["Jobs & Resumes","Job Openings",100,"Manufacturing & Mechanical","JAMN","#job #manufacturing","#jobs","#manufacturing","#jobs #manufacturing","0"],["Jobs & Resumes","Job Openings",100,"Marketing, Advertising & Public Relations","JAMK","#job #marketing","#jobs","#marketing","#jobs #marketing","0"],["Jobs & Resumes","Job Openings",100,"Non-Profit","JANP","#job #nonprofit","#jobs","#nonprofit","#jobs #nonprofit","0"],["Jobs & Resumes","Job Openings",100,"Operations & Logistics","JAOP","#job #operations","#jobs","#operations","#jobs #operations","0"],["Jobs & Resumes","Job Openings",100,"Other","JAOT","#job #other","#jobs","#other","#jobs #other","0"],["Jobs & Resumes","Job Openings",100,"Pharmaceutical","JAPH","#job #pharma","#jobs","#pharma","#jobs #pharma","0"],["Jobs & Resumes","Job Openings",100,"Product, Project & Program Management","JAPR","#job #product","#jobs","#product","#jobs #product","0"],["Jobs & Resumes","Job Openings",100,"Purchasing","JAPU","#job #purchasing","#jobs","#purchasing","#jobs #purchasing","0"],["Jobs & Resumes","Job Openings",100,"Quality Assurance","JAQA","#job #QA","#jobs","#QA","#jobs #QA","0"],["Jobs & Resumes","Job Openings",100,"Real Estate","JARE","#job #realestate","#jobs","#realestate","#jobs #realestate","0"],["Jobs & Resumes","Job Openings",100,"Recreation","JARC","#job #recreation","#jobs","#recreation","#jobs #recreation","0"],["Jobs & Resumes","Job Openings",100,"Retail & Sales","JARS","#job #retailsales","#jobs","#retailsales","#jobs #retailsales","0"],["Jobs & Resumes","Job Openings",100,"Science","JASC","#job #science","#jobs","#science","#jobs #science","0"],["Jobs & Resumes","Job Openings",100,"Security","JASE","#job #security","#jobs","#security","#jobs #security","0"],["Jobs & Resumes","Job Openings",100,"Skilled Trade & General Labor","JASK","#job #trade","#jobs","#trade","#jobs #trade","0"],["Jobs & Resumes","Job Openings",100,"Telecommunications","JATE","#job #telecom","#jobs","#telecom","#jobs #telecom","0"],["Jobs & Resumes","Job Openings",100,"Transportation","JATR","#job #transportation","#jobs","#transport","#jobs #transport","0"],["Jobs & Resumes","Job Openings",100,"Volunteer","JAVO","#job #volunteer","#jobs","#volunteer","#jobs #volunteer","0"],["Jobs & Resumes","Job Openings",100,"Writing","JAWR","#job #writing","#jobs","#writing","#jobs #writing","0"],["Jobs & Resumes","Job Resumes",100,null,"JREZ",null,null,null,null,"0"],["Jobs & Resumes","Job Resumes",100,"Accounting","JWAC","#resume #accounting","#resumes","#accounting","#resumes #accounting","0"],["Jobs & Resumes","Job Resumes",100,"Administrative","JWAD","#resume #admin","#resumes","#admin","#resumes #admin","0"],["Jobs & Resumes","Job Resumes",100,"Aerospace & Defense","JWAE","#resume #aerospace","#resumes","#aerospace","#resumes #aerospace","0"],["Jobs & Resumes","Job Resumes",100,"Analyst","JWAY","#resume #analyst","#resumes","#analyst","#resumes #analyst","0"],["Jobs & Resumes","Job Resumes",100,"Animals","JWAN","#resume #animals","#resumes","#animals","#resumes #animals","0"],["Jobs & Resumes","Job Resumes",100,"Architecture","JWAT","#resume #architecture","#resumes","#architecture","#resumes #architecture","0"],["Jobs & Resumes","Job Resumes",100,"Art","JWAR","#resume #art","#resumes","#art","#resumes #art","0"],["Jobs & Resumes","Job Resumes",100,"Automobile","JWAU","#resume #autos","#resumes","#autos","#resumes #autos","0"],["Jobs & Resumes","Job Resumes",100,"Beauty","JWBE","#resume #salon","#resumes","#salon","#resumes #salon","0"],["Jobs & Resumes","Job Resumes",100,"Business Development","JWBU","#resume #bizdev","#resumes","#bizdev","#resumes #bizdev","0"],["Jobs & Resumes","Job Resumes",100,"Casual & Temporary","JWGI","#resume #temp","#resumes","#temp","#resumes #temp","0"],["Jobs & Resumes","Job Resumes",100,"Computer & Web","JWCO","#resume #computer","#resumes","#computer","#resumes #computer","0"],["Jobs & Resumes","Job Resumes",100,"Construction & Facilities","JWCR","#resume #construction","#resumes","#construction","#resumes #construction","0"],["Jobs & Resumes","Job Resumes",100,"Consulting","JWCN","#resume #consulting","#resumes","#consulting","#resumes #consulting","0"],["Jobs & Resumes","Job Resumes",100,"Customer Service","JWCU","#resume #customerservice","#resumes","#customerservice","#resumes #customerservice","0"],["Jobs & Resumes","Job Resumes",100,"Design","JWDE","#resume #design","#resumes","#design","#resumes #design","0"],["Jobs & Resumes","Job Resumes",100,"Education","JWED","#resume #education","#resumes","#education","#resumes #education","0"],["Jobs & Resumes","Job Resumes",100,"Energy","JWEN","#resume #energy","#resumes","#energy","#resumes #energy","0"],["Jobs & Resumes","Job Resumes",100,"Engineering","JWEG","#resume #engineering","#resumes","#engineering","#resumes #engineering","0"],["Jobs & Resumes","Job Resumes",100,"Entertainment & Media","JWET","#resume #media","#resumes","#media","#resumes #media","0"],["Jobs & Resumes","Job Resumes",100,"Events","JWEV","#resume #events ","#resumes","","#resumes #events ","0"],["Jobs & Resumes","Job Resumes",100,"Finance","JWBF","#resume #finance","#resumes","#finance","#resumes #finance","0"],["Jobs & Resumes","Job Resumes",100,"Food & Beverage","JWFO","#resume #food","#resumes","#food","#resumes #food","0"],["Jobs & Resumes","Job Resumes",100,"General","JWGE","#resume #general","#resumes","#general","#resumes #general","0"],["Jobs & Resumes","Job Resumes",100,"Government","JWFE","#resume #government","#resumes","#government","#resumes #government","0"],["Jobs & Resumes","Job Resumes",100,"Healthcare","JWHC","#resume #healthcare","#resumes","#healthcare","#resumes #healthcare","0"],["Jobs & Resumes","Job Resumes",100,"Hospitality & Travel","JWHO","#resume #hospitality","#resumes","#hospitality","#resumes #hospitality","0"],["Jobs & Resumes","Job Resumes",100,"Human Resources","JWHR","#resume #HR","#resumes","#HR","#resumes #HR","0"],["Jobs & Resumes","Job Resumes",100,"Installation, Maintenance & Repair","JWRE","#resume #realestate","#resumes","#realestate","#resumes #realestate","0"],["Jobs & Resumes","Job Resumes",100,"Insurance","JWIN","#resume #insurance","#resumes","#insurance","#resumes #insurance","0"],["Jobs & Resumes","Job Resumes",100,"Law Enforcement","JWLE","#resume #enforcement","#resumes","#enforcement","#resumes #enforcement","0"],["Jobs & Resumes","Job Resumes",100,"Legal","JWLG","#resume #legal","#resumes","#legal","#resumes #legal","0"],["Jobs & Resumes","Job Resumes",100,"Management & Directorship","JWMG","#resume #management","#resumes","#management","#resumes #management","0"],["Jobs & Resumes","Job Resumes",100,"Manufacturing & Mechanical","JWMN","#resume #manufacturing","#resumes","#manufacturing","#resumes #manufacturing","0"],["Jobs & Resumes","Job Resumes",100,"Marketing, Advertising & Public Relations","JWMK","#resume #marketing","#resumes","#marketing","#resumes #marketing","0"],["Jobs & Resumes","Job Resumes",100,"Non-Profit","JWNP","#resume #nonprofit","#resumes","#nonprofit","#resumes #nonprofit","0"],["Jobs & Resumes","Job Resumes",100,"Operations & Logistics","JWOP","#resume #operations","#resumes","#operations","#resumes #operations","0"],["Jobs & Resumes","Job Resumes",100,"Other","JWOT","#resume #other","#resumes","#other","#resumes #other","0"],["Jobs & Resumes","Job Resumes",100,"Pharmaceutical","JWPH","#resume #pharma","#resumes","#pharma","#resumes #pharma","0"],["Jobs & Resumes","Job Resumes",100,"Product, Project & Program Management","JWPR","#resume #product","#resumes","#product","#resumes #product","0"],["Jobs & Resumes","Job Resumes",100,"Purchasing","JWPU","#resume #purchasing","#resumes","#purchasing","#resumes #purchasing","0"],["Jobs & Resumes","Job Resumes",100,"Quality Assurance","JWQA","#resume #QA","#resumes","#QA","#resumes #QA","0"],["Jobs & Resumes","Job Resumes",100,"Real Estate","JWIM","#resume #maintenance","#resumes","#maintenance","#resumes #maintenance","0"],["Jobs & Resumes","Job Resumes",100,"Recreation","JWRC","#resume #recreation","#resumes","#recreation","#resumes #recreation","0"],["Jobs & Resumes","Job Resumes",100,"Retail & Sales","JWRS","#resume #retailsales","#resumes","#retailsales","#resumes #retailsales","0"],["Jobs & Resumes","Job Resumes",100,"Science","JWSC","#resume #science","#resumes","#science","#resumes #science","0"],["Jobs & Resumes","Job Resumes",100,"Security","JWSE","#resume #security","#resumes","#security","#resumes #security","0"],["Jobs & Resumes","Job Resumes",100,"Skilled Trade & General Labor","JWSK","#resume #trade","#resumes","#trade","#resumes #trade","0"],["Jobs & Resumes","Job Resumes",100,"Telecommunications","JWTE","#resume #telecom","#resumes","#telecom","#resumes #telecom","0"],["Jobs & Resumes","Job Resumes",100,"Transportation","JWTR","#resume #transportation","#resumes","#transportation","#resumes #transportation","0"],["Jobs & Resumes","Job Resumes",100,"Volunteer","JWVO","#resume #volunteer","#resumes","#volunteer","#resumes #volunteer","0"],["Jobs & Resumes","Job Resumes",100,"Writing","JWWR","#resume #writing","#resumes","#writing","#resumes #writing","0"],["Leisure",null,100,null,"LZZZ",null,null,null,null,"0"],["Leisure","Nightlife",100,"Nightlife","STBA","#entertainment #bars",null,null,null,"0"],["Leisure","Restaurants",100,"Restaurants","STDI","#entertainment #restaurants",null,null,null,"0"],["Leisure","Travel",100,null,"TRZZ",null,null,null,null,"0"],["Leisure","Travel",100,"Airline Travel","STAI","#travel #air",null,null,null,"0"],["Leisure","Travel",100,"Lodging","STHO","#travel #lodging",null,null,null,"0"],["Leisure","Travel",100,"Other Travel","STOT","#travel #services",null,null,null,"0"],["Personals",null,100,null,"PZZZ",null,null,null,null,"0"],["Personals","Casual",100,null,"PCAZ",null,null,null,null,"0"],["Personals","Casual",100,"Men Seeking Men","CMSM","#personals #msw","#personal","#msm","#personal #msm","0"],["Personals","Casual",100,"Men Seeking Women","CMSW","#personals #wsm","#personal","#msw","#personal #msw","0"],["Personals","Casual",100,"Other","COTH","#personals #other","#personal","#other","#personal #other","0"],["Personals","Casual",100,"Women Seeking Men","CWSM","#personals #wsw","#personal","#wsm","#personal #wsm","0"],["Personals","Casual",100,"Women Seeking Women","CWSW","#personals #wsw","#personal","#wsw","#personal #wsw","0"],["Personals","For Love",100,null,"PREZ",null,null,null,null,"0"],["Personals","For Love",100,"Women Seeking Men","RWSM","#relationships #wsm","#relationship","#wsm","#relationship #wsm","0"],["Personals","Platonic",100,null,"PLZZ",null,null,null,null,"0"],["Personals","Platonic",100,"Men Seeking Men","PLAM","#platonic #m4m",null,null,null,"0"],["Personals","Platonic",100,"Men Seeking Women","PLAT","#platonic #m4w","#personal","#platonic","#personal #platonic","0"],["Personals","Platonic",100,"Other","PLAC","#platonic #other",null,null,null,"0"],["Personals","Platonic",100,"Women Seeking Men","PLAW","#platonic #w4m",null,null,null,"0"],["Personals","Platonic",100,"Women Seeking Women","PLWW","#platonic #w4w",null,null,null,"0"],["Personals","Romantic",100,"Men Seeking Men","RMSM","#relationships #msm","#relationship","#msm","#relationship #msm","0"],["Personals","Romantic",100,"Men Seeking Women","RMSW","#relationships #msw","#relationship","#msw","#relationship #msw","0"],["Personals","Romantic",100,"Other","ROTH","#relationships #other","#relationship","#other","#relationship #other","0"],["Personals","Romantic",100,"Women Seeking Women","RWSW","#relationships #wsw","#relationship","#wsw","#relationship #wsw","0"],["Real Estate",null,100,null,"RZZZ",null,null,null,null,"0"],["Real Estate","Commercial Property",100,null,"RECZ",null,null,null,null,"0"],["Real Estate","Commercial Property",100,"Commercial Real Estate","SROF","#realestate #office","#realestate","#commercial","#realestate #commercial","0"],["Real Estate","Commercial Property",100,"Parking & Storage","SRPS","#realestate #parking","#realestate","#storage","#realestate #storage","0"],["Real Estate","Residential Property",100,null,"RERZ",null,null,null,null,"0"],["Real Estate","Residential Property",100,"For Rent","SRAP","#realestate #rent","#housing","#rent","#housing #rent","0"],["Real Estate","Residential Property",100,"For Sale","SRAH","#realestate #forsale","#housing","#forsale","#housing #forsale","0"],["Real Estate","Residential Property",100,"Housing Swaps","SRHS","#housing #swap","#realestate","#swap","#realestate #swap","0"],["Real Estate","Residential Property",100,"Room Shares","SRRM","#housing #roommate","#realestate","#rommmate","#realestate #rommmate","0"],["Real Estate","Residential Property",100,"Sublet & Temporary Housing","SRSU","#housing #sublet","#realestate","#sublet","#realestate #sublet","0"],["Real Estate","Residential Property",100,"Vacation Properties","SRVR","#realestate #vacation","#housing","#vacation","#housing #vacation","0"],["Real Estate","Residential Property",100,"Want Housing","SRHO","#realestate #wanted","#housing","#wanted","#housing #wanted","0"],["Services",null,100,null,"SZZZ",null,null,null,null,"0"],["Services","Adult",100,"Adult","SADU","#services #erotic","#service","#adult #sex #vibrators #xxx #sextoys #porn #pussy #blowjob #nsfw #nude #bigtits #webcam #lesbians #bi #lesben #assfuck #lesbos #porno #fuck #escort","#service #erotic","0"],["Services","Artist",100,null,"SAAZ",null,null,null,null,"0"],["Services","Artist",100,"Artists","SART","#services #art","#service","#art","#service #art","0"],["Services","Artist",100,"Creative","SCRE","#services #creative","#service","#creative","#service #creative","0"],["Services","Artist",100,"Musicians","SMUS","#services #music","#service","#music","#service #music","0"],["Services","Artist",100,"Writing","SWRI","#services #writing","#service","#writing","#service #writing","0"],["Services","Education",100,null,"SEDZ",null,null,null,null,"0"],["Services","Education",100,"Classes","EDCL","#education #classes","#community","#classes","#community #classes","0"],["Services","Education",100,"Higher Education","EDDH","#education #highered","#community","#highered","#community #highered","0"],["Services","Education",100,"Lessons","EDLE","#education #lessons","#community","#lessons","#community #lessons","0"],["Services","Education",100,"Tutoring","EDTU","#education #tutor","#community","#tutor","#community #tutor","0"],["Services","Financial",100,null,"SFSZ",null,null,null,null,"0"],["Services","Financial",100,"Accounting","FACC","#services #financial #accounting","#service","#accounting","#service #financial #accounting","0"],["Services","Financial",100,"Credit","FCCR","#services #financial #credit","#service","#credit","#service #financial #credit","0"],["Services","Financial",100,"Insurance","FINS","#services #financial #insurance","#service","#insurance","#service #financial #insurance","0"],["Services","Financial",100,"Investments","FINV","#services #financial #investments","#service","#investments","#service #financial #investments","0"],["Services","Financial",100,"Loans","FLOA","#services #financial #loans","#service","#loans","#service #financial #loans","0"],["Services","Financial",100,"Mortgage","FMOR","#services #financial #mortgages","#service","#mortgages","#service #financial #mortgages","0"],["Services","Financial",100,"Other","FOTH","#services #financial #other","#service","#other","#service #financial #other","0"],["Services","Financial",100,"Trading","FTRA","#services #financial #trading","#service","#trading","#service #financial #trading","0"],["Services","Health",100,null,"SHHZ",null,null,null,null,"0"],["Services","Health",100,"Beauty","SHEE","#services #healthcare","#service","#healthcare","#service #healthcare","0"],["Services","Health",100,"Elderly Care","SELD","#services #elderlycare","#service","#elderlycare","#service #elderlycare","0"],["Services","Health",100,"Healthcare","SHEA","#services #healthcare","#service","#healthcare","#service #healthcare","0"],["Services","Household",100,null,"SHZZ",null,null,null,null,"0"],["Services","Household",100,"Childcare","SCHI","#services #childcare","#service","#childcare","#service #childcare","0"],["Services","Household",100,"Cleaning","SCLE","#services #cleaning","#service","#cleaning","#service #cleaning","0"],["Services","Household",100,"Home","SHOM","#services #household","#service","#household","#service #household","0"],["Services","Household",100,"Lawn & Garden","SLAW","#services #garden","#service","#garden","#service #garden","0"],["Services","Other",100,"Other","SOTH","#services #other","#service","#other","#service #other","0"],["Services","Professional",100,null,"SSEZ",null,null,null,null,"0"],["Services","Professional",100,"Advertising","SADV","#services #advertising","#service","#advertising","#service #advertising","0"],["Services","Professional",100,"Career ","SCAR","#services #career","#service","#career","#service #career","0"],["Services","Professional",100,"Events","SEVT","#services #events","#service","#events","#service #events","0"],["Services","Professional",100,"Food & Beverage","SFOO","#services #food","#service","#food","#service #food","0"],["Services","Professional",100,"Legal","SLEG","#services #legal","#service","#legal","#service #legal","0"],["Services","Professional",100,"Moving & Storage","SMOV","#services #moving","#service","#moving","#service #moving","0"],["Services","Professional",100,"Party Planning","SPAR","#services #entertainment","#service","#entertainment","#service #entertainment","0"],["Services","Professional",100,"Pets","SPET","#animals #services","#animal","#services","#animal #services","0"],["Services","Professional",100,"Real Estate","SREA","#services #realestate","#service","#realestate","#service #realestate","0"],["Services","Professional",100,"Skilled Trades","SSKI","#services #professional #trade","#service","#trade","#service #professional #trade","0"],["Services","Professional",100,"Spa Services","SPOO","#services #pool","#service","#pool","#service #pool","0"],["Services","Professional",100,"Technology","STEC","#services #computer","#service","#computer","#service #computer","0"],["Services","Professional",100,"Vehicle","SAUT","#services #autos","#service","#autos","#service #autos","0"],["Vehicles",null,100,null,"VZZZ",null,null,null,null,"0"],["Vehicles","Automobiles",100,null,"VEZZ",null,null,null,null,"0"],["Vehicles","Autos",100,"Auto Parts","SCPA","#vehicles #parts","#vehicle","#parts","#vehicle #parts","0"],["Vehicles","Autos",100,"Cars","SCCA","#vehicles #cars","#vehicle","#cars","#vehicle #cars","0"],["Vehicles","Autos",100,"Motorcycles","SCMO","#vehicles #motorcycles","#vehicle","#motorcycles","#vehicle #motorcycles","0"],["Vehicles","Autos",100,"Other","SCOT","#vehicles #other","#vehicle","#other","#vehicle #other","0"],["Vehicles","Autos",100,"Trailers & RVs","SCTR","#vehicles #trailers","#vehicle","#trailers","#vehicle #trailers","0"],["Vehicles","Autos",100,"Trucks, Vans & SUVs","SCTV","#vehicles #trucks","#vehicle","#trucks","#vehicle #trucks","0"],["Vehicles","Non-Autos",100,"Other","SCPO",null,null,null,null,"0"],["Vehicles","Non-Autos",100,"Parts","SCNP",null,null,null,null,"0"],["Vehicles","Non-Autos",100,"Powersports & Boats","SCBO","#vehicles #boats","#vehicle","#boats","#vehicle #boats","0"]]]
	 
	 * @example
	 * threeTapsReferenceClient.categories(callback);
	 */
	categories: function(callback) {
		return this.client.request(this.path, 'categories/get', null, null, function(results) {
			callback(results);
		});
	},
	
	/**
	 * @public
	 
	 * @restStructure GET /reference/locations/get
	 * @restUrlExample http://3taps.net/reference/locations/get

	 * @desc Returns the 3taps locations
	 
	 * @param
	 
	 * @return {Array} The body of the response will be a json-encoded list with two entries: (schema, records)
	 * 
	 * The response will have these fields:
	 * 
	 * <table>
	 *     <tr>
	 *         <td>countryRank</td><td>INT</td><td>A number used to sort the countries into a useful order (ie, to place the US at the top, and "Other" at the bottom).</td>
	 *     </tr>
	 *     <tr>
	 *         <td>country</td><td>STRING</td><td>The name of the country this location is within.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>cityRank</td><td>INT</td><td>A number used to sort the cities within a country into a useful order (eg, to place the most popular cities at the top, and "Other" at the bottom).</td>
	 *     </tr>
	 *     <tr>
	 *         <td>city</td><td>STRING</td><td>The name of the city within this country.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>stateCode</td><td>STRING</td><td>A brief (usually two-letter) code for the state or region this location is in.  This will be blank for countries which do not have states or regions.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>stateName</td><td>STRING</td><td>The name of the state or region this location is in.  This will be blank for countries which do not have states or regions.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>code</td><td>STRING</td><td>A unique three letter code identifying this location.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>hidden</td><td>BOOLEAN</td><td>If this has the value "1", the location should be hidden in the system’s user-interface.</td>
	 *     </tr>
	 * </table>
	 
	 * @example
	 * [[["countryRank","INT"],["country","STRING"],["cityRank","INT"],["city","STRING"],["stateCode","STRING"],["stateName","STRING"],["code","STRING"],["hidden","BOOLEAN"],["latitude","FLOAT"],["longitude","FLOAT"]],[[1,"United States",1,"New York","NY","New York","NYC","0",40.6344,-74.2827],[1,"United States",2,"Los Angeles","CA","California","LAX","0",33.9846,-118.112],[1,"United States",3,"Chicago","IL","Illinois","CHI","0",41.9555,-87.9474],[1,"United States",4,"Miami","FL","Florida","MIA","0",25.9865,-80.2637],[1,"United States",5,"Dallas/Fort Worth","TX","Texas","DFW","0",32.8096,-96.9713],[1,"United States",6,"Washington","DC","District of Columbia","WAS","0",38.9826,-77.0081],[1,"United States",7,"Philadelphia","PA","Pennsylvania","PHL","0",40.1715,-75.148],[1,"United States",8,"Boston","MA","Massachusetts","BOS","0",42.3198,-71.1428],[1,"United States",9,"Detroit","MI","Michigan","DET","0",42.4955,-83.2144],[1,"United States",10,"San Francisco","CA","California","SFO","0",37.747,-122.158],[1,"United States",11,"Seattle","WA","Washington","SEA","0",47.4787,-122.258],[1,"United States",100,"Abilene","TX","Texas","ABI","0",32.4361,-99.7479],[1,"United States",100,"Akron/Canton","OH","Ohio","CAK","0",41.0594,-81.4944],[1,"United States",100,"Albany","GA","Georgia","ABY","0",31.5903,-84.2022],[1,"United States",100,"Albany","NY","New York","ALB","0",42.7151,-73.8321],[1,"United States",100,"Albuquerque","NM","New Mexico","ABQ","0",35.1178,-106.577],[1,"United States",100,"Alexandria","LA","Louisiana","AEX","0",31.2983,-92.4874],[1,"United States",100,"Allentown/Bethlehem/Easton","PA","Pennsylvania","ABE","0",40.5819,-75.4904],[1,"United States",100,"Altoona","PA","Pennsylvania","AOO","0",40.4827,-78.3965],[1,"United States",100,"Amarillo","TX","Texas","AMA","0",35.2046,-101.828],[1,"United States",100,"Ames","IA","Iowa","AMW","0",42.0275,-93.6447],[1,"United States",100,"Anchorage","AK","Alaska","ANC","0",61.1662,-149.844],[1,"United States",100,"Anniston","AL","Alabama","ANB","0",33.6638,-85.8465],[1,"United States",100,"Appleton","WI","Wisconsin","ATW","0",44.2433,-88.4589],[1,"United States",100,"Asheville","NC","North Carolina","AVL","0",35.4933,-82.496],[1,"United States",100,"Athens","GA","Georgia","AHN","0",33.9355,-83.3943],[1,"United States",100,"Atlanta","GA","Georgia","ATL","0",33.7614,-84.2531],[1,"United States",100,"Auburn","AL","Alabama","AUO","0",32.6219,-85.4345],[1,"United States",100,"Augusta","GA","Georgia","AGS","0",33.4499,-82.0728],[1,"United States",100,"Austin","TX","Texas","ATN","0",30.4119,-97.7212],[1,"United States",100,"Bakersfield","CA","California","BFL","0",35.3459,-119.013],[1,"United States",100,"Baltimore","MD","Maryland","BWI","0",39.2581,-76.6531],[1,"United States",100,"Bangor","ME","Maine","BAN","0",44.8444,-68.7463],[1,"United States",100,"Baton Rouge","LA","Louisiana","BTR","0",30.4329,-91.036],[1,"United States",100,"Beaumont/Port Arthur","TX","Texas","BPT","0",30.1139,-94.1578],[1,"United States",100,"Beckley","WV","West Virginia","BKW","0",37.7749,-81.1857],[1,"United States",100,"Bellingham","WA","Washington","BLI","0",48.7528,-122.464],[1,"United States",100,"Benton Harbor","MI","Michigan","BEH","0",42.0403,-86.4914],[1,"United States",100,"Billings","MT","Montana","BIL","0",45.7933,-108.531],[1,"United States",100,"Binghamton","NY","New York","BGM","0",42.1304,-75.9854],[1,"United States",100,"Birmingham","AL","Alabama","BHM","0",33.4991,-86.8015],[1,"United States",100,"Bismarck","ND","North Dakota","BIS","0",46.8044,-100.77],[1,"United States",100,"Bloomington","IN","Indiana","BMG","0",39.1685,-86.5519],[1,"United States",100,"Bloomington/Normal","IL","Illinois","BMI","0",40.493,-88.9706],[1,"United States",100,"Boise","ID","Idaho","BOI","0",43.6161,-116.283],[1,"United States",100,"Bristol/Johnson/Kingsport","TN","Tennessee","TRI","0",36.3351,-82.3409],[1,"United States",100,"Brownsville","TX","Texas","BRO","0",25.9315,-97.4688],[1,"United States",100,"Buffalo","NY","New York","BUF","0",42.8713,-78.7866],[1,"United States",100,"Burlington","VT","Vermont","BTV","0",44.4737,-73.1649],[1,"United States",100,"Camden","NJ","New Jersey","PHI","0",39.8458,-74.9825],[1,"United States",100,"Cape Girardeau","MO","Missouri","CGI","0",37.3209,-89.5532],[1,"United States",100,"Casper","WY","Wyoming","CPR","0",42.8296,-106.328],[1,"United States",100,"Cedar Rapids","IA","Iowa","CID","0",42.018,-91.6376],[1,"United States",100,"Champaign/Urbana","IL","Illinois","CMI","0",40.0977,-88.2493],[1,"United States",100,"Charleston","SC","South Carolina","CHS","0",32.9521,-80.0843],[1,"United States",100,"Charleston","WV","West Virginia","CRW","0",38.3359,-81.7015],[1,"United States",100,"Charlotte","NC","North Carolina","CLT","0",35.1943,-80.7905],[1,"United States",100,"Charlottesville","VA","Virginia","CHO","0",38.0676,-78.4788],[1,"United States",100,"Chattanooga","TN","Tennessee","CHA","0",35.0078,-85.2063],[1,"United States",100,"Cheyenne","WY","Wyoming","CYS","0",41.1448,-104.81],[1,"United States",100,"Chicago/Rockford","IL","Illinois","RFD","0",42.2889,-89.0233],[1,"United States",100,"Chico","CA","California","CIC","0",39.7516,-121.845],[1,"United States",100,"Cincinnati/Covington","OH","Ohio","CIN","0",39.2113,-84.4328],[1,"United States",100,"Claremont","NH","New Hampshire","CNH","0",43.3667,-72.3486],[1,"United States",100,"Clarksburg","WV","West Virginia","CKB","0",39.6421,-79.9202],[1,"United States",100,"Clarksville","TN","Tennessee","CKV","0",36.5681,-87.3654],[1,"United States",100,"Cleveland","OH","Ohio","CLE","0",41.4204,-81.6573],[1,"United States",100,"Clovis","NM","New Mexico","CVN","0",34.4189,-103.202],[1,"United States",100,"College Station","TX","Texas","CLL","0",30.6392,-96.3378],[1,"United States",100,"Colorado Springs","CO","Colorado","COS","0",38.8668,-104.796],[1,"United States",100,"Columbia","MO","Missouri","COU","0",38.9532,-92.329],[1,"United States",100,"Columbia","SC","South Carolina","CAE","0",34.0497,-80.9559],[1,"United States",100,"Columbus","GA","Georgia","CSG","0",32.4893,-84.9796],[1,"United States",100,"Columbus","OH","Ohio","CMH","0",40.0089,-82.972],[1,"United States",100,"Columbus/W Point/Starkville","MS","Mississippi","GTR","0",33.5298,-88.4131],[1,"United States",100,"Corpus Christi","TX","Texas","CRP","0",27.7179,-97.3818],[1,"United States",100,"Corvallis","OR","Oregon","CVO","0",44.5786,-123.29],[1,"United States",100,"Cumberland Heights","MD","Maryland","CBE","0",39.6416,-78.7812],[1,"United States",100,"Danville","VA","Virginia","DAN","0",36.6172,-79.4149],[1,"United States",100,"Dayton","OH","Ohio","DAY","0",39.7161,-84.1371],[1,"United States",100,"Decatur","AL","Alabama","DCU","0",34.581,-87.0049],[1,"United States",100,"Decatur","IL","Illinois","DEC","0",39.859,-88.9585],[1,"United States",100,"Denver","CO","Colorado","DEN","0",39.7129,-104.988],[1,"United States",100,"Des Moines","IA","Iowa","DSM","0",41.6113,-93.7285],[1,"United States",100,"Dothan","AL","Alabama","DHN","0",31.236,-85.4325],[1,"United States",100,"Dover-Cheswold","DE","Delaware","DOV","0",39.1297,-75.5305],[1,"United States",100,"Dubuque","IA","Iowa","DBQ","0",42.5048,-90.7012],[1,"United States",100,"Duluth","MN","Minnesota","DLH","0",46.7817,-92.1406],[1,"United States",100,"Eau Claire","WI","Wisconsin","EAU","0",44.8669,-91.4501],[1,"United States",100,"El Paso","TX","Texas","ELP","0",31.7852,-106.408],[1,"United States",100,"Elmira/Corning","NY","New York","ELM","0",42.1442,-76.8321],[1,"United States",100,"Enid","OK","Oklahoma","WDG","0",36.4051,-97.8902],[1,"United States",100,"Erie","PA","Pennsylvania","ERE","0",42.0879,-80.1223],[1,"United States",100,"Eugene","OR","Oregon","EUG","0",44.0636,-123.075],[1,"United States",100,"Evansville","IN","Indiana","EVV","0",37.9952,-87.5207],[1,"United States",100,"Fargo","ND","North Dakota","FAR","0",46.8686,-96.8032],[1,"United States",100,"Fayetteville","AR","Arkansas","FYV","0",36.2069,-94.1572],[1,"United States",100,"Fayetteville","NC","North Carolina","FAY","0",35.0584,-78.9604],[1,"United States",100,"Findlay","OH","Ohio","FDY","0",41.0513,-83.6441],[1,"United States",100,"Flagstaff","AZ","Arizona","FLG","0",35.1916,-111.643],[1,"United States",100,"Florence","SC","South Carolina","FLO","0",34.1908,-79.7865],[1,"United States",100,"Fond du Lac","WI","Wisconsin","FLD","0",43.7841,-88.4501],[1,"United States",100,"Fort Collins/Loveland","CO","Colorado","FNL","0",40.4984,-105.082],[1,"United States",100,"Fort Hood/Killeen","TX","Texas","GRK","0",31.1052,-97.7305],[1,"United States",100,"Fort Myers","FL","Florida","RSW","0",26.5473,-81.8664],[1,"United States",100,"Fort Polk","LA","Louisiana","POE","0",31.0729,-93.2179],[1,"United States",100,"Fort Smith","AR","Arkansas","FSM","0",35.3551,-94.3848],[1,"United States",100,"Fort Wayne","IN","Indiana","FWA","0",41.0954,-85.1408],[1,"United States",100,"Fresno","CA","California","FAT","0",36.793,-119.771],[1,"United States",100,"Gadsden","AL","Alabama","GAD","0",34.0118,-86.0378],[1,"United States",100,"Gainesville","FL","Florida","GNV","0",29.6598,-82.3727],[1,"United States",100,"Gettysburg","PA","Pennsylvania","GTY","0",39.8103,-76.99],[1,"United States",100,"Goldsboro","NC","North Carolina","GSB","0",35.383,-77.9661],[1,"United States",100,"Goshen","IN","Indiana","GSH","0",41.6322,-85.9092],[1,"United States",100,"Grand Forks","ND","North Dakota","GFK","0",47.91,-97.0514],[1,"United States",100,"Grand Junction","CO","Colorado","GJT","0",39.089,-108.493],[1,"United States",100,"Grand Rapids","MI","Michigan","GRR","0",42.9162,-85.6773],[1,"United States",100,"Great Falls","MT","Montana","GTF","0",47.4994,-111.243],[1,"United States",100,"Green Bay","WI","Wisconsin","GRB","0",44.532,-88.0827],[1,"United States",100,"Greensboro","NC","North Carolina","GSO","0",36.1047,-80.257],[1,"United States",100,"Greenville","NC","North Carolina","PGV","0",35.5767,-77.3658],[1,"United States",100,"Greer","SC","South Carolina","GSP","0",34.8677,-82.3965],[1,"United States",100,"Gulfport","MS","Mississippi","GPT","0",30.3798,-89.0868],[1,"United States",100,"Harlingten","TX","Texas","HRL","0",26.1785,-97.7081],[1,"United States",100,"Harrisburg","PA","Pennsylvania","HAR","0",39.9652,-76.6983],[1,"United States",100,"Hattiesburg/Laurel","MS","Mississippi","PIB","0",31.3166,-89.3514],[1,"United States",100,"Hickory","NC","North Carolina","HKY","0",35.7301,-81.3983],[1,"United States",100,"Honolulu","HI","Hawaii","HNL","0",21.3524,-157.91],[1,"United States",100,"Houma","LA","Louisiana","HUM","0",29.7016,-90.7677],[1,"United States",100,"Houston","TX","Texas","HOU","0",29.7662,-95.409],[1,"United States",100,"Huntington","WV","West Virginia","HTS","0",38.4829,-82.691],[1,"United States",100,"Huntsville","AL","Alabama","HSV","0",34.7225,-86.6291],[1,"United States",100,"Hyannis","MA","Massachusetts","HYA","0",41.6823,-70.3296],[1,"United States",100,"Idaho Falls","ID","Idaho","IDA","0",43.4915,-112.018],[1,"United States",100,"Indianapolis","IN","Indiana","IPL","0",39.8044,-86.1458],[1,"United States",100,"Iowa City","IA","Iowa","IOW","0",41.6784,-91.5561],[1,"United States",100,"Ithaca","NY","New York","ITH","0",42.4643,-76.4875],[1,"United States",100,"Jackson","MI","Michigan","JXN","0",42.2531,-84.4059],[1,"United States",100,"Jackson","MS","Mississippi","JAN","0",32.3366,-90.2089],[1,"United States",100,"Jackson","TN","Tennessee","MKL","0",35.6641,-88.8267],[1,"United States",100,"Jacksonville","FL","Florida","JAX","0",30.2968,-81.7302],[1,"United States",100,"Jacksonville","NC","North Carolina","OAJ","0",34.7502,-77.3757],[1,"United States",100,"Jamestown","NY","New York","JHW","0",42.1038,-79.2658],[1,"United States",100,"Janesville","WI","Wisconsin","JVL","0",42.7013,-88.9971],[1,"United States",100,"Jefferson","OH","Ohio","JFN","0",41.873,-80.792],[1,"United States",100,"Johnstown","PA","Pennsylvania","JST","0",40.2802,-78.8606],[1,"United States",100,"Jonesboro","AR","Arkansas","JBR","0",35.83,-90.6885],[1,"United States",100,"Joplin","MO","Missouri","JLN","0",37.1,-94.4955],[1,"United States",100,"Kalamazoo","MI","Michigan","AZO","0",42.2339,-85.6043],[1,"United States",100,"Kansas City","MO","Missouri","MCI","0",38.9865,-94.5704],[1,"United States",100,"Knoxville","TN","Tennessee","TYS","0",35.9701,-84.0248],[1,"United States",100,"La Crosse","WI","Wisconsin","LSE","0",43.8574,-91.2345],[1,"United States",100,"Lafayette","IN","Indiana","LAF","0",40.3995,-86.8678],[1,"United States",100,"Lafayette","LA","Louisiana","LFT","0",30.2029,-92.0362],[1,"United States",100,"Lake Charles","LA","Louisiana","LCH","0",30.1958,-93.2017],[1,"United States",100,"Lakeland","FL","Florida","LAL","0",28.0416,-81.9695],[1,"United States",100,"Lancaster","PA","Pennsylvania","LNS","0",40.0499,-76.3249],[1,"United States",100,"Lansing","MI","Michigan","LAN","0",42.7255,-84.5422],[1,"United States",100,"Laredo","TX","Texas","LRD","0",27.5279,-99.4821],[1,"United States",100,"Las Cruces","NM","New Mexico","LRU","0",32.3168,-106.77],[1,"United States",100,"Las Vegas","NV","Nevada","LAS","0",36.1426,-115.157],[1,"United States",100,"Lawrence","KS","Kansas","LWC","0",38.954,-95.2552],[1,"United States",100,"Lawton","OK","Oklahoma","LAW","0",34.6332,-98.4167],[1,"United States",100,"Lexington","KY","Kentucky","LEX","0",38.0147,-84.4967],[1,"United States",100,"Lincoln","NE","Nebraska","LNK","0",40.8077,-96.6897],[1,"United States",100,"Little Rock","AR","Arkansas","LIT","0",34.7218,-92.3481],[1,"United States",100,"London","KY","Kentucky","LOZ","0",36.9562,-84.1043],[1,"United States",100,"Longview","TX","Texas","GGG","0",32.5173,-94.7685],[1,"United States",100,"Louisville","KY","Kentucky","SDF","0",38.1914,-85.6856],[1,"United States",100,"Lubbock","TX","Texas","LBB","0",33.5642,-101.893],[1,"United States",100,"Lumberton","NC","North Carolina","LBT","0",34.644,-79.015],[1,"United States",100,"Lynchburg","VA","Virginia","LYH","0",37.3731,-79.2124],[1,"United States",100,"Macon","GA","Georgia","MCN","0",32.611,-83.6661],[1,"United States",100,"Madison","WI","Wisconsin","MSN","0",43.0773,-89.4079],[1,"United States",100,"Mansfield","OH","Ohio","MFD","0",40.7542,-82.5243],[1,"United States",100,"McAllen","TX","Texas","MFE","0",26.235,-98.1658],[1,"United States",100,"Medford","OR","Oregon","MFR","0",42.3004,-122.829],[1,"United States",100,"Melbourne","FL","Florida","MLB","0",28.1913,-80.7012],[1,"United States",100,"Memphis","TN","Tennessee","MEM","0",35.1099,-89.9148],[1,"United States",100,"Merced","CA","California","MCE","0",37.3324,-120.532],[1,"United States",100,"Midland","TX","Texas","MAF","0",31.865,-102.402],[1,"United States",100,"Milwaukee","WI","Wisconsin","MKE","0",43.0493,-88.0981],[1,"United States",100,"Minneapolis","MN","Minnesota","MSP","0",44.9532,-93.4092],[1,"United States",100,"Missoula","MT","Montana","MSO","0",46.8455,-114.037],[1,"United States",100,"Mobile","AL","Alabama","MOB","0",30.6841,-88.1576],[1,"United States",100,"Modesto","CA","California","MOD","0",37.676,-120.985],[1,"United States",100,"Moline","IL","Illinois","MOL","0",41.4983,-90.4725],[1,"United States",100,"Monroe","LA","Louisiana","MLU","0",32.5084,-92.0674],[1,"United States",100,"Montgomery","AL","Alabama","MGM","0",32.3618,-86.2588],[1,"United States",100,"Mosinee","WI","Wisconsin","CWA","0",44.9083,-89.6052],[1,"United States",100,"Muncie","IN","Indiana","MIE","0",40.098,-85.6667],[1,"United States",100,"Muscle Shoals","AL","Alabama","MSL","0",34.8322,-87.6551],[1,"United States",100,"Myrtle Beach","SC","South Carolina","MYR","0",33.6909,-78.9015],[1,"United States",100,"Naples","FL","Florida","APF","0",26.223,-81.7487],[1,"United States",100,"Nashville","TN","Tennessee","BNA","0",36.0989,-86.7436],[1,"United States",100,"New Haven","CT","Connecticut","HVN","0",41.3843,-72.8579],[1,"United States",100,"New Orleans","LA","Louisiana","MSY","0",29.972,-90.1111],[1,"United States",100,"Newburgh","NY","New York","SWF","0",41.6299,-73.86],[1,"United States",100,"Newport News","VA","Virginia","PHF","0",37.0988,-76.4501],[1,"United States",100,"Norfolk","VA","Virginia","ORF","0",36.8335,-76.1457],[1,"United States",100,"Ocala","FL","Florida","OCF","0",29.181,-82.1145],[1,"United States",100,"Oklahoma City","OK","Oklahoma","OKC","0",35.5007,-97.5277],[1,"United States",100,"Omaha","NE","Nebraska","OMA","0",41.2379,-96.0408],[1,"United States",100,"Orlando","FL","Florida","ORL","0",28.6024,-81.3712],[1,"United States",100,"Owensboro","KY","Kentucky","OWB","0",37.7616,-87.0923],[1,"United States",100,"Paducah","KY","Kentucky","PAH","0",37.0485,-88.6227],[1,"United States",100,"Panama City","FL","Florida","PFN","0",30.2066,-85.6173],[1,"United States",100,"Parkersburg","WV","West Virginia","PKB","0",39.2843,-81.5471],[1,"United States",100,"Pasco","WA","Washington","PSC","0",46.2135,-119.194],[1,"United States",100,"Pensacola","FL","Florida","PNS","0",30.4543,-87.2862],[1,"United States",100,"Peoria","IL","Illinois","PIA","0",40.7254,-89.6294],[1,"United States",100,"Peru","IN","Indiana","GUS","0",40.4649,-86.1368],[1,"United States",100,"Phoenix","AZ","Arizona","PHX","0",33.4997,-111.987],[1,"United States",100,"Pittsburgh","PA","Pennsylvania","PIT","0",40.4128,-80.0887],[1,"United States",100,"Pittsfield","MA","Massachusetts","PSF","0",42.4592,-73.2367],[1,"United States",100,"Pocatello","ID","Idaho","PIH","0",42.8775,-112.444],[1,"United States",100,"Portland","ME","Maine","PWM","0",43.5631,-70.3377],[1,"United States",100,"Portland","OR","Oregon","PDX","0",45.4796,-122.551],[1,"United States",100,"Providence","RI","Rhode Island","PVD","0",41.7721,-71.4584],[1,"United States",100,"Provo","UT","Utah","PVU","0",40.3152,-111.715],[1,"United States",100,"Pueblo","CO","Colorado","PUB","0",38.2625,-104.605],[1,"United States",100,"Raleigh/Durham","NC","North Carolina","RDU","0",35.7848,-78.6842],[1,"United States",100,"Rapid City","SD","South Dakota","RAP","0",44.0677,-103.232],[1,"United States",100,"Redmond","OR","Oregon","RDM","0",44.0421,-121.309],[1,"United States",100,"Reno","NV","Nevada","RNO","0",39.5378,-119.798],[1,"United States",100,"Richmond","VA","Virginia","RIC","0",37.427,-77.509],[1,"United States",100,"Roanoke","VA","Virginia","ROA","0",37.2871,-79.9624],[1,"United States",100,"Rochester","MN","Minnesota","RST","0",44.0264,-92.4695],[1,"United States",100,"Rochester","NY","New York","ROC","0",43.135,-77.5327],[1,"United States",100,"Rocky Mount","NC","North Carolina","RWI","0",35.9632,-77.8064],[1,"United States",100,"Rome","NY","New York","RME","0",43.0963,-75.2709],[1,"United States",100,"Sacramento","CA","California","SAC","0",38.6937,-121.294],[1,"United States",100,"Saginaw","MI","Michigan","MBS","0",43.4541,-84.0028],[1,"United States",100,"Salinas","CA","California","SNS","0",36.726,-121.665],[1,"United States",100,"Salisbury","MD","Maryland","SBY","0",38.3553,-75.6009],[1,"United States",100,"Salt Lake City","UT","Utah","SLC","0",40.6475,-111.916],[1,"United States",100,"San Angelo","TX","Texas","SJT","0",31.4497,-100.458],[1,"United States",100,"San Antonio","TX","Texas","SAT","0",29.4885,-98.5004],[1,"United States",100,"San Diego","CA","California","SAN","0",32.7941,-117.078],[1,"United States",100,"San Jose","CA","California","SJC","0",37.3209,-121.934],[1,"United States",100,"San Luis Obispo","CA","California","SBP","0",35.1281,-120.613],[1,"United States",100,"Santa Barbara","CA","California","SBA","0",34.4288,-119.719],[1,"United States",100,"Santa Fe","NM","New Mexico","SAF","0",35.6425,-106.005],[1,"United States",100,"Santa Rosa","CA","California","STS","0",38.4238,-122.741],[1,"United States",100,"Sarasota/Bradenton","FL","Florida","SRQ","0",27.3176,-82.5028],[1,"United States",100,"Savannah","GA","Georgia","SAV","0",32.0217,-81.114],[1,"United States",100,"Selinsgrove","PA","Pennsylvania","SEG","0",40.8283,-76.8512],[1,"United States",100,"Sheboygan","WI","Wisconsin","SBM","0",43.7488,-87.7372],[1,"United States",100,"Shreveport","LA","Louisiana","SHV","0",32.45,-93.7877],[1,"United States",100,"Sioux City","IA","Iowa","SUX","0",42.4839,-96.3853],[1,"United States",100,"Sioux Falls","SD","South Dakota","FSD","0",43.5379,-96.7362],[1,"United States",100,"South Bend","IN","Indiana","SBN","0",41.7346,-86.1895],[1,"United States",100,"Spokane","WA","Washington","GEG","0",47.726,-117.357],[1,"United States",100,"Springfield","IL","Illinois","SPI","0",39.7941,-89.641],[1,"United States",100,"Springfield","MO","Missouri","SGF","0",37.1829,-93.2904],[1,"United States",100,"St Joseph","MO","Missouri","SJS","0",39.7603,-94.827],[1,"United States",100,"St Louis","MO","Missouri","STL","0",38.6449,-90.3762],[1,"United States",100,"State College","PA","Pennsylvania","SCE","0",40.7993,-77.8572],[1,"United States",100,"Stockton","CA","California","SCK","0",37.9762,-121.288],[1,"United States",100,"Stuart","FL","Florida","SUA","0",27.3083,-80.3319],[1,"United States",100,"Sumter","SC","South Carolina","SSC","0",33.9164,-80.3734],[1,"United States",100,"Syracuse","NY","New York","SYR","0",43.0781,-76.1415],[1,"United States",100,"Tallahassee","FL","Florida","TLH","0",30.4646,-84.2775],[1,"United States",100,"Tampa","FL","Florida","TPA","0",28.0289,-82.6164],[1,"United States",100,"Terre Haute","IN","Indiana","HUF","0",39.466,-87.3881],[1,"United States",100,"Texarkana","AR","Arkansas","TXK","0",33.4434,-94.075],[1,"United States",100,"Toledo","OH","Ohio","TOL","0",41.6729,-83.6277],[1,"United States",100,"Topeka","KS","Kansas","FOE","0",39.0199,-95.6901],[1,"United States",100,"Tucson","AZ","Arizona","TUS","0",32.2499,-110.933],[1,"United States",100,"Tulsa","OK","Oklahoma","TUL","0",36.0987,-95.8891],[1,"United States",100,"Tuscaloosa","AL","Alabama","TCL","0",33.1779,-87.5175],[1,"United States",100,"Tyler","TX","Texas","TYR","0",32.3188,-95.301],[1,"United States",100,"Union City","TN","Tennessee","UCY","0",36.4314,-89.0431],[1,"United States",100,"Valparaiso","FL","Florida","VPS","0",30.4253,-86.7682],[1,"United States",100,"Victoria","TX","Texas","VCT","0",28.8533,-96.9498],[1,"United States",100,"Visalia","CA","California","VIS","0",36.3199,-119.272],[1,"United States",100,"Waco","TX","Texas","WAC","0",31.5511,-97.1481],[1,"United States",100,"Wapakoneta","OH","Ohio","AXV","0",40.7354,-84.1386],[1,"United States",100,"Waterloo","IA","Iowa","ALO","0",42.4902,-92.3933],[1,"United States",100,"West Palm Beach","FL","Florida","PBI","0",26.6856,-80.1372],[1,"United States",100,"Wheeling","WV","West Virginia","HLG","0",40.0388,-80.6969],[1,"United States",100,"Wichita","KS","Kansas","ICT","0",37.6734,-97.2641],[1,"United States",100,"Wichita Falls","TX","Texas","SPS","0",33.9075,-98.5158],[1,"United States",100,"Wilkes-Barre/Scranton","PA","Pennsylvania","AVP","0",41.3297,-75.7732],[1,"United States",100,"Williamsport","PA","Pennsylvania","IPT","0",41.2478,-77.009],[1,"United States",100,"Wilmington","NC","North Carolina","ILM","0",34.2201,-77.8737],[1,"United States",100,"Windsor Locks","CT","Connecticut","BDL","0",41.7109,-72.7879],[1,"United States",100,"Yakima","WA","Washington","YKM","0",46.5849,-120.552],[1,"United States",100,"Youngstown/Warren","OH","Ohio","YNG","0",41.1315,-80.7023],[1,"United States",100,"Yuma","AZ","Arizona","YUM","0",32.6844,-114.628],[1,"United States",127,"","","","USA","0",39.5316,-99.1291],[1,"United States",127,"","AK","Alaska","AKZ","0",64.2738,-158.64],[1,"United States",127,"","AL","Alabama","ALZ","0",32.7941,-86.8307],[1,"United States",127,"","AR","Arkansas","ARZ","0",34.9028,-92.4442],[1,"United States",127,"","AZ","Arizona","AZZ","0",34.2919,-111.661],[1,"United States",127,"","CA","California","CAZ","0",37.2494,-119.604],[1,"United States",127,"","CO","Colorado","COZ","0",38.9991,-105.533],[1,"United States",127,"","CT","Connecticut","CTZ","0",41.6261,-72.7262],[1,"United States",127,"","DE","Delaware","DEZ","0",38.9979,-75.5056],[1,"United States",127,"","FL","Florida","FLZ","0",28.6593,-82.4856],[1,"United States",127,"","GA","Georgia","GAZ","0",32.6565,-83.4542],[1,"United States",127,"","HI","Hawaii","HIZ","0",19.6122,-155.508],[1,"United States",127,"","IA","Iowa","IAZ","0",42.087,-93.4968],[1,"United States",127,"","ID","Idaho","IDZ","0",44.3919,-114.651],[1,"United States",127,"","IL","Illinois","ILZ","0",40.1254,-89.1555],[1,"United States",127,"","IN","Indiana","INZ","0",39.9184,-86.2846],[1,"United States",127,"","KS","Kansas","KSZ","0",38.4843,-98.3674],[1,"United States",127,"","KY","Kentucky","KYZ","0",37.5311,-85.2894],[1,"United States",127,"","LA","Louisiana","LAZ","0",31.0874,-92.0247],[1,"United States",127,"","MA","Massachusetts","MAZ","0",42.2731,-71.8281],[1,"United States",127,"","MD","Maryland","MDZ","0",39.0598,-76.8039],[1,"United States",127,"","ME","Maine","MEZ","0",45.4035,-69.2404],[1,"United States",127,"","MI","Michigan","MIZ","0",44.8751,-85.7398],[1,"United States",127,"","MN","Minnesota","MNZ","0",46.3434,-94.1991],[1,"United States",127,"","MO","Missouri","MOZ","0",38.3819,-92.4904],[1,"United States",127,"","MS","Mississippi","MSZ","0",32.7622,-89.6708],[1,"United States",127,"","MT","Montana","MTZ","0",47.0313,-109.625],[1,"United States",127,"","NC","North Carolina","NCZ","0",35.5575,-79.4078],[1,"United States",127,"","ND","North Dakota","NDZ","0",47.4444,-100.459],[1,"United States",127,"","NE","Nebraska","NEZ","0",41.5293,-99.7923],[1,"United States",127,"","NH","New Hampshire","NHZ","0",43.6899,-71.5783],[1,"United States",127,"","NJ","New Jersey","NJZ","0",40.1948,-74.6668],[1,"United States",127,"","NM","New Mexico","NMZ","0",34.4217,-106.11],[1,"United States",127,"","NV","Nevada","NVZ","0",39.354,-116.652],[1,"United States",127,"","NY","New York","NYZ","0",43.0512,-75.7599],[1,"United States",127,"","OH","Ohio","OHZ","0",40.4174,-82.7114],[1,"United States",127,"","OK","Oklahoma","OKZ","0",35.5879,-97.5114],[1,"United States",127,"","OR","Oregon","ORZ","0",43.9399,-120.546],[1,"United States",127,"","PA","Pennsylvania","PAZ","0",40.8989,-77.8421],[1,"United States",127,"","RI","Rhode Island","RIZ","0",41.6983,-71.5948],[1,"United States",127,"","SC","South Carolina","SCZ","0",33.9184,-80.9008],[1,"United States",127,"","SD","South Dakota","SDZ","0",44.4389,-100.221],[1,"United States",127,"","TN","Tennessee","TNZ","0",35.8523,-86.3408],[1,"United States",127,"","TX","Texas","TXZ","0",31.5054,-99.3593],[1,"United States",127,"","UT","Utah","UTZ","0",39.3265,-111.674],[1,"United States",127,"","VA","Virginia","VAZ","0",37.5286,-78.8826],[1,"United States",127,"","VT","Vermont","VTZ","0",44.077,-72.6649],[1,"United States",127,"","WA","Washington","WAZ","0",47.375,-120.413],[1,"United States",127,"","WI","Wisconsin","WIZ","0",44.6445,-89.7363],[1,"United States",127,"","WV","West Virginia","WVZ","0",38.6468,-80.6114],[1,"United States",127,"","WY","Wyoming","WYZ","0",42.9993,-107.54],[100,"Afghanistan",100,"Kabul","","","KBL","0",34.521,69.1653],[100,"Afghanistan",127,"","","","AFG","0",33.8389,66.0265],[100,"Albania",100,"Tirana","","","TIA","0",41.3326,19.8336],[100,"Albania",127,"","","","ABN","0",41.1425,20.0684],[100,"Algeria",100,"Algiers","","","ALG","0",36.7508,3.0578],[100,"Algeria",127,"","","","DZA","0",28.1634,2.6324],[100,"American Samoa",100,"","","","SMA","0",-14.3043,-170.708],[100,"Angola",100,"Luanda","","","LAD","0",-8.813,13.2393],[100,"Angola",127,"","","","AGO","0",-12.3353,17.5724],[100,"Anguilla",100,"Anguilla","","","AXA","0",18.0315,-63.0502],[100,"Anguilla",127,"","","","AIA","0",18.2242,-63.058],[100,"Antigua and Barbuda",100,"Antigua","","","ANU","0",17.0776,-61.8],[100,"Antigua and Barbuda",127,"","","","ATG","0",17.0717,-61.7851],[100,"Argentina",1,"Buenos Aires","","","BUE","0",-34.6149,-58.5731],[100,"Argentina",100,"Cordoba","","","COR","0",-31.4014,-64.1938],[100,"Argentina",100,"El Calafate","","","FTE","0",0,0],[100,"Argentina",100,"Mendoza","","","MEN","0",-32.8955,-68.8323],[100,"Argentina",100,"Puerto Iguazu","","","IGR","0",-25.6038,-54.5767],[100,"Argentina",100,"Ushuaia","","","USH","0",0,0],[100,"Argentina",127,"","","","ARG","0",-35.1778,-65.1441],[100,"Armenia",100,"Yerevan","","","EVN","0",40.1677,44.503],[100,"Armenia",127,"","","","ARM","0",40.286,44.9472],[100,"Aruba",100,"Aruba","","","AUA","0",0,0],[100,"Aruba",127,"","","","ABW","0",12.5167,-69.9771],[100,"Australia",100,"Adelaide","SA","South Australia","ADL","0",-34.8852,138.594],[100,"Australia",100,"Brisbane","QL","Queensland","BNE","0",-27.4954,152.992],[100,"Australia",100,"Cairns","QL","Queensland","CNS","0",-16.9218,145.757],[100,"Australia",100,"Melbourne","VI","Victoria","MEL","0",-37.9039,145.223],[100,"Australia",100,"Perth","WA","Western Australia","PER","0",-31.9627,115.864],[100,"Australia",100,"Sydney","NS","New South Wales","SYD","0",-33.8424,151.045],[100,"Australia",127,"","","","AUS","0",-25.5743,134.353],[100,"Australia",127,"","AC","Australian Capital Territory","ACT","0",-35.4976,149.007],[100,"Australia",127,"","NS","New South Wales","NSW","0",-32.169,147.015],[100,"Australia",127,"","NT","Northern Territory","NOT","0",-19.4769,133.372],[100,"Australia",127,"","QL","Queensland","QLD","0",-22.5772,144.539],[100,"Australia",127,"","SA","South Australia","SOA","0",-30.0778,135.821],[100,"Australia",127,"","TA","Tasmania","TAS","0",-42.0172,146.596],[100,"Australia",127,"","VI","Victoria","VIC","0",-36.8544,144.307],[100,"Australia",127,"","WA","Western Australia","WAU","0",-25.4692,122.179],[100,"Austria",100,"Vienna","","","VIE","0",48.1962,16.349],[100,"Austria",127,"","","","AUT","0",47.593,14.14],[100,"Azerbaijan",100,"Baku","","","GYD","0",40.4067,49.886],[100,"Azerbaijan",127,"","","","AZE","0",40.3546,47.6629],[100,"Bahama",1,"Nassau","","","NAS","0",25.0655,-77.3395],[100,"Bahama",100,"Freeport","","","FPO","0",26.5348,-78.6296],[100,"Bahama",100,"Marsh Harbour","","","MHH","0",0,0],[100,"Bahama",127,"","","","BHS","0",24.7011,-78.0402],[100,"Bahrain",100,"Bahrain","","","BAH","0",0,0],[100,"Bahrain",127,"","","","BHR","0",26.0409,50.5433],[100,"Bangladesh",100,"Dhaka","","","DAC","0",23.7088,90.4074],[100,"Bangladesh",127,"","","","BGD","0",23.8764,90.2534],[100,"Barbados",100,"Bridgetown","","","BGI","0",13.0926,-59.6043],[100,"Barbados",127,"","","","BRB","0",13.1788,-59.5621],[100,"Belarus",100,"Minsk","","","MSQ","0",53.8992,27.5857],[100,"Belarus",127,"","","","BLR","0",53.5402,28.047],[100,"Belgium",100,"Brussels","","","BRU","0",50.8404,4.3622],[100,"Belgium",127,"","","","BEL","0",50.643,4.6643],[100,"Benin",100,"Cotonou","","","COO","0",0,0],[100,"Benin",127,"","","","BEN","0",9.6477,2.3433],[100,"Bermuda",100,"","","","BDA","0",32.3093,-64.7527],[100,"Bhutan",100,"Paro","","","PBH","0",0,0],[100,"Bhutan",127,"","","","BTN","0",27.4155,90.4294],[100,"Bolivia",100,"La Paz","","","LPB","0",-16.502,-68.1421],[100,"Bolivia",100,"Santa Cruz","","","VVI","0",-17.7919,-63.1854],[100,"Bolivia",127,"","","","BOL","0",-16.7151,-64.6705],[100,"Bosnia and Herzegovina",100,"Sarajevo","","","SJJ","0",43.859,18.4187],[100,"Bosnia and Herzegovina",127,"","","","BIH","0",44.1687,17.786],[100,"Botswana",100,"Gaborone","","","GBE","0",0,0],[100,"Botswana",127,"","","","BWA","0",-22.182,23.8151],[100,"Brazil",1,"Rio de Janeiro","","","RIO","0",-22.8143,-43.3803],[100,"Brazil",2,"São Paulo","","","SAO","0",-23.5829,-46.6407],[100,"Brazil",100,"Belo Horizonte","","","CNF","0",-19.8567,-43.9831],[100,"Brazil",100,"Brasília","","","BSB","0",-15.7892,-47.9059],[100,"Brazil",100,"Curitiba","","","CWB","0",-25.4556,-49.2652],[100,"Brazil",100,"Florianópolis","","","FLN","0",-27.5877,-48.6063],[100,"Brazil",100,"Fortaleza","","","FOR","0",-3.7644,-38.5505],[100,"Brazil",100,"Manáus","","","MAO","0",0,0],[100,"Brazil",100,"Porto Alegre","","","POA","0",-29.8893,-51.1681],[100,"Brazil",100,"Recife","","","REC","0",-8.1029,-34.9139],[100,"Brazil",100,"Salvador","","","SSA","0",-12.9772,-38.4941],[100,"Brazil",127,"","","","BRA","0",-10.8348,-53.1123],[100,"British Virgin Islands",100,"Anegada","","","AGD","0",18.7343,-64.3384],[100,"British Virgin Islands",100,"Jost Van Dyke","","","JVD","0",18.4523,-64.7484],[100,"British Virgin Islands",100,"Tortola","","","TOR","0",18.4292,-64.6286],[100,"British Virgin Islands",100,"Virgin Gorda","","","VIG","0",18.4837,-64.3997],[100,"British Virgin Islands",127,"","","","BVI","0",18.4216,-64.6248],[100,"Brunei Darussalam",100,"Bandar Seri Begawan","","","BWN","0",4.938,114.94],[100,"Brunei Darussalam",127,"","","","BND","0",4.5008,114.638],[100,"Bulgaria",100,"Sofia","","","SOF","0",42.7002,23.3231],[100,"Bulgaria",127,"","","","BGR","0",42.7614,25.2314],[100,"Burkina Faso",100,"Ouagadougou","","","OUA","0",12.363,-1.5344],[100,"Burkina Faso",127,"","","","BFA","0",12.2779,-1.7398],[100,"Burundi",100,"Bujumbura","","","BJM","0",-3.3787,29.3614],[100,"Burundi",127,"","","","BDI","0",-3.3563,29.8868],[100,"Cambodia",100,"Phnom Penh","","","PNH","0",11.5593,104.914],[100,"Cambodia",127,"","","","KHM","0",12.7165,104.924],[100,"Cameroon",100,"Douala","","","DLA","0",4.0445,9.7159],[100,"Cameroon",127,"","","","CMR","0",5.6859,12.7433],[100,"Canada",1,"Toronto","ON","Ontario","YYZ","0",43.7001,-79.3959],[100,"Canada",2,"Vancouver","BC","British Columbia","YVR","0",49.2455,-123.017],[100,"Canada",3,"Montreal","QC","Quebec","YUL","0",45.4946,-73.6537],[100,"Canada",4,"Calgary","AB","Alberta","YYC","0",51.0334,-114.077],[100,"Canada",5,"Ottawa","ON","Ontario","YOW","0",45.3946,-75.6981],[100,"Canada",6,"Edmonton","AB","Alberta","YEG","0",53.5677,-113.518],[100,"Canada",100,"Abbotsford","BC","British Columbia","YXX","0",49.1322,-122.3],[100,"Canada",100,"Charlottetown","PE","Prince Edward Island","YYG","0",46.2395,-63.1322],[100,"Canada",100,"Comox","BC","British Columbia","YQQ","0",49.6838,-124.931],[100,"Canada",100,"Fort McMurray","AB","Alberta","YMM","0",56.7323,-111.427],[100,"Canada",100,"Fredericton","NB","New Brunswick","YFC","0",45.9512,-66.653],[100,"Canada",100,"Grande Prairie","AB","Alberta","YQU","0",55.1702,-118.797],[100,"Canada",100,"Halifax","NS","Nova Scotia","YHZ","0",44.6702,-63.5507],[100,"Canada",100,"Hamilton","ON","Ontario","YHM","0",43.2499,-79.8483],[100,"Canada",100,"Kamloops","BC","British Columbia","YKA","0",50.7089,-120.391],[100,"Canada",100,"Kelowna","BC","British Columbia","YLW","0",49.871,-119.451],[100,"Canada",100,"Kingston","ON","Ontario","YGK","0",44.2324,-76.5028],[100,"Canada",100,"Kitchener/Waterloo","ON","Ontario","YKF","0",43.4535,-80.4856],[100,"Canada",100,"London","ON","Ontario","YXU","0",42.9577,-81.6141],[100,"Canada",100,"Moncton","NB","New Brunswick","YQM","0",46.1039,-64.7838],[100,"Canada",100,"Prince George","BC","British Columbia","YXS","0",53.9089,-122.761],[100,"Canada",100,"Quebec City","QC","Quebec","YQB","0",46.8227,-71.2337],[100,"Canada",100,"Regina","SK","Saskatchewan","YQR","0",50.4495,-104.614],[100,"Canada",100,"Saint John","NB","New Brunswick","YSJ","0",45.284,-66.0591],[100,"Canada",100,"Saint Johns","NL","Newfoundland and Labrador","YYT","0",47.5622,-52.7304],[100,"Canada",100,"Saskatoon","SK","Saskatchewan","YXE","0",52.1474,-106.664],[100,"Canada",100,"Sydney","NS","Nova Scotia","YQY","0",46.153,-60.1935],[100,"Canada",100,"Thunder Bay","ON","Ontario","YQT","0",48.4092,-89.2602],[100,"Canada",100,"Victoria","BC","British Columbia","YYJ","0",48.4512,-123.36],[100,"Canada",100,"Whitehorse","YU","Yukon","YXY","0",60.7281,-135.046],[100,"Canada",100,"Windsor","ON","Ontario","YQG","0",42.4439,-83.1771],[100,"Canada",100,"Winnipeg","MB","Manitoba","YWG","0",49.8816,-97.1609],[100,"Canada",100,"Yellowknife","NT","Northwest Territories","YZF","0",62.457,-114.351],[100,"Canada",127,"","","","CAN","0",57.7147,-101.656],[100,"Canada",127,"","AB","Alberta","ABZ","0",55.1672,-114.51],[100,"Canada",127,"","BC","British Columbia","BCZ","0",54.9754,-124.587],[100,"Canada",127,"","MB","Manitoba","MBZ","0",54.9204,-97.4374],[100,"Canada",127,"","NB","New Brunswick","NBZ","0",46.6289,-66.3821],[100,"Canada",127,"","NL","Newfoundland and Labrador","NLZ","0",54.2561,-61.9678],[100,"Canada",127,"","NS","Nova Scotia","NSZ","0",44.9079,-63.9522],[100,"Canada",127,"","NT","Northwest Territories","NTZ","0",64.3732,-119.629],[100,"Canada",127,"","NU","Nunavut","NUZ","0",65.9115,-98.5836],[100,"Canada",127,"","ON","Ontario","ONZ","0",50.0682,-85.8291],[100,"Canada",127,"","PE","Prince Edward Island","PEZ","0",46.4007,-63.2496],[100,"Canada",127,"","QC","Quebec","QCZ","0",53.7453,-71.9329],[100,"Canada",127,"","SK","Saskatchewen","SKZ","0",54.4187,-105.899],[100,"Canada",127,"","YU","Yukon","YUZ","0",63.6359,-135.509],[100,"Cape Verde",100,"Sal","","","SID","0",0,0],[100,"Cape Verde",127,"","","","CPV","0",15.0718,-23.6351],[100,"Cayman Islands",100,"Grand Cayman Island","","","GCM","0",19.3195,-81.2541],[100,"Cayman Islands",127,"","","","CYM","0",19.3081,-81.2393],[100,"Central African Republic",100,"Bangui","","","BGF","0",4.3696,18.5555],[100,"Central African Republic",127,"","","","CAF","0",6.5715,20.4828],[100,"Chad",100,"Ndjamena","","","NDJ","0",12.1065,15.0411],[100,"Chad",127,"","","","TCD","0",15.3611,18.6646],[100,"Chile",100,"Punta Arenas","","","PUQ","0",-53.1463,-70.9245],[100,"Chile",100,"Santiago","","","SCL","0",-33.4757,-70.6331],[100,"Chile",127,"","","","CHL","0",-35.5126,-71.2555],[100,"China",1,"Hong Kong","","","HKG","0",22.3205,114.188],[100,"China",2,"Beijing","","","PEK","0",39.9149,116.377],[100,"China",100,"Chengdu","","","CTU","0",30.6595,104.073],[100,"China",100,"Dalian","","","DLC","0",38.928,121.588],[100,"China",100,"Guangzhou","","","GAN","0",23.14,113.282],[100,"China",100,"Guilin","","","KWL","0",25.2909,110.283],[100,"China",100,"Hangzhou","","","HGH","0",30.2576,120.161],[100,"China",100,"Kunming","","","KMG","0",25.0429,102.713],[100,"China",100,"Lhasa","","","LXA","0",29.6461,91.1315],[100,"China",100,"Nanking/Nanjing","","","NKG","0",32.0524,118.77],[100,"China",100,"Qingdao","","","TAO","0",36.1258,120.361],[100,"China",100,"Sanya","","","SYX","0",0,0],[100,"China",100,"Shanghai","","","SHA","0",31.2498,121.464],[100,"China",100,"Shenyang","","","SHE","0",41.8004,123.407],[100,"China",100,"Shenzhen","","","SZX","0",22.5498,113.892],[100,"China",100,"Wuhan","","","WUH","0",30.6025,114.271],[100,"China",100,"Xiamen","","","XMN","0",24.4551,118.084],[100,"China",100,"Xian","","","XIY","0",34.2607,108.935],[100,"China",127,"","","","CHN","0",36.621,103.81],[100,"Christmas Island",100,"","","","XCH","0",-10.4441,105.704],[100,"Cocos (Keeling) Islands",100,"","","","CCK","0",-12.1694,96.8381],[100,"Colombia",1,"Bogota","","","BOG","0",4.6251,-74.0893],[100,"Colombia",100,"Barranquilla","","","BAQ","0",10.9717,-74.8013],[100,"Colombia",100,"Cali","","","CLO","0",3.4611,-76.504],[100,"Colombia",100,"Cartagena","","","CTG","0",10.4083,-75.5077],[100,"Colombia",100,"Medellin","","","MDE","0",6.2429,-75.5735],[100,"Colombia",100,"Pereira","","","PEI","0",4.7963,-75.6724],[100,"Colombia",127,"","","","COL","0",3.9004,-73.072],[100,"Comoros",100,"Moroni","","","HAH","0",0,0],[100,"Comoros",127,"","","","COM","0",-11.6663,43.3416],[100,"Costa Rica",100,"San Jose","","","SJO","0",9.9267,-84.0833],[100,"Costa Rica",127,"","","","CRI","0",9.9704,-84.1882],[100,"Côte d'Ivoire",100,"Abidjan","","","ABJ","0",5.2895,-4.0036],[100,"Côte d'Ivoire",127,"","","","CIV","0",7.6349,-5.5571],[100,"Croatia",100,"Zagreb","","","ZAG","0",45.8105,15.9768],[100,"Croatia",127,"","","","HRV","0",45.147,16.4237],[100,"Cuba",100,"Havana","","","HAV","0",23.0885,-82.3822],[100,"Cuba",127,"","","","CUB","0",21.6108,-78.9659],[100,"Cyprus",100,"Larnaca","","","LCA","0",34.9163,33.6396],[100,"Cyprus",127,"","","","CYP","0",35.043,33.2186],[100,"Czech Republic",100,"Prague","","","PRG","0",50.0893,14.3994],[100,"Czech Republic",127,"","","","CZE","0",49.743,15.3383],[100,"Democratic Republic of the Congo",100,"Kinshasa","","","FIH","0",-4.3298,15.3009],[100,"Democratic Republic of the Congo",127,"","","","COD","0",-2.8761,23.655],[100,"Denmark",1,"Copenhagen","","","CPH","0",55.7092,12.4747],[100,"Denmark",100,"Billund","","","BLL","0",55.7615,8.9244],[100,"Denmark",127,"","","","DNK","0",56.0365,9.3165],[100,"Djibouti",100,"","","","JIB","0",11.7498,42.5779],[100,"Dominica",100,"","","","DMA","0",15.4366,-61.3555],[100,"Dominican Republic",1,"Santo Domingo","","","SDQ","0",18.4903,-69.9007],[100,"Dominican Republic",100,"La Romana","","","LRM","0",18.429,-68.9681],[100,"Dominican Republic",100,"Puerto Plata","","","POP","0",19.7972,-70.6911],[100,"Dominican Republic",100,"Punta Cana","","","PUJ","0",0,0],[100,"Dominican Republic",100,"Santiago","","","STI","0",19.4578,-70.7057],[100,"Dominican Republic",127,"","","","DOM","0",18.8964,-70.4896],[100,"East Timor",100,"Dili","","","DIL","0",-8.5692,125.58],[100,"East Timor",127,"","","","TMP","0",-8.7997,125.951],[100,"Ecuador",100,"Guayaquil","","","GYE","0",-2.2017,-79.898],[100,"Ecuador",100,"Quito","","","UIO","0",-0.1905,-78.4968],[100,"Ecuador",127,"","","","ECU","0",-1.4487,-78.386],[100,"Egypt",1,"Cairo","","","CAI","0",30.1055,31.304],[100,"Egypt",100,"Hurghada","","","HRG","0",0,0],[100,"Egypt",100,"Luxor","","","LXR","0",25.6977,32.6444],[100,"Egypt",100,"Mersa Matruh","","","MUH","0",0,0],[100,"Egypt",100,"Sharm el Sheikh","","","SSH","0",0,0],[100,"Egypt",127,"","","","EGY","0",26.4939,29.8719],[100,"Equatorial Guinea",100,"Malabo","","","SSG","0",3.7511,8.7818],[100,"Equatorial Guinea",127,"","","","GNQ","0",1.5679,10.476],[100,"Eritrea",100,"Asmara","","","ASM","0",15.3306,38.9266],[100,"Eritrea",127,"","","","ERI","0",15.3562,38.8443],[100,"Estonia",100,"Tallinn","","","TLL","0",59.4213,24.73],[100,"Estonia",127,"","","","EST","0",58.6892,25.8322],[100,"Ethiopia",100,"Addis Ababa","","","ADD","0",9.0187,38.749],[100,"Ethiopia",127,"","","","ETH","0",8.6261,39.616],[100,"Falkland Islands (Islas Malvinas)",100,"Mount Pleasant","","","MPN","0",0,0],[100,"Falkland Islands (Islas Malvinas)",127,"","","","FLK","0",-51.7476,-58.763],[100,"Faroe Islands",100,"","","","FAE","0",62.128,-6.9801],[100,"Federated States of Micronesia",100,"","","","MIC","0",6.8791,158.229],[100,"Finland",100,"Helsinki","","","HEL","0",60.177,24.9473],[100,"Finland",127,"","","","FIN","0",64.5191,26.2908],[100,"France",1,"Paris","","","PAR","0",48.8795,2.4126],[100,"France",100,"Bordeaux","","","BOD","0",44.8401,-0.6081],[100,"France",100,"Grenoble","","","GNB","0",45.1904,5.7207],[100,"France",100,"Lyon","","","LYS","0",45.7486,4.8602],[100,"France",100,"Marseille","","","MRS","0",43.3039,5.3901],[100,"France",100,"Montpellier","","","MPL","0",43.6165,3.8705],[100,"France",100,"Nantes","","","NTE","0",47.2335,-1.5668],[100,"France",100,"Nice","","","NCE","0",43.7162,7.2869],[100,"France",100,"Strasbourg","","","SXB","0",48.579,7.7588],[100,"France",100,"Toulouse","","","TLS","0",43.6014,1.4444],[100,"France",127,"","","","FRA","0",46.6315,2.4556],[100,"French Guiana",100,"Cayenne","","","CAY","0",4.9354,-52.3282],[100,"French Guiana",127,"","","","GUF","0",3.9244,-53.2413],[100,"Gabon",100,"Libreville","","","LBV","0",0.3908,9.4591],[100,"Gabon",127,"","","","GAB","0",-0.5906,11.7988],[100,"Gambia",100,"Banjul","","","BJL","0",13.4491,-16.5891],[100,"Gambia",127,"","","","GMB","0",13.4529,-15.3856],[100,"Georgia",100,"Tbilisi","","","TBS","0",41.7109,44.8076],[100,"Georgia",127,"","","","GEO","0",42.1763,43.5176],[100,"Germany",1,"Frankfurt am Main","","","FRM","0",50.1219,8.6759],[100,"Germany",2,"Munich","","","MUC","0",48.1477,11.5403],[100,"Germany",3,"Berlin","","","BER","0",52.467,13.5235],[100,"Germany",100,"Bremen","","","BRE","0",53.0875,8.8393],[100,"Germany",100,"Cologne","","","CGN","0",50.9561,6.9419],[100,"Germany",100,"Dortmund","","","DTM","0",51.5035,7.0462],[100,"Germany",100,"Dresden","","","DRS","0",51.0621,13.7115],[100,"Germany",100,"Duesseldorf","","","DUS","0",51.234,6.8072],[100,"Germany",100,"Hamburg","","","HAM","0",53.6039,10.0837],[100,"Germany",100,"Hannover","","","HAJ","0",52.3911,9.7739],[100,"Germany",100,"Leipzig/Halle","","","LEJ","0",51.3439,12.4091],[100,"Germany",100,"Muenster","","","FMO","0",51.9605,7.6299],[100,"Germany",100,"Nuremberg","","","NUE","0",49.4472,11.06],[100,"Germany",100,"Stuttgart","","","STR","0",48.7831,9.2187],[100,"Germany",127,"","","","DEU","0",51.0909,10.3809],[100,"Ghana",100,"Accra","","","ACC","0",5.5657,-0.2037],[100,"Ghana",127,"","","","GHA","0",7.9596,-1.207],[100,"Gibraltar",100,"","","","GIB","0",36.1382,-5.3449],[100,"Greece",1,"Athens","","","ATH","0",37.9814,23.7166],[100,"Greece",100,"Heraklion","","","HER","0",35.3359,25.1337],[100,"Greece",100,"Rhodes","","","RHO","0",36.4407,28.2266],[100,"Greece",100,"Thessaloniki","","","SKG","0",40.6265,22.9631],[100,"Greece",127,"","","","GRC","0",39.4772,22.5896],[100,"Greenland",100,"Nuuk","","","GOH","0",0,0],[100,"Greenland",127,"","","","GRL","0",74.7464,-41.4589],[100,"Grenada",100,"","","","GND","0",12.1119,-61.6811],[100,"Guadeloupe",100,"Pointe-a-Pitre","","","PTP","0",16.2447,-61.529],[100,"Guadeloupe",127,"","","","GLP","0",16.2322,-61.5667],[100,"Guam",100,"","","","GUM","0",13.444,144.776],[100,"Guinea",100,"Conakry","","","CKY","0",9.5429,-13.676],[100,"Guinea",127,"","","","GIN","0",10.4385,-10.9418],[100,"Guinea-Bissau",100,"","","","OXB","0",12.0504,-14.9288],[100,"Guyana",100,"Georgetown","","","GTN","0",6.8043,-58.1526],[100,"Guyana",127,"","","","GUY","0",4.7917,-58.9743],[100,"Haiti",100,"Port Au Prince","","","PAP","0",18.5429,-72.3343],[100,"Haiti",127,"","","","HTI","0",18.9345,-72.6691],[100,"Hungary",100,"Budapest","","","BUD","0",47.4845,19.1242],[100,"Hungary",127,"","","","HUN","0",47.1665,19.4135],[100,"Iceland",100,"Reykjavík","","","REK","0",64.1426,-21.92],[100,"Iceland",127,"","","","ISL","0",64.9977,-18.6057],[100,"India",1,"Delhi","","","DEL","0",28.6211,77.1784],[100,"India",2,"Mumbai","","","BOM","0",19.0667,72.8885],[100,"India",100,"Ahmedabad","","","AMD","0",23.0343,72.5881],[100,"India",100,"Amritsar","","","ATQ","0",31.6282,74.8635],[100,"India",100,"Bengaluru","","","BLU","0",12.9798,77.5901],[100,"India",100,"Chennai","","","MAA","0",13.0648,80.2488],[100,"India",100,"Goa","","","GOI","0",15.5278,73.9035],[100,"India",100,"Hyderabad","","","HYD","0",17.3977,78.4901],[100,"India",100,"Jaipur","","","JAI","0",26.913,75.8088],[100,"India",100,"Kochi","","","COK","0",9.9712,76.2858],[100,"India",100,"Kolkata","","","CCU","0",22.5833,88.3444],[100,"India",100,"Kozhikode","","","CCJ","0",11.2558,75.7824],[100,"India",100,"Pune","","","PNQ","0",18.5375,73.8577],[100,"India",100,"Thiruvananthapuram","","","TRV","0",8.506,76.9577],[100,"India",100,"Vadodara","","","BDQ","0",22.3016,73.1932],[100,"India",127,"","","","IND","0",22.9091,79.587],[100,"Indonesia",1,"Denpasar Bali","","","DPS","0",-8.3547,115.118],[100,"Indonesia",100,"Balikpapan","","","BPN","0",0,0],[100,"Indonesia",100,"Jakarta","","","JKT","0",-6.1746,106.83],[100,"Indonesia",100,"Surabaya","","","SUB","0",-7.2561,112.74],[100,"Indonesia",127,"","","","IDN","0",-0.198,114.016],[100,"Iran",1,"Tehran","","","THR","0",35.7113,51.4263],[100,"Iran",100,"Imam Khomeini","","","IKA","0",34.6488,50.8887],[100,"Iran",127,"","","","IRN","0",32.5711,54.3],[100,"Iraq",100,"Baghdad","","","BGW","0",33.3299,44.4003],[100,"Iraq",127,"","","","IRQ","0",33.048,43.7722],[100,"Ireland",1,"Dublin","","","DUB","0",53.3331,-6.2573],[100,"Ireland",100,"Cork","","","ORK","0",51.8978,-8.47],[100,"Ireland",100,"Galway","","","GWY","0",53.2741,-9.0571],[100,"Ireland",100,"Shannon","","","SNN","0",0,0],[100,"Ireland",127,"","","","IRL","0",53.1742,-8.1454],[100,"Israel",100,"Tel Aviv Yafo","","","TLV","0",32.0643,34.8075],[100,"Israel",127,"","","","ISR","0",31.3581,34.966],[100,"Italy",1,"Rome","","","ROM","0",41.9023,12.4877],[100,"Italy",2,"Milan","","","MIL","0",45.4877,9.198],[100,"Italy",3,"Venice","","","VCE","0",45.4859,12.2343],[100,"Italy",100,"Bari","","","BRI","0",41.1215,16.866],[100,"Italy",100,"Bologna","","","BLQ","0",44.5016,11.3454],[100,"Italy",100,"Catania","","","CTA","0",37.5045,15.08],[100,"Italy",100,"Florence","","","FLR","0",43.782,11.2242],[100,"Italy",100,"Genoa","","","GOA","0",44.4188,8.924],[100,"Italy",100,"Naples","","","NAP","0",40.8488,14.2826],[100,"Italy",100,"Palermo","","","PMO","0",38.1247,13.3519],[100,"Italy",100,"Pisa","","","PSA","0",43.7128,10.4076],[100,"Italy",100,"Trieste","","","TRS","0",45.646,13.7855],[100,"Italy",100,"Turin","","","TRN","0",45.071,7.6667],[100,"Italy",100,"Verona","","","VRN","0",45.4392,10.9982],[100,"Italy",127,"","","","ITA","0",43.527,12.1566],[100,"Jamaica",1,"Montego Bay","","","MBJ","0",18.4689,-77.9217],[100,"Jamaica",100,"Kingston","","","KIN","0",17.992,-76.7937],[100,"Jamaica",127,"","","","JAM","0",18.1513,-77.3198],[100,"Japan",1,"Tokyo","","","TYO","0",35.7006,139.68],[100,"Japan",100,"Fukuoka","","","FUK","0",33.5869,130.406],[100,"Japan",100,"Nagoya","","","NGO","0",35.1253,136.906],[100,"Japan",100,"Okinawa","","","OKA","0",0,0],[100,"Japan",100,"Osaka","","","OSA","0",34.6593,135.47],[100,"Japan",127,"","","","JPN","0",36.6419,137.974],[100,"Jordan",100,"Amman","","","AMM","0",31.9526,35.9264],[100,"Jordan",127,"","","","JOR","0",31.2534,36.7869],[100,"Kazakhstan",100,"Almaty","","","ALA","0",43.2775,76.9304],[100,"Kazakhstan",127,"","","","KAZ","0",48.1603,67.3029],[100,"Kenya",1,"Nairobi","","","NBO","0",-1.2757,36.8105],[100,"Kenya",100,"Mombasa","","","MBA","0",-4.0533,39.6667],[100,"Kenya",127,"","","","KEN","0",0.5307,37.8567],[100,"Kosovo",100,"Pristina","","","PRN","0",42.6693,21.1677],[100,"Kosovo",127,"","","","KOS","0",0,0],[100,"Kuwait",100,"","","","KWI","0",29.3213,47.5625],[100,"Kyrgyzstan",100,"Bishkek","","","FRU","0",42.8757,74.601],[100,"Kyrgyzstan",127,"","","","KGZ","0",41.4649,74.5555],[100,"Laos",100,"Vientiane","","","VTE","0",17.9658,102.605],[100,"Laos",127,"","","","LAO","0",18.5025,103.763],[100,"Latvia",100,"Riga","","","RIX","0",56.9717,24.1635],[100,"Latvia",127,"","","","LVA","0",56.8577,24.9292],[100,"Lebanon",100,"Beirut","","","BEY","0",33.878,35.5327],[100,"Lebanon",127,"","","","LBN","0",33.9204,35.8881],[100,"Lesotho",100,"Maseru","","","MSU","0",-29.1882,27.4599],[100,"Lesotho",127,"","","","LSO","0",-29.581,28.2428],[100,"Liberia",100,"Monrovia","","","ROB","0",0,0],[100,"Liberia",127,"","","","LBR","0",6.4481,-9.3078],[100,"Libya",100,"Tripoli","","","TIP","0",32.8672,13.1824],[100,"Libya",127,"","","","LBY","0",27.044,18.0232],[100,"Liechtenstein",100,"Vaduz","","","VAD","0",47.146,9.5298],[100,"Liechtenstein",127,"","","","LIE","0",47.1526,9.5553],[100,"Lithuania",100,"Vilnius","","","VNO","0",54.6839,25.2763],[100,"Lithuania",127,"","","","LTU","0",55.3356,23.9024],[100,"Luxembourg",100,"","","","LUX","0",49.771,6.0875],[100,"Macao",100,"","","","MFM","0",22.1995,113.545],[100,"Macedonia",100,"Skopje","","","SKP","0",41.9994,21.4665],[100,"Macedonia",127,"","","","MKD","0",41.5997,21.6981],[100,"Madagascar",100,"Antananarivo","","","TNR","0",-18.9148,47.5291],[100,"Madagascar",127,"","","","MDG","0",-19.3779,46.7039],[100,"Malawi",100,"Lilongwe","","","LLW","0",-13.9843,33.7733],[100,"Malawi",127,"","","","MWI","0",-13.2155,34.3069],[100,"Malaysia",1,"Kuala Lumpur","","","KUL","0",3.1499,101.711],[100,"Malaysia",100,"Kota Kinabalu","","","BKI","0",5.9689,116.073],[100,"Malaysia",100,"Penang","","","PEN","0",5.4726,100.467],[100,"Malaysia",127,"","","","MYS","0",3.6152,114.733],[100,"Maldives",100,"Male","","","MLE","0",0,0],[100,"Maldives",127,"","","","MDV","0",6.7524,73.147],[100,"Mali",100,"Bamako","","","BKO","0",12.6508,-7.9927],[100,"Mali",127,"","","","MLI","0",17.3504,-3.5243],[100,"Malta",100,"","","","MLA","0",35.8908,14.4415],[100,"Marshall Islands",100,"","","","MHL","0",7.309,168.718],[100,"Martinique",100,"Fort De France","","","FDF","0",14.6079,-61.0723],[100,"Martinique",127,"","","","MTQ","0",14.6528,-61.0215],[100,"Mauritania",100,"Nouakchott","","","NKC","0",0,0],[100,"Mauritania",127,"","","","MRT","0",20.26,-10.3311],[100,"Mauritius",100,"Mauritius","","","MRU","0",-20.1635,57.4977],[100,"Mauritius",127,"","","","MUS","0",-20.2814,57.5641],[100,"Mayotte",100,"Dzaoudzi","","","DZO","0",0,0],[100,"Mayotte",127,"","","","MYT","0",-12.8197,45.1348],[100,"Mexico",1,"Cancun","","","CUN","0",0,0],[100,"Mexico",2,"Mexico City","","","MXC","0",19.4064,-99.1341],[100,"Mexico",100,"Acapulco","","","ACA","0",16.8495,-99.8944],[100,"Mexico",100,"Aguascalientes","","","AGU","0",21.8864,-102.295],[100,"Mexico",100,"Cozumel","","","CZM","0",0,0],[100,"Mexico",100,"Culiacan","","","CUL","0",24.802,-107.394],[100,"Mexico",100,"Guadalajara","","","GDL","0",20.6761,-103.354],[100,"Mexico",100,"Hermosillo","","","HMO","0",29.0973,-110.953],[100,"Mexico",100,"Huatulco","","","HUX","0",0,0],[100,"Mexico",100,"Ixtapa/Zihuatanejo","","","ZIH","0",0,0],[100,"Mexico",100,"La Paz","","","LAP","0",25.0238,-100.55],[100,"Mexico",100,"Leon/Guanajuato","","","BJX","0",21.1213,-101.685],[100,"Mexico",100,"Manzanillo","","","ZLO","0",19.0464,-104.329],[100,"Mexico",100,"Mazatlan","","","MZT","0",23.2056,-106.419],[100,"Mexico",100,"Merida","","","MID","0",20.9765,-89.6191],[100,"Mexico",100,"Monterrey","","","MTY","0",25.6889,-100.31],[100,"Mexico",100,"Morelia","","","MLM","0",19.6966,-101.188],[100,"Mexico",100,"Oaxaca","","","OAX","0",17.0646,-96.717],[100,"Mexico",100,"Puebla","","","PBC","0",19.0496,-98.1999],[100,"Mexico",100,"Puerto Vallarta","","","PVR","0",0,0],[100,"Mexico",100,"Queretaro","","","QRO","0",20.5909,-100.393],[100,"Mexico",100,"San Jose Cabo","","","SJD","0",19.5223,-99.1638],[100,"Mexico",100,"Tijuana","","","TIJ","0",32.5284,-117.026],[100,"Mexico",100,"Veracruz","","","VER","0",19.1835,-96.1308],[100,"Mexico",127,"","","","MEX","0",23.944,-102.513],[100,"Moldova",100,"Chisinau","","","KIV","0",47.0244,28.8482],[100,"Moldova",127,"","","","MDA","0",47.1933,28.4743],[100,"Monaco",100,"Monte Carlo","","","MON","0",43.751,7.4246],[100,"Monaco",127,"","","","MCO","0",43.7503,7.412],[100,"Mongolia",100,"Ulaanbaatar","","","ULN","0",47.9207,106.922],[100,"Mongolia",127,"","","","MNG","0",46.8352,103.083],[100,"Montenegro",100,"Podgorica","","","TGD","0",42.4425,19.2683],[100,"Montenegro",127,"","","","MNT","0",42.7922,19.254],[100,"Montserrat",100,"","","","MNI","0",16.7358,-62.1869],[100,"Morocco",1,"Casablanca","","","MAR","0",33.5967,-7.6116],[100,"Morocco",100,"Agadir","","","AGA","0",30.4186,-9.6076],[100,"Morocco",100,"Marrakesh","","","RAK","0",31.6274,-8.0091],[100,"Morocco",100,"Rabat","","","RBA","0",34.0023,-6.8438],[100,"Morocco",100,"Tangier","","","TNG","0",35.7867,-5.8139],[100,"Morocco",127,"","","","MOR","0",31.8836,-6.3178],[100,"Mozambique",100,"Maputo","","","MPM","0",-25.9659,32.5773],[100,"Mozambique",127,"","","","MZB","0",-17.259,35.5517],[100,"Myanmar",100,"Yangon","","","RGN","0",16.831,96.1465],[100,"Myanmar",127,"","","","MMR","0",21.1976,96.5136],[100,"Namibia",100,"Windhoek","","","WDH","0",-22.5641,17.0789],[100,"Namibia",127,"","","","NAM","0",-22.1333,17.2184],[100,"Nepal",100,"Kathmandu","","","KTM","0",27.7064,85.3172],[100,"Nepal",127,"","","","NPL","0",28.253,83.9385],[100,"Netherlands",1,"Amsterdam","","","AMS","0",52.3664,4.8676],[100,"Netherlands",100,"Rotterdam","","","RTM","0",52.0752,4.3072],[100,"Netherlands",127,"","","","NLD","0",52.2505,5.6543],[100,"Netherlands Antilles",100,"Bonaire","","","BON","0",0,0],[100,"Netherlands Antilles",100,"Curacao","","","CUR","0",12.1854,-68.9682],[100,"Netherlands Antilles",100,"St Maarten","","","SXM","0",18.0664,-63.0666],[100,"Netherlands Antilles",127,"","","","ANT","0",12.1878,-68.9675],[100,"New Zealand",1,"Auckland","","","AKL","0",-36.9203,174.795],[100,"New Zealand",2,"Wellington","","","WLG","0",-41.2985,174.778],[100,"New Zealand",3,"Christchurch","","","CHC","0",-43.5266,172.634],[100,"New Zealand",100,"Dunedin","","","DUD","0",-45.8841,170.497],[100,"New Zealand",100,"Hamilton","","","HLZ","0",-37.7858,175.282],[100,"New Zealand",100,"Palmerston North","","","PMR","0",-40.3578,175.609],[100,"New Zealand",100,"Rotorua","","","ROT","0",-38.1383,176.235],[100,"New Zealand",100,"Tauranga","","","TRG","0",-37.6935,176.145],[100,"New Zealand",127,"","","","NZL","0",-43.9883,170.513],[100,"Niger",100,"Niamey","","","NIM","0",13.5141,2.1109],[100,"Niger",127,"","","","NER","0",17.4263,9.3977],[100,"Nigeria",100,"Abuja","","","ABV","0",0,0],[100,"Nigeria",100,"Lagos","","","LOS","0",6.4448,3.4143],[100,"Nigeria",127,"","","","NGA","0",9.5952,8.1056],[100,"Niue",100,"","","","IUE","0",-19.0519,-169.869],[100,"North Korea",100,"Pyongyang","","","FNJ","0",39.035,125.74],[100,"North Korea",127,"","","","PRK","0",40.1431,127.182],[100,"Northern Mariana Islands",100,"","","","MNP","0",14.9953,145.622],[100,"Norway",1,"Oslo","","","OSL","0",59.9104,10.7333],[100,"Norway",100,"Bergen","","","BGO","0",60.3644,5.3286],[100,"Norway",100,"Stavanger","","","SVG","0",58.9582,5.7241],[100,"Norway",127,"","","","NOR","0",64.2166,13.959],[100,"Oman",100,"Muscat","","","MCT","0",23.6013,58.5469],[100,"Oman",127,"","","","OMN","0",20.5741,56.1033],[100,"Pakistan",1,"Karachi","","","KHI","0",24.8906,67.0287],[100,"Pakistan",100,"Islamabad","","","ISB","0",33.6093,73.057],[100,"Pakistan",100,"Lahore","","","LHE","0",31.5403,74.3442],[100,"Pakistan",127,"","","","PAK","0",29.9671,69.3859],[100,"Palau",100,"","","","PLW","0",7.5151,134.575],[100,"Palestine",100,"Gaza","","","PAL","0",0,0],[100,"Palestine",127,"","","","PST","0",31.9464,35.2564],[100,"Paraguay",100,"Asuncion","","","ASU","0",-25.3,-57.5946],[100,"Paraguay",127,"","","","PRY","0",-23.2361,-58.391],[100,"Peru",1,"Lima","","","LIM","0",-12.0833,-77.05],[100,"Peru",100,"Cuzco","","","CUZ","0",-13.5243,-71.9833],[100,"Peru",127,"","","","PRU","0",-9.1638,-74.3754],[100,"Philippines",1,"Manila","","","MNL","0",14.6079,121.012],[100,"Philippines",100,"Cebu","","","CEB","0",10.3094,123.896],[100,"Philippines",100,"Davao","","","DVO","0",7.0766,125.612],[100,"Philippines",127,"","","","PHP","0",15.9454,121.429],[100,"Poland",1,"Warsaw","","","WAW","0",52.2323,21.1222],[100,"Poland",100,"Gdañsk","","","GDN","0",54.5285,18.5195],[100,"Poland",100,"Katowice","","","KTW","0",50.2639,19.0212],[100,"Poland",100,"Krakow","","","KRK","0",50.0587,19.9516],[100,"Poland",100,"Poznan","","","POZ","0",52.3993,16.9132],[100,"Poland",100,"Wroclaw","","","WRO","0",51.1128,17.0412],[100,"Poland",127,"","","","POL","0",52.1247,19.4009],[100,"Portugal",1,"Lisbon","","","LIS","0",38.7554,-9.1483],[100,"Portugal",100,"Faro","","","FAO","0",37.0189,-7.9295],[100,"Portugal",100,"Madeira","","","FNC","0",0,0],[100,"Portugal",100,"Porto","","","OPO","0",41.1647,-8.5963],[100,"Portugal",127,"","","","PRT","0",39.692,-7.9624],[100,"Puerto Rico",1,"San Juan","","","SJU","0",18.4123,-66.0596],[100,"Puerto Rico",100,"Aguadilla","","","BQN","0",18.4346,-67.1509],[100,"Puerto Rico",100,"Mayaguez","","","MYZ","0",18.2056,-67.1394],[100,"Puerto Rico",100,"Ponce","","","PSE","0",18.0185,-66.6143],[100,"Puerto Rico",127,"","","","PRI","0",18.2232,-66.481],[100,"Qatar",100,"Doha","","","DOH","0",25.2876,51.4948],[100,"Qatar",127,"","","","QAT","0",25.3158,51.1912],[100,"Republic of the Congo",100,"Brazzaville","","","BZV","0",-4.2702,15.2787],[100,"Republic of the Congo",127,"","","","COG","0",-0.8401,15.2243],[100,"Réunion",100,"Saint Denis","","","RUN","0",-20.8677,55.4572],[100,"Réunion",127,"","","","REU","0",-21.1216,55.5382],[100,"Romania",1,"Bucharest","","","BUH","0",44.4381,26.0978],[100,"Romania",100,"Cluj Napoca","","","CLJ","0",46.7773,23.6108],[100,"Romania",100,"Timisoara","","","TSR","0",45.746,21.2288],[100,"Romania",127,"","","","RMN","0",45.8436,24.9692],[100,"Russia",1,"Moscow","","","MOW","0",55.7816,37.6803],[100,"Russia",100,"Saint Petersburg","","","LED","0",59.8876,30.3436],[100,"Russia",127,"","","","RUS","0",61.6374,99.0169],[100,"Rwanda",100,"Kigali","","","KGL","0",-1.9518,30.0599],[100,"Rwanda",127,"","","","RWA","0",-1.998,29.9172],[100,"Saint Helena",100,"","","","ASI","0",-15.962,-5.7173],[100,"Saint Kitts and Nevis",100,"","","","SKB","0",17.3262,-62.7535],[100,"Saint Lucia",100,"","","","SLU","0",13.8981,-60.9687],[100,"Saint Vincent and the Grenadines",100,"","","","SVD","0",13.2551,-61.1937],[100,"São Tomé and Príncipe",100,"","","","TMS","0",0.2275,6.6062],[100,"Saudi Arabia",100,"Dammam","","","DMM","0",26.4301,50.1025],[100,"Saudi Arabia",100,"Jeddah","","","JED","0",21.5155,39.1843],[100,"Saudi Arabia",100,"Riyadh","","","RUH","0",24.6319,46.6847],[100,"Saudi Arabia",127,"","","","SAU","0",24.0255,44.5864],[100,"Senegal",100,"Dakar","","","DKR","0",14.7036,-17.4651],[100,"Senegal",127,"","","","SEN","0",14.367,-14.4682],[100,"Serbia",100,"Belgrade","","","BEG","0",44.794,20.4809],[100,"Serbia",127,"","","","SER","0",44.0323,20.8056],[100,"Seychelles",100,"Mahe Island","","","SEZ","0",-4.6781,55.4656],[100,"Seychelles",127,"","","","SYC","0",-4.6596,55.472],[100,"Sierra Leone",100,"Freetown","","","FNA","0",8.4828,-13.2292],[100,"Sierra Leone",127,"","","","SLE","0",8.5692,-11.7843],[100,"Singapore",100,"","","","SIN","0",1.3512,103.808],[100,"Slovakia",100,"Bratislava","","","BTS","0",48.1599,17.1355],[100,"Slovakia",127,"","","","SVK","0",48.7074,19.4915],[100,"Slovenia",100,"Ljubljana","","","LJU","0",46.0605,14.5067],[100,"Slovenia",127,"","","","SVN","0",46.1236,14.8271],[100,"Somalia",100,"Bossaso","","","BSA","0",0,0],[100,"Somalia",127,"","","","SOM","0",6.0637,45.8626],[100,"South Africa",1,"Johannesburg","","","JNB","0",-26.1546,28.058],[100,"South Africa",2,"Cape Town","","","CPT","0",-33.9807,18.4698],[100,"South Africa",100,"Durban","","","DUR","0",-29.8362,30.9242],[100,"South Africa",100,"George","","","GRJ","0",-33.9648,22.4634],[100,"South Africa",100,"Port Elizabeth","","","PLZ","0",-33.9396,25.5738],[100,"South Africa",127,"","","","ZAF","0",-28.9932,25.0887],[100,"South Korea",100,"Busan","","","PUS","0",35.1502,129.059],[100,"South Korea",100,"Seoul","","","SEL","0",37.578,127.004],[100,"South Korea",127,"","","","KOR","0",36.4488,127.868],[100,"Spain",1,"Madrid","","","MAD","0",40.4287,-3.6968],[100,"Spain",2,"Barcelona","","","BCN","0",41.395,2.1592],[100,"Spain",100,"Alicante","","","ALC","0",38.3501,-0.4957],[100,"Spain",100,"Asturias","","","OVD","0",43.3693,-5.848],[100,"Spain",100,"Bilbao","","","BIO","0",43.289,-2.977],[100,"Spain",100,"Fuerteventura","","","FUE","0",0,0],[100,"Spain",100,"Granada","","","GRX","0",37.178,-3.5979],[100,"Spain",100,"Ibiza","","","IBZ","0",38.9094,1.4285],[100,"Spain",100,"Jerez de la Frontera","","","XRY","0",36.6941,-6.1294],[100,"Spain",100,"Lanzarote","","","ACE","0",0,0],[100,"Spain",100,"Las Palmas","","","LPA","0",0,0],[100,"Spain",100,"Malaga","","","AGP","0",36.7278,-4.421],[100,"Spain",100,"Murcia","","","MJV","0",37.9822,-1.1312],[100,"Spain",100,"Palma de Mallorca","","","PMI","0",39.5698,2.644],[100,"Spain",100,"Santiago de Compostela","","","SCQ","0",0,0],[100,"Spain",100,"Sevilla","","","SVQ","0",37.3859,-5.9792],[100,"Spain",100,"Tenerife","","","TFS","0",0,0],[100,"Spain",100,"Valencia","","","VLC","0",39.4722,-0.3635],[100,"Spain",100,"Vigo","","","VGO","0",42.2364,-8.713],[100,"Spain",127,"","","","ESP","0",40.392,-3.5571],[100,"Sri Lanka",100,"Colombo","","","CMB","0",6.9229,79.8631],[100,"Sri Lanka",127,"","","","LKA","0",7.6051,80.7064],[100,"Sudan",100,"Khartoum","","","KRT","0",15.5654,32.5311],[100,"Sudan",127,"","","","SDN","0",13.8316,30.0501],[100,"Suriname",100,"Paramaribo","","","PBM","0",5.8228,-55.1667],[100,"Suriname",127,"","","","SUR","0",4.1267,-55.9116],[100,"Svalbard",100,"Longyearbyen","","","LYR","0",0,0],[100,"Svalbard",127,"","","","SJM","0",78.606,15.898],[100,"Swaziland",100,"Manzini","","","MTS","0",0,0],[100,"Swaziland",127,"","","","SWZ","0",-26.5621,31.4972],[100,"Sweden",100,"Göteborg","","","GOT","0",57.6875,11.993],[100,"Sweden",100,"Stockholm","","","STO","0",59.251,18.0575],[100,"Sweden",127,"","","","SWE","0",62.8422,16.7337],[100,"Switzerland",1,"Zurich","","","ZRH","0",47.3806,8.5495],[100,"Switzerland",2,"Geneva","","","GVA","0",46.2071,6.1373],[100,"Switzerland",100,"Basel/Mulhouse","","","BSL","0",47.5537,7.5916],[100,"Switzerland",100,"Bern","","","BRN","0",46.9498,7.4516],[100,"Switzerland",127,"","","","CHE","0",46.8026,8.2346],[100,"Syria",100,"Damascus","","","DAM","0",33.5186,36.3103],[100,"Syria",127,"","","","SYA","0",35.0131,38.5058],[100,"Taiwan",1,"Taipei","","","TPE","0",25.0377,121.509],[100,"Taiwan",100,"Kaohsiung","","","KHH","0",22.624,120.28],[100,"Taiwan",127,"","","","TWN","0",23.7512,120.962],[100,"Tajikistan",100,"Dushanbe","","","DYU","0",38.5656,68.7682],[100,"Tajikistan",127,"","","","TJK","0",38.5278,71.0422],[100,"Tanzania",100,"Dar Es Salaam","","","DAR","0",-6.832,39.2736],[100,"Tanzania",100,"Kilimanjaro","","","JRO","0",0,0],[100,"Tanzania",100,"Zanzibar","","","ZNZ","0",-6.1668,39.2012],[100,"Tanzania",127,"","","","TZA","0",-6.2709,34.8081],[100,"Thailand",1,"Bangkok","","","BKK","0",13.7558,100.552],[100,"Thailand",100,"Chiang Mai","","","CNX","0",0,0],[100,"Thailand",100,"Ko Samui","","","USM","0",9.5201,99.9393],[100,"Thailand",100,"Krabi","","","KBV","0",0,0],[100,"Thailand",100,"Phuket","","","HKT","0",7.8766,98.3855],[100,"Thailand",127,"","","","THA","0",15.1445,101.02],[100,"Togo",100,"Lome","","","LFW","0",6.1324,1.2319],[100,"Togo",127,"","","","TGO","0",8.5349,0.9758],[100,"Trinidad and Tobago",1,"Port Of Spain/Trinidad","","","POS","0",10.4188,-61.2939],[100,"Trinidad and Tobago",100,"Tobago","","","TAB","0",11.2373,-60.6641],[100,"Trinidad and Tobago",127,"","","","TTO","0",10.4165,-61.2918],[100,"Tunisia",100,"Tunis","","","TNS","0",36.802,10.1804],[100,"Tunisia",127,"","","","TUN","0",34.1113,9.5556],[100,"Turkey",1,"Istanbul","","","IST","0",41.0299,28.9393],[100,"Turkey",100,"Ankara","","","ESB","0",39.9341,32.858],[100,"Turkey",100,"Antalya","","","AYT","0",36.8921,30.71],[100,"Turkey",100,"Dalaman","","","DLM","0",0,0],[100,"Turkey",127,"","","","TUR","0",38.9886,35.4378],[100,"Turkmenistan",100,"Ashgabat","","","ASB","0",37.9474,58.3855],[100,"Turkmenistan",127,"","","","TKM","0",39.1222,59.3845],[100,"Turks and Caicos Islands",100,"Providenciales","","","PLS","0",0,0],[100,"Turks and Caicos Islands",127,"","","","TCA","0",21.8086,-71.7428],[100,"Uganda",100,"Entebbe","","","EBB","0",0.0574,32.4661],[100,"Uganda",127,"","","","UGA","0",1.2801,32.3862],[100,"Ukraine",1,"Kiev","","","KBP","0",50.4506,30.4816],[100,"Ukraine",100,"Odessa","","","ODS","0",46.4718,30.7198],[100,"Ukraine",127,"","","","UKR","0",49.0171,31.3873],[100,"United Arab Emirates",1,"Dubai","","","DXB","0",25.2183,55.2544],[100,"United Arab Emirates",100,"Abu Dhabi","","","AUH","0",24.4677,54.3713],[100,"United Arab Emirates",127,"","","","UAE","0",23.9091,54.3377],[100,"United Kingdom",1,"London","","","LON","0",51.4969,-0.2142],[100,"United Kingdom",2,"Manchester","","","MAN","0",53.4816,-2.2443],[100,"United Kingdom",3,"Edinburgh","","","EDI","0",55.9454,-3.2186],[100,"United Kingdom",4,"Birmingham","","","BHX","0",52.5096,-1.9648],[100,"United Kingdom",5,"Glasgow","","","GLA","0",55.8607,-4.3098],[100,"United Kingdom",100,"Aberdeen","","","ABD","0",57.1475,-2.1292],[100,"United Kingdom",100,"Belfast","","","BFS","0",54.612,-5.9314],[100,"United Kingdom",100,"Bournemouth","","","BOH","0",50.7418,-1.9072],[100,"United Kingdom",100,"Bristol","","","BRS","0",51.4649,-2.5795],[100,"United Kingdom",100,"Cardiff","","","CWL","0",51.4992,-3.197],[100,"United Kingdom",100,"Doncaster","","","DSA","0",53.3894,-1.4468],[100,"United Kingdom",100,"Exeter","","","EXT","0",50.7271,-3.5212],[100,"United Kingdom",100,"Humberside","","","HUY","0",53.616,-0.2207],[100,"United Kingdom",100,"Inverness","","","INV","0",57.4767,-4.2312],[100,"United Kingdom",100,"Isle Of Man","","","IOM","0",54.2306,-4.5415],[100,"United Kingdom",100,"Jersey","","","JER","0",0,0],[100,"United Kingdom",100,"Leeds","","","LBA","0",53.8063,-1.6367],[100,"United Kingdom",100,"Liverpool","","","LPL","0",53.4228,-2.9332],[100,"United Kingdom",100,"Newcastle","","","NCL","0",54.9713,-1.5568],[100,"United Kingdom",100,"Norwich","","","NWI","0",52.6405,1.2812],[100,"United Kingdom",100,"Nottingham","","","EMA","0",52.961,-1.1766],[100,"United Kingdom",100,"Southampton","","","SOU","0",50.9224,-1.4091],[100,"United Kingdom",100,"Teesside","","","MME","0",54.573,-1.218],[100,"United Kingdom",127,"","","","GBR","0",53.9492,-2.5218],[100,"Uruguay",100,"Montevideo","","","MVD","0",-34.8708,-56.1609],[100,"Uruguay",127,"","","","URY","0",-32.7996,-56.0122],[100,"US Virgin Islands",1,"St Thomas Island","","","STT","0",18.3512,-64.9306],[100,"US Virgin Islands",100,"St Croix Island","","","STX","0",17.7398,-64.7721],[100,"US Virgin Islands",100,"St John Island","","","STJ","0",18.3454,-64.7379],[100,"US Virgin Islands",127,"","","","UVI","0",17.7357,-64.7621],[100,"Uzbekistan",100,"Tashkent","","","TAK","0",41.3114,69.2742],[100,"Uzbekistan",127,"","","","UZB","0",41.7504,63.1695],[100,"Venezuela",100,"Caracas","","","CCS","0",10.4866,-66.8947],[100,"Venezuela",127,"","","","VEN","0",7.115,-66.1796],[100,"Vietnam",1,"Ho Chi Minh City","","","SGN","0",10.7719,106.679],[100,"Vietnam",100,"Hanoi","","","HAN","0",21.0234,105.835],[100,"Vietnam",127,"","","","VNM","0",16.6676,106.303],[100,"Yemen",100,"Sanaa","","","SAH","0",15.3533,44.2062],[100,"Yemen",127,"","","","YEM","0",15.8382,47.573],[100,"Zambia",100,"Lusaka","","","LUN","0",-15.4075,28.298],[100,"Zambia",127,"","","","ZMB","0",-13.4531,27.7979],[100,"Zimbabwe",100,"Harare","","","HRE","0",-17.8221,31.057],[100,"Zimbabwe",127,"","","","ZWE","0",-19,29.8718],[127,"Everywhere",100,"","","","ZZZ","0",0,0]]]
	 
	 * @example
	 * threeTapsReferenceClient.locations(callback);
	 */
	locations: function(callback) {
		return this.client.request(this.path, 'locations/get', null, null, function(results) {
			callback(results);
		});
	},
	
	/**
	 * @public
	 
	 * @restStructure GET /reference/sources/get
	 * @restUrlExample http://3taps.net/reference/sources/get

	 * @desc Returns the 3taps sources
	 
	 * @param
	 
	 * @return {Array} The body of the response will be a json-encoded list with two entries: (schema, records)
	 * 
	 * The response will have these fields:
	 * 
	 * <table>
	 *     <tr>
	 *         <td>source</td><td>STRING</td><td>The 5-character code for this source.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>name</td><td>STRING</td><td>The name of the external source.</td>
	 *     </tr>
	 *     <tr>
	 *         <td>searchURL</td><td>STRING</td><td>The template string for a search query, if this source has a search API.</td>
	 *     </tr>
	 * </table>
	 
	 * @example
	 * [[["code","STRING"],["name","STRING"],["external_search_api_url","STRING"],["unique_external_id","BOOLEAN"],["logo_url","STRING"],["logo_sm_url","STRING"],["outgoingHashtag","STRING"]],[["3TAPS","3taps",null,"0","",null,"3taps"],["AMZON","Amazon","http://74.207.251.241/search","0","",null,"Amazon"],["CRAIG","craigslist",null,"1","http://3taps.com/img/logos/craig.png","http://3taps.com/img/logos/craig_ico.png","craigslist"],["E_BAY","eBay",null,"1","http://3taps.com/img/logos/e_bay.png","http://3taps.com/img/logos/e_bay_ico.png","eBay"],["EBAYM","eBay Motors",null,"1","http://3taps.com/img/logos/ebaym.png","http://3taps.com/img/logos/ebaym_ico.png","eBayMotors"],["HMNGS","Hemmings",null,"0","http://3taps.com/img/logos/hmngs.png","http://3taps.com/img/logos/hmngs_ico.png","Hemmings"],["INDEE","Indeed",null,"0","http://3taps.com/img/logos/indee.png","http://3taps.com/img/logos/indee_ico.png","Indeed"],["INTRN","InternMatch",null,"0","",null,"InternMatch"],["LNKDN","LinkedIn",null,"0","http://3taps.com/img/logos/lnkdn.png","http://3taps.com/img/logos/lnkdn_ico.png","LinkedIn"],["O_L_X","OLX",null,"0","http://3taps.com/img/logos/o_l_x.png","http://3taps.com/img/logos/o_l_x_ico.png","OLX"],["OODLE","Oodle",null,"0","",null,"Oodle"],["TWITT","twitter",null,"0","http://3taps.com/img/logos/twitt.png","http://3taps.com/img/logos/twitt_ico.png","twitter"]]]
	 
	 * @example
	 * threeTapsReferenceClient.sources(callback);
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
 * A set of trustedAnnotations which provide additional "trusted" meta-data about this posting. As with the annotations, the trusted annotations are a JSON-encoded string containing any arbitrary data structure. The trusted annotations can only come from 3taps or some other authorised source.
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
	 
	 * @restStructure POST /posting/checkduplicates

	 * @desc The checkduplicates request queries the system for a post already matching the data provided.

	 * @param {String} src src should be a valid 5-character 3taps source code, while externalIDs should be a JSON-encoded array of strings, where each string value is the posting’s unique identifier, as defined by its system of origin. The string can be any combination of alpha-numeric characters.
	 * @param {String} externalIDs externalIDs should be a comma-separated list of IDs from the data source
	 * @param

	 * @return {Array} The body of the response will consist of a JSON-encoded array of integers, one for each entry in the externalIDs list. Each integer will have the value 1 if the corresponding posting already exists in the 3taps database, or 0 if it does not.

	 * @example
	 * [1,1,1]
	 
	 * @example
	 * var externalIDs = ['250735499738', '190474346962', '280597358968'];
	 * threeTapsPostingClient.checkduplicates('e_bay', JSON.stringify(externalIDs), callback);
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
	 
	 * @restStructure POST /posting/delete
	 
	 * @desc The delete request deletes postings from the 3taps posting database.

	 * @param {String} agentID The agentID should be a string identifying the entity which is sending this request. Note that entities which are not whitelisted can only request geocoding for one posting at a time, and will be liable to rate limiting.
	 * @param {String} authID The authID value is a string which authorizes the external system to make this request.  The specific value to send will be defined when the external system is whitelisted.  For non-whitelisted systems, this should be left blank.
	 * @param {Array} data data should be a JSON-encoded array with one entry for each posting to be deleted. Each posting’s entry in the array should be a string consisting of the posting key for the posting to be deleted.

	 * @return {Array} The body of the response should consist of a JSON-encoded array with one entry for each posting that was included in the request. Each array entry should be an integer with the value 1 if the posting was successfully deleted, or 0 if the posting could not be deleted (for example, because the posting has already been deleted).
	 
	 * @exampleFuture
	 * [1,1,1]
	 
	 * @exampleFuture
	 * var postKeys = ['X7J67W', 'X7JZDY'];
	 * threeTapsPostingClient.delete(JSON.stringify(postKeys), callback);
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
	 
	 * @restStructure GET /posting/get/[postKey]
	 * @restUrlExample http://3taps.net/posting/get/X7J67W

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
	 
	 * @example {String}
	 * {"heading":"OHSEN Dual Time Chronograph Alarm Mens Sport Watch Blue","body":"<table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"950\"><!--DWLayoutTable--><tbody><tr><td valign=\"top\" width=\"200\" height=\"156\"><img src=\"http://imgs.inkfrog.com/pix/funshop/poewr_01.gif\" width=\"200\" height=\"156\"></td><td valign=\"top\" width=\"750\"><img src=\"http://imgs.inkfrog.com/pix/funshop/poewr_022.gif\" usemap=\"#Map\" border=\"0\" width=\"750\" height=\"59\"><img src=\"http://imgs.inkfrog.com/pix/funshop/poewr_04.gif\" width=\"529\" height=\"97\"><img src=\"http://imgs.inkfrog.com/pix/funshop/poewr_05.gif\" width=\"221\" height=\"97\"></td></tr></tbody></table><table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"950\"><!--DWLayoutTable--><tbody><tr><td valign=\"top\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"><tbody><tr><td><img src=\"http://imgs.inkfrog.com/pix/funshop/poewr_06.gif\" width=\"200\" height=\"61\"></td></tr><tr><td background=\"http://www.funinlife.net/web page/shoppingpower/new/poewr_09.gif\" valign=\"top\" height=\"271\"><div style=\"text-align: center;\"></div><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"><tbody><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font0\" valign=\"bottom\" height=\"20\"><font size=\"2\"><span class=\"font1\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Jewelry-Watches_W0QQsacatZ281QQsaselZ573460830\" target=\"_blank\"><font face=\"Times New Roman\">&nbsp;</font><font color=\"#ff6820\">Jewelry &amp; Watches</font></a></span></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Pocket-Watches_W0QQcatrefZC12QQfcdZ2QQsacatZ3937QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">&nbsp;<span class=\"STYLE5\">Pocket Watches</span></font></a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><span class=\"STYLE4\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Wristwatch-Tools-Parts_W0QQcatrefZC12QQfcdZ2QQsacatZ10363QQsaselZ573460830\" target=\"_blank\">&nbsp;<font color=\"#ff6820\">Wristwatch Tools, Parts </font></a></span></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Health-Beauty_W0QQsacatZ26395QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">Health &amp; Beauty</font> </a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Nail-Care-Polish_W0QQsacatZ11871QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">&nbsp;&nbsp;Nail Care &amp; Polish</font> </a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Clothing-Shoes-Accessories_W0QQcatrefZC2QQfcdZ2QQsacatZ11450QQsaselZ573460830\" target=\"_blank\">&nbsp;<font color=\"#ff6820\">Clothing, Shoes &amp; Accessories</font></a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Home-Garden_W0QQcatrefZC2QQfcdZ2QQsacatZ11700QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">&nbsp;Home &amp; Garden</font> </a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font size=\"2\"><font color=\"#ff6820\">&nbsp;</font><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Sporting-Goods_W0QQcatrefZC2QQfcdZ2QQsacatZ382QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">&nbsp;Sporting Goods </font></a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Video-Games_W0QQsacatZ1249QQsaselZ573460830\" target=\"_blank\">&nbsp;<font color=\"#ff6820\">Video Games</font> </a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Computers-Networking_W0QQsacatZ58058QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">Computers &amp; Networking</font> </a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Desktop-Laptop-Accessories_W0QQsacatZ31530QQsaselZ573460830\" target=\"_blank\">&nbsp;<font color=\"#ff6820\">Desktop &amp; Laptop Accessories</font></a></font><font color=\"#ff6820\"> </font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Toys-Hobbies_W0QQcatrefZC2QQfcdZ2QQsacatZ220QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">Toys &amp; Hobbies</font> </a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font color=\"#ff6820\" size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Business-Industrial_W0QQcatrefZC2QQfcdZ2QQsacatZ12576QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">&nbsp;Business &amp; Industrial</font> </a></font></td></tr><tr style=\"color: rgb(255, 153, 54); font-family: Arial;\" align=\"middle\"><td class=\"font1\" valign=\"bottom\" height=\"20\"><font size=\"2\"><a href=\"http://search.stores.ebay.com/General-Merchandise-Shop__Cell-Phones-PDAs_W0QQcatrefZC2QQfcdZ2QQsacatZ15032QQsaselZ573460830\" target=\"_blank\"><font color=\"#ff6820\">&nbsp;Cell Phones &amp; PDAs</font> </a></font></td></tr></tbody></table></td></tr></tbody></table></td><td valign=\"top\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"><tbody><tr><td colspan=\"3\" background=\"http://imgs.inkfrog.com/pix/funshop/poewr_07.gif\" width=\"529\" height=\"59\"><p><strong><font face=\"Arial\" size=\"4\">OHSEN Dual Time Chronograph Alarm Mens Sport Watch Blue</font></strong></p></td></tr><tr><td colspan=\"3\" height=\"31\">&nbsp;</td></tr><tr><td colspan=\"3\" align=\"middle\"><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/24_016.jpg\"></td></tr><tr><td colspan=\"3\" height=\"5\"><br></td></tr><tr><td colspan=\"3\" align=\"middle\"><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/18_053.jpg\"></td></tr><tr><td colspan=\"3\" height=\"5\"><br></td></tr><tr><td colspan=\"3\" align=\"middle\"><p><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/21_034.jpg\"></p><p><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/27_006.jpg\"></p><p><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/_______014.jpg\"></p></td></tr><tr><td colspan=\"3\" height=\"5\"><br></td></tr><tr><td colspan=\"3\" align=\"middle\"><br></td></tr><tr><td colspan=\"3\" height=\"5\"><br></td></tr><tr><td colspan=\"3\" align=\"middle\"><br></td></tr><tr><td colspan=\"3\" height=\"5\"><br></td></tr><tr><td colspan=\"3\" align=\"middle\"><br></td></tr><tr><td colspan=\"3\" height=\"5\"><br></td></tr><tr><td colspan=\"3\" align=\"middle\"><br></td></tr><tr><td colspan=\"3\" height=\"5\"><br></td></tr><tr><td colspan=\"3\" align=\"middle\"><br></td></tr><tr><td class=\"font2\" width=\"509\"><p><font face=\"Arial\"><font size=\"4\"><font size=\"5\"><em><font color=\"#00ff00\"><strong>Main Features:</strong> </font></em><br></font></font><font size=\"2\">1:Brand new,sporty style Watch design<br>2:Day date display function<br>3:Digital analog combination <br>4:Alarm function<br>5:Chronograph display function<br>6:Backlight mode<br>7:Game mode:Random count<br>8:4 buttons for adjusting the time in the easiest way</font></font></p><p><font face=\"Arial\"><font size=\"3\"><font color=\"#ff6820\" face=\"Arial\"><strong>Specification:</strong></font></font></font></p><p><font face=\"Arial\" size=\"2\">Type:digital Watch<br>Case material:Stainless steel<br>Band material:Rubber<br>Case Diameter(cm):4.3cm<br>Case thickness(cm):1.5cm<br>Band color:Black<br>Band length(cm):28.0cm (Case &amp; buckle included)<br>Band width(cm):2.5cm<br>Band Adjustable:buckle</font></p><p><font face=\"Arial\"><font size=\"2\"></font></font></p><p><font face=\"Arial\"><font size=\"2\"></font></font></p><p><font face=\"Arial\"><font size=\"2\"></font></font>&nbsp;</p><p><font face=\"Arial\"><font size=\"2\"></font></font></p><p><font face=\"Arial\" size=\"2\"><strong><font color=\"#00ff00\" size=\"5\"><em>Components Included:<br></em></font></strong>1x Watch<br>1x gift box&nbsp;</font></p><p><font face=\"Arial\" size=\"2\"></font></p><p><font face=\"Arial\" size=\"2\"></font></p><p><font face=\"Arial\" size=\"2\"></font></p></td><td width=\"10\"><br></td></tr><tr><td height=\"30\"><br></td> </tr> </table> <p><font color=\"#0000ff\" style=\"font-size: medium\">?????????????????????????????????</font></p> <p align=\"center\"><strong><font color=\"#00ff00\" size=\"5\"> <span style=\"font-family: Arial\">AK-Homme Mechanical Watches</p> <p> <a target=\"_blank\" href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150428740980&ssPageName=STRK:MESE:IT\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_527563895.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120550375123&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1996083004.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120550375135&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_____003.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120550375143&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0__027.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120586827930&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/1_1128671240.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=400168241730&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/0__159.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150428741013&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/2_530844377.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150428741017&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/2_476459093.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120550375200&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/1_1779836290.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120587609593&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/4_172.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435205784&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/1_1948605725.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435205790&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/9_064.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120581037443&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/2_1152684631.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558868029&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1269987001.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120586348048&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/2__017.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150453441825&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/3_1681444506.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120600797283&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/6__017.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120587299390&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/17__008.jpg\" width=\"105\" border=\"0\" alt=\"\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120581037505&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/3__048.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150453441867&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/12__014.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150453441912&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/18__004.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150459441123&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/4__025.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150472257778&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/4_218.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120581037585&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/3_574819930.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150472257761&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/0_1145619677.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <strong><font color=\"#00ff00\" size=\"5\"> <span style=\"font-family: Arial\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120605139942&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/4_232.jpg\" width=\"105\" border=\"0\" /></a></span></font></strong><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150476212317&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/7_127.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150476212776&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/7_129.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120605139919&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/0_253150533.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150476275806&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/19_040.jpg\" width=\"105\" border=\"0\" /></a></p> <p align=\"center\"><strong><font color=\"#00ff00\" size=\"5\"> <span style=\"font-family: Arial\">Pocket Watches</p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120586880000&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/7_093.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150458992816&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/5_147.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120586879824&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/3_254517032.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120586880021&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/3_1577213328.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120586879853&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/6_100.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120586879958&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/4_193.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120586879932&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/3_476919064.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150476280667&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/6__004.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120605155365&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/3_1761867875.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230400&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/6_089.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120605178757&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/3_755635937.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231235&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/7_084.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899465&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/00_007.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150512813828&ssPageName=STRK:MESE:IT\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/13_140.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231288&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/2_1693339989.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899975&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/10_047.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=400168236008&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/9_146.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231325&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1500269444.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120605523745&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/1_1853642367.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120540879763&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/8_069.jpg\" width=\"105\" border=\"0\" /></a></p> <p> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899124&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/11_036.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231134&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1215692651.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150476288878&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1481646460.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231269&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/funshop/AA_016.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231141&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_2095629423.jpg\" width=\"105\" border=\"0\" /></a></p> <p align=\"center\"><strong><font color=\"#00ff00\" size=\"5\"> <span style=\"font-family: Arial\">Wrist Watches</p> <p><strong><font color=\"#00ff00\" size=\"5\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231003&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0__031.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899692&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/funshop/AAA_017.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231073&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1088286629.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230737&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1933481711.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899149&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_669461227.jpg\" width=\"105\" border=\"0\" /></a></p> <p><strong><font color=\"#00ff00\" size=\"5\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899229&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_807096997.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150453442023&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/35_002.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231099&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1622664874.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120581037790&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/8_074.jpg\" width=\"105\" border=\"0\" /></a><a href=\"Decoration%20Crystal%20Dial%20Leopard%20Women%20Quartz%20Watch%20New\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_710995206.jpg\" width=\"105\" border=\"0\" /></a></p> <p><strong><font color=\"#00ff00\" size=\"5\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&item=120605525899\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/27_005.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230596&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1358420607.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899147&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_262305056.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435231222&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/funshop/AA_049.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150453441980&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/33_.jpg\" width=\"105\" border=\"0\" /></a></p> <p><strong><font color=\"#00ff00\" size=\"5\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899413&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0__032.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230620&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1939558053.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150476624039&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/4_212.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150453442066&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/5_139.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230569&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_2094335318.jpg\" width=\"105\" border=\"0\" /></a></p> <p><strong><font color=\"#00ff00\" size=\"5\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899288&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1216545924.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899823&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/funshop/AA_047.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899834&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/funshop/AA_046.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899492&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_105146829.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120587299477&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/43.jpg\" width=\"105\" border=\"0\" /></a></p> <p align=\"center\"><strong><font color=\"#00ff00\" size=\"5\"> <span style=\"font-family: Arial\">Watch Tools</p> <p><strong><font color=\"#00ff00\" size=\"5\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&item=150435230223\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/0___086.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&item=120604605363\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/5_134.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&item=150435230276\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/1_562221247.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230253&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/0_459248153.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230380&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/12_038.jpg\" width=\"105\" border=\"0\" /></a></p> <p><strong><font color=\"#00ff00\" size=\"5\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230987&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0__033.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899961&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0__034.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899970&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_1519067627.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230963&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/DSC_7341-1.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&item=120558899482\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/0______010.jpg\" width=\"105\" border=\"0\" /></a></span></font></strong></p> <p><strong><font color=\"#00ff00\" size=\"5\"> <a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230318&ssPageName=STRK:MESE:IT\" target=\"_blank\"> <img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/1_1234796598.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230246&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/0_466041294.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=150435230359&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/5_129.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899014&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/7_096.jpg\" width=\"105\" border=\"0\" /></a><a href=\"http://cgi.ebay.co.uk/ws/eBayISAPI.dll?ViewItem&rd=1&item=120558899025&ssPageName=STRK:MESE:IT\" target=\"_blank\"><img height=\"105\" hspace=\"0\" src=\"http://imgs.inkfrog.com/pix/rachelguo/2_710047892.jpg\" width=\"105\" border=\"0\" /></a></p> </td><td bgcolor=\"#f2f2f2\" valign=\"top\"><table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"><tbody><tr><td align=\"right\" background=\"http://imgs.inkfrog.com/pix/funshop/poewr_08.gif\" width=\"221\" height=\"61\"><strong><font face=\"Arial\" size=\"3\">Code NO:W1130</font></strong>&nbsp;&nbsp;&nbsp;&nbsp;</td></tr><tr><td><img src=\"http://imgs.inkfrog.com/pix/funshop/poewr_11.gif\" width=\"221\" height=\"33\"></td></tr><tr><td><a href=\"http://stores.ebay.com/General-Merchandise-Shop_Health-Beauty_W0QQcolZ4QQdirZ1QQfsubZ19116308QQftidZ2QQtZkm\" target=\"_blank\"><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/B040_004.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td><a href=\"http://stores.ebay.com/General-Merchandise-Shop_Sporting-Goods_W0QQcolZ4QQdirZ1QQfsubZ19116307QQftidZ2QQtZkm\" target=\"_blank\"><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/F032_002.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td><a href=\"http://stores.ebay.com/General-Merchandise-Shop_Computers-Networking_W0QQcolZ4QQdirZ1QQfsubZ16762823QQftidZ2QQtZkm\" target=\"_blank\"><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/H1042.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td height=\"5\"><a href=\"http://stores.ebay.com/General-Merchandise-Shop_Home-Garden_W0QQcolZ4QQdirZ1QQfsubZ19116310QQftidZ2QQtZkm\" target=\"_blank\"><img alt=\"a\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/H687_002.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td><a href=\"http://stores.ebay.co.uk/General-Merchandise-Shop_Belt-Buckle-Men-Accessories_W0QQ_fsubZ16763853QQ_sidZ573460830QQ_trksidZp4634Q2ec0Q2em322\" target=\"_blank\"><img alt=\"2\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/L020.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td><a href=\"http://stores.ebay.com/General-Merchandise-Shop_Jewelry-Watches-Lady-Watch_W0QQcolZ4QQdirZ1QQfsubZ20266027QQftidZ2QQtZkm\" target=\"_blank\"><img alt=\"2\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/W600.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td><a href=\"http://stores.ebay.co.uk/General-Merchandise-Shop_Mechanical-Watch_W0QQ_fsubZ106925010QQ_sidZ573460830QQ_trksidZp4634Q2ec0Q2em322\" target=\"_blank\"><img alt=\"2\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/AK-W048.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td><a href=\"http://stores.ebay.com/General-Merchandise-Shop_Jewelry-Watches-Pocket-Watch_W0QQcolZ4QQdirZ1QQfsubZ20266029QQftidZ2QQtZkm\" target=\"_blank\"><img alt=\"2\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/W940.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td><a href=\"http://stores.ebay.co.uk/General-Merchandise-Shop_Jewelry-Watches-Men-Watch_W0QQ_fsubZ20266026QQ_sidZ573460830QQ_trksidZp4634Q2ec0Q2em14?_trksid=p4634.c0.m14.l1513&_pgn=1\" target=\"_blank\"><img alt=\"2\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/W782.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr><tr><td height=\"5\"><br></td></tr><tr><td><a href=\"http://stores.ebay.co.uk/General-Merchandise-Shop_Tool-Battery-Adaptor_W0QQ_fsubZ1029570010QQ_sidZ573460830QQ_trksidZp4634Q2ec0Q2em322\" target=\"_blank\"><img alt=\"2\" src=\"http://imgs.inkfrog.com/pix/innoinkforgy/W318_001.jpg\" border=\"0\" width=\"193\" height=\"124\"></a></td></tr></tbody></table></td></tr></tbody></table><table align=\"center\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"950\"><tbody><tr><td colspan=\"2\" background=\"http://www.funinlife.net/web page/shoppingpower/new/poewr_03.gif\" height=\"30\"><br></td></tr><tr><td colspan=\"3\" height=\"10\"><br></td></tr><tr><td class=\"font2\" valign=\"top\"><div><a name=\"1\"></a><font color=\"#ff6600\" face=\"Arial\" size=\"2\">Payment Method</font></div><li><font face=\"Arial\" size=\"2\">We accepted <font color=\"#339900\">ONLY PayPal</font> payment. We apologize that we cannot accept other payment methods, such as cheque or postal orders. If you don't have Paypal account, please sign up and learn more about paypal at www.paypal.com. Payment must be fulfilled within 7 days since auction's ending. All no_pay bidders will result in a non-paying buyer alert from Ebay and negative feedback from seller. </font></li><li><font face=\"Arial\" size=\"2\">E-checks will be held until cleared. </font></li></td><td width=\"40\"><font face=\"Arial\"><br><font size=\"2\"></font></font></td></tr><tr><td colspan=\"3\" height=\"20\"><font face=\"Arial\"><br><font size=\"2\"></font></font></td></tr><tr><td class=\"font2\"><div><a name=\"2\"></a><font face=\"Arial\"><font size=\"2\"><font color=\"#ff6600\">Shipping &amp; Handling </font><img src=\"http://imgs.inkfrog.com/pix/innoinkforgy/DHL_2.jpg\">&nbsp;<img src=\"http://imgs.inkfrog.com/pix/funshop/hkpost.gif\" width=\"85\" height=\"38\"></font></font></div><li><font face=\"Arial\" size=\"2\">No shipping discount for combined orders and no pickup service. Please make sure that you agree with our terms before bidding. We will ship your order within 24 hours after receiving your verified payment (Excluding Weekends and Public Holidays) We will ship to the following countries: United Kingdom, Ireland, Germany, France, Switzerland, Austria, United States, Canada, Australia and New Zealand.No shipping to Italy, Malta,Brazil. Other countries please contact us first. Orders will be shipped via airmail, air parcel or other services depending on situations. Delivery time lasts approx.<br></font><font color=\"#339900\" face=\"Arial\" size=\"2\">A) United States: 14-21 business days<br>B) United Kingdom: 10-18 business days<br>C) Spain, France, Germany: 10-25 business days. <br>D) Other countries: not more than 30 business days </font></li></td><td><font face=\"Arial\"><br><font size=\"2\"></font></font></td></tr><tr><td colspan=\"3\" height=\"20\"><font face=\"Arial\"><br><font size=\"2\"></font></font></td></tr><tr><td class=\"font2\"><div><a name=\"3\"></a><font face=\"Arial\"><font size=\"2\"><font color=\"#ff6600\">Refund &amp; Return Policies</font><img src=\"http://imgs.inkfrog.com/pix/funshop/warranty.jpg\" width=\"200\" height=\"110\"></font></font></div><li><font face=\"Arial\" size=\"2\">All sales come with us <font color=\"#339900\">90-day warranty.</font> Return items must not be used or have any sign of abuse or intentional damage. Buyer is responsible for all return shipping charges. </font></li><li><font face=\"Arial\" size=\"2\">We reserve the right not to refund S&amp;H when the item has been posted. </font></li></td><td><font face=\"Arial\"><br><font size=\"2\"></font></font></td></tr><tr><td colspan=\"3\" height=\"20\"><font face=\"Arial\"><br><font size=\"2\"></font></font></td></tr><tr><td class=\"font2\"><div><a name=\"4\"></a><font color=\"#ff6600\" face=\"Arial\" size=\"2\">Customer Service Policy </font></div><font face=\"Arial\"><font size=\"2\"><font class=\"font9\">1.Customer Service Work Flow</font> </font></font></td><td><font face=\"Arial\"><br><font size=\"2\"></font></font></td></tr><tr><td colspan=\"3\" height=\"10\"><font face=\"Arial\" size=\"2\"><img src=\"http://imgs.inkfrog.com/pix/funshop/26_002.jpg\" width=\"586\" height=\"340\"></font></td></tr><tr><td colspan=\"3\" height=\"10\"><font class=\"font9\" face=\"Arial\" size=\"2\">2.Customer Service Work Time:</font></td></tr><tr><td colspan=\"3\" height=\"45\"><font class=\"font10\"><li><font face=\"Arial\" size=\"2\">If you have any questions,Please contact with us<font color=\"#f25f25\"> via eBay message or our customer service e-mail .</font> please be advised that e-mails will be replied by our customer services officers Mon. - Fri. 11:00 - 20:00 and Saturdays 11:00 � 15:00(Excluding Weekends and Public Holidays) </font></li><li><font face=\"Arial\" size=\"2\">You may expect to receive a response to your inquiry within 24 hours. (Excluding Weekends and Public Holidays)</font></li></font></td></tr><tr><td colspan=\"3\" height=\"10\"><font class=\"font9\" face=\"Arial\" size=\"2\">3.Feedback Policy</font></td></tr><tr><td colspan=\"3\" height=\"10\"><font class=\"font10\"><font color=\"#f25f25\"><li><font face=\"Arial\" size=\"2\">We will leave positive feedback to buyer as soon as buyer pays for the item&nbsp; </font></li></font><font face=\"Arial\"><font size=\"2\">Leaving Negative feedback or Netural Feedback is never a good way to resolve problem .<font color=\"#f25f25\">We hightly appreciate that you can contact with us before you leaving Negative feedback or Neutral feedback .We will offer help to resolve your problems as fast as possible</font></font></font></font></td></tr><tr><td colspan=\"3\">&nbsp;</td></tr></tbody></table><map name=\"Map\"><area shape=\"RECT\" coords=\"472,10,595,52\" href=\"#3\"><area shape=\"RECT\" coords=\"334,10,457,52\" href=\"#3\"><area shape=\"RECT\" coords=\"192,10,315,52\" href=\"#2\"><area shape=\"RECT\" coords=\"11,5,181,52\" href=\"#1\"></map><p style=\"font-size: 14px; margin: 10px; font-family: arial; text-align: center;\" align=\"center\"><img alt=\"inkFrog Inc. - Affordable Auction Management Solutions. Visit us at http://www.inkfrog.com\" src=\"http://img.inkfrog.com/banners/frog_banner.gif\" border=\"0\" width=\"88\" height=\"33\"><br><a style=\"color: rgb(0, 51, 102);\" href=\"http://www.inkfrog.com/?referer=62363\" target=\"_blank\"><font size=\"2\">Affordable Auction Management and Image Hosting Solutions @ inkFrog</font></a></p><div style=\"display: none;\">&nbsp;</div><!--eof InkFrogGalleryShowcaseFlash--><p></p><p></p><hr><p></p><center><a href=\"http://pages.ebay.co.uk/selling_manager_pro\"><img src=\"http://pics.ebay.com/aw/pics/uk/sellingmanager/sellingmanagerPro/smPro_248x50.gif\" border=\"0\" width=\"248\" height=\"50\"></a></center><p></p><center><img src=\"http://pics.ebay.com/aw/pics/sell/templates/images/k2/tagline.gif\" border=\"0\"><br><font face=\"Arial,Helvetica\" size=\"2\">Powered by <a href=\"http://pages.ebay.com/turbo_lister/\">eBay Turbo Lister</a></font></center>","source":"E_BAY","location":"HKG","category":"SGJE","latitude":22.2855,"longitude":114.158,"price":0.99,"currency":null,"image":["url","http://thumbs1.ebaystatic.com/pict/1505272809088080_1.jpg"],"externalUrl":"http://cgi.ebay.com/OHSEN-Dual-Time-Chronograph-Alarm-Mens-Sport-Watch-Blue-/150527280908?pt=UK_Jewelery_Watches_Watches_MensWatches_GL","userID":"shopping.power2","timestamp":"20101130232514","annotations":"{\"post\":{\"tags\":[\"#eBay\",\"#forsale\",\"#jewelry\",\"#HKG\"],\"ship_to_locations\":{\"0\":\"Worldwide\"}}}","trustedAnnotations":"{\"post\":{\"tags\":[\"#eBay\",\"#forsale\",\"#jewelry\",\"#HKG\"],\"ship_to_locations\":{\"0\":\"Worldwide\"}}}","externalId":"150527280908","postKey":"X7J67W","id":496269986,"trusted":null,"accountName":"shopping.power2","clickCount":null,"accountId":null,"expiration":null,"comments":[]}
	 
	 * @example
	 * threeTapsPostingClient.get('X7J67W', callback);
	 */
	get: function(postID, callback) {
		return this.client.request(this.path, 'get/' + postID, null, null, function(results) {
			callback(results);
		});
	},
	
	/**
	 * @public
	 
	 * @restStructure POST /posting/post

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
	 
	 * @example
	 * [[1,"X73XFN"],[1,"X73XFP"]]
	 
	 * @example
	 * var posting1 = {
	 * 	source: 'E_BAY',
	 * 	category: 'SGBI',
	 * 	heading: 'Test Post 1 in Bicycles For Sale Category',
	 * 	body: 'This is a test post. One.',
	 * 	price: 1.00,
	 * 	currency: 'USD',
	 * 	url: 'http://www.ebay.com'
	 * };
	 * var posting2 = {
	 * 	source: 'E_BAY',
	 * 	category: 'SGBI',
	 * 	heading: 'Test Post 2 in Bicycles For Sale Category',
	 * 	body: 'This is a test post. Two.',
	 * 	price: 2.00,
	 * 	currency: 'USD',
	 * 	url: 'http://www.ebay.com'
	 * };
	 * var fieldList = ['source', 'category', 'heading', 'body', 'price', 'currency', 'url'];
	 * var posting1Array = [posting1.source, posting1.category, posting1.heading, posting1.body, posting1.price, posting1.currency, posting1.url];
	 * var posting2Array = [posting2.source, posting2.category, posting2.heading, posting2.body, posting2.price, posting2.currency, posting2.url];
	 * var postings = [posting1Array, posting2Array];
	 * var data = [fieldList, postings];
	 * threeTapsPostingClient.post(JSON.stringify(data), callback);
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
	 
	 * @restStructure POST /posting/update

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
	 
	 * @exampleFuture
	 * ['future']
	 
	 * @exampleFuture
	 * var posting1 = ['X73XFN', {price: 10.00}];
	 * var posting2 = ['X73XFP', {price: 20.00}];
	 * var data = [posting1, posting2];
	 * threeTapsPostingClient.update(JSON.stringify(data), callback);
	 */
	update: function(data, callback) {
		var params = {
			agentID: this.client.agentId
			,authID: this.client.authId
			,data: data
		};
		return this.client.request(this.path, 'update', null, params, function(results) {
			callback(results);
		});
	}
};

threeTapsClient.register('posting', threeTapsPostingClient);

/**
 * @class The 3taps Notifier constantly monitors all incoming postings, and sends out notifications via email or Twitter as postings that match certain criteria are received.  External users and systems are able to send a request to the Notification API to have notifications sent out to a given destination for all postings that meet a given set of criteria.  These notifications will continue to be sent out until the request is explicitly cancelled or the request expires, usually after a period of seven days.
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
	path: '/notifications/',

	/**
	 * @public
	 
	 * @restStructure POST /notifications/firehose

	 * @desc Creates an XMPP firehose.  A variant of create().

	 * @param {String} text The text postings need to be sent to this firehose
   * @param {String} src The source code postings need to be sent to this firehose
   * @param {String} loc The location code postings need to be sent to this firehose
   * @param {String} cat The category code postings need to be sent to this firehose

	 * @return {String} A JSON encoded object with the following fields:
	 *
	 * <table>
	 *	<tr>
	 *		<td>success</td>
	 *		<td>true/false depending on if the subscription was successfully deleted.</td>
	 *	</tr>
	 *	<tr>
	 *		<td>jid</td>
	 *		<td>The XMPP jid of the newly created firehose.</td>
	 *	</tr>
	 *	<tr>
	 *		<td>username</td>
	 *		<td>The username of the jid account of the newly created firehose.</td>
	 *	</tr>
	 *	<tr>
	 *		<td>password</td>
	 *		<td>The password of the jid account of the newly created firehose.</td>
	 *	</tr>
	 *	<tr>
	 *		<td>id</td>
	 *		<td>The id of the subscription associated with the firehose (to be used with delete())</td>
	 *	</tr>
	 *	<tr>
	 *		<td>secret</td>
	 *		<td>The secret key to use when deleting this firehose (to be used with delete())</td>
	 *	</tr>
	 *	<tr>
	 *		<td>error</td>
	 *		<td>If the firehose could not be created, error will be a JSON encoded object with two fields: code, and message.</td>
	 *	</tr>
	 * </table>
	 
	 * @example
	 * {"success":true, "jid":"honda-vaut-lax@firehose.3taps.net"}
	 
	 * @example
	 * var params = {
	 *	text: "honda",
	 *	cat: "VAUT",
	 *	loc: "LAX"
	 * }
	 * threeTapsNotificationsClient.firehose(firehose, callback);
	 */
	firehose: function(params, callback) {
    return this.client.request(this.path, 'firehose', null, params, function(results) {
      callback(results);
    });
  },

	/**
	 * @public
	 * @function
   * @name delete
   * @memberOf threeTapsNotificationsClient
	 
	 * @restStructure POST /notifications/delete

	 * @desc Cancel a notification subscription.

	 * @param {String} secret The secret key that was returned to you when you created the notification subscription.  You kept it, right?
	 * @param {String} id The id of the notification subscription to delete.

	 * @return {String} A JSON encoded object with the following fields:
	 *
	 * <table>
	 *	<tr>
	 *		<td>success</td>
	 *		<td>true/false depending on if the subscription was successfully deleted.</td>
	 *	</tr>
	 *	<tr>
	 *		<td>error</td>
	 *		<td>If the delete was unsuccessful, error will contain a JSON encoded object with two fields: code, and message.</td>
	 *	</tr>
	 * </table>
	 
	 * @example
	 * {"success":true}
	 
	 * @example
	 * var params = {
	 *	id: 1873,
	 *	secret: "201d7288b4c18a679e48b31c72c30ded"
	 * }
	 * threeTapsNotificationsClient.delete(params, callback);
	 */
	'delete': function(params, callback) {
    return this.client.request(this.path, 'delete', null, params, function(results) {
      callback(results);
    });
  },


	/**
	 * @public
	 * @function
   * @name get
   * @memberOf threeTapsNotificationsClient
	 
	 * @restStructure GET /notifications/get

	 * @desc Get information about a notification subscription.

	 * @param {String} secret The secret key that was returned to you when you created the notification subscription.  You kept it, right?
	 * @param {String} id The id of the notification subscription to retrieve information for.

	 * @return {String} A JSON encoded object with the following fields:
	 *
	 * <table>
	 *  <tr>
	 *		<td>subscription</td>
	 *		<td>a JSON representation of the notification subscription.</td>
	 *	</tr>
	 *	<tr>
	 *		<td>error</td>
	 *		<td>If the delete was unsuccessful, error will contain a JSON encoded object with two fields: code, and message.</td>
	 *	</tr>
	 * </table>
	 
	 * @example
	 * {"subscription":{"expiration":"2010-12-25 10:44:45 UTC"}}
	 
	 * @example
	 * var params = {
	 *	id: 1873,
	 *	secret: "201d7288b4c18a679e48b31c72c30ded"
	 * }
	 * threeTapsNotificationsClient.get(params, callback);
	 */
	'get': function(params, callback) {
    return this.client.request(this.path, 'get', null, params, function(results) {
      callback(results);
    });
  },

	/**
	 * @public
	 
	 * @restStructure GET /notifications/create

	 * @desc Ask the notifier to start sending out notifications by creating a new "subscription".
   *
   * Subscriptions need one delivery param (email, jid, token) and at least one filter (text, source, cat, loc)
   
   * @param {String} text If set, postings with this text in the body, header, or annotations will qualify for notification.
   * @param {String} src If set, postings with this source will qualify for notification.  This value should be a 5-letter source code (ex: E_BAY, CRAIG).
   * @param {String} loc If set, postings with this location will qualify for notification.  This value should be a 3-letter source code (ex: LAX, NYC).
   * @param {String} cat If set, postings with this location will qualify for notification.  This value should be a 4-letter category code (ex: VAUT, JOBS)
   * @param {Integer} expiration The number of days to keep this subscription around for (default 7 days)
   * @param {String} format defines how the notifications should be formatted.  The following formats are currently supported:
	 *
	 *             <table>
	 *                 <tr>
	 *                     <td>brief</td>
	 *                     <td>This format is intended for short, human-readable messages such as watching notifications on a chat client or getting a push notification to a mobile phone.  The notification has two lines for each post included in the batch: the heading, followed by a line break and the URL used to access the post within the 3taps system.  If multiple posts are batched together, there will be two line breaks between each post.</td>
	 *                 </tr>
	 *                 <tr>
	 *                     <td>full
	 *                         extended</td>
	 *                      <td>These two formats are intended for sending notifications to external systems for further use.  The data is sent as a JSON-encoded array with two entries: [fieldList, postings], where fieldList is an array of field names, and postings is an array of postings, where each posting is itself an array of field values, in the same order as the fieldList list.
	 * 
	 *                          For the full format, the following fields will be included:
	 * 
	 *                          postKey
	 *                          source
	 *                          category
	 *                          location
	 *                          heading
	 *                          body
	 *                          workspaceURL
	 *                          created
	 * 
	 *                          The extended format includes all the fields from the full format, plus:
	 * 
	 *                          externalURL
	 *                          externalID
	 *                          trustedAnnotations
	 *                          latitude
	 *                          longitude
	 *                          price
	 *                          currency
	 *                          language</td>
	 *                  </tr>
	 *                  <tr>
	 *                      <td>html</td>
	 *                      <td>This format is intended for human-readable notifications such as emails.  The following information is presented in HTML format:
	 * 
	 *                          postKey
	 *                          source
	 *                          category
	 *                          location
	 *                          heading
	 *                          body
	 *                          workspaceURL
	 *                          created</td>
	 *                  </tr>
	 *                  <tr>
	 *                      <td>text140</td>
	 *                      <td>This format is intended to send notifications to Twitter; a minimal set of fields are included, and limited to 140 characters so that the notification can be sent out as a Twitter status update.</td>
	 *                  </tr>
	 *              </table>
   * @param {String} email The email address to send this notification to.
   * @param {String} jid The XMPP JID to send this notification to.
   * @param {String} token The iPhone Device Token to send this notification to. (Note that you should only supply one of email, jid, or token.)    
	 
	 * @example
	 * {"success":true,"id":"1840","secret":"201d7288b4c18a679e48b31c72c30ded"}
	 
	 * @example
	 * var params = {
	 * 	text: 'red',
	 * 	loc: 'LAX',
	 * 	src: 'CRAIG',
	 * 	email: 'dfoley@3taps.com'
	 * };
	 * threeTapsNotificationsClient.create(params, callback);

	 * @return {String} The body of the response should consist of a JSON-encoded array with the following values.
	 *	<table>
	 *		<tr>
	 *			<td>success</td>
	 *			<td>true or false, depending on if the notification subscription was successfully created.</td>
	 *		</tr>
	 *		<tr>
	 *			<td>id</td>
	 *			<td>The id of the newly created subscription. This field is only returned on success.</td>
	 *		</tr>
	 *		<tr>
	 *			<td>secret</td>
	 *			<td>The secret pass for the newly created subscription, required for deleting subscriptions.  This field is only returned on success.</td>
	 *		</tr>
	 *		<tr>
	 *			<td>error</td>
	 *			<td>If there was a problem with the API request, the error message will be included here as a JSON object with two fields: code, and message.  This field is only returned on failure.</td>
	 *		</tr>
	 *	</table>
	 * */
	create: function(params, callback) {
		return this.client.request(this.path, 'create', null, params, function(results) {
			callback(results);
		});
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
	 
	 * @restStructure GET /search/new?[param]=[value]&[param2]=[value2]...
	 * @restUrlExample http://3taps.net/search/new?src=E_BAY&loc=LAX

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
	 * @param {String} extID A string which must match the "externalID" field for a posting if it is to be included in the list of search results.
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
	 
	 * @example
	 * [1,17675,[["SCCA","LAX","CRAIG","07 Porsche 911 Carrera Coupe 1 OWNER 19\" SPORT WHEELS (Stk# UP771027 - $54997 ","http://losangeles.craigslist.org/sfv/ctd/2078395677.html","20101124232600",null],["SCCA","LAX","CRAIG","09 Porsche Boxster Rdstr ULTRA LOW MILES 310 HP 27MPG! (Stk# UP971046 - $53555 ","http://losangeles.craigslist.org/sfv/ctd/2078394060.html","20101124232400",null],["SCCA","LAX","CRAIG","PORSCHE 911 ","http://losangeles.craigslist.org/sfv/cto/2078392578.html","20101124232300",null],["SCCA","LAX","CRAIG","2010 Porsche 911 Turbo Cabriolet 595 MILES 19\" CNTRLCKS (Stk# UPA77310 - $164997 ","http://losangeles.craigslist.org/sfv/ctd/2078392989.html","20101124232300",null],["SCCA","SEA","CRAIG","1993 Porsche Carrera Cabriolet - $29500 ","http://seattle.craigslist.org/see/cto/2078382166.html","20101124231400",null],["SCCA","SEA","CRAIG","2007 Porsche Cayman S - $42991 ","http://seattle.craigslist.org/est/ctd/2078382307.html","20101124231400",null],["SCCA","SAN","CRAIG","09 PORSCHE 911 WHITE - $77980 ","http://sandiego.craigslist.org/nsd/ctd/2078372848.html","20101124230700",null],["SCCA","SLC","CRAIG","2005 Porsche Cayenne Sport Utility S","http://saltlakecity.craigslist.org/ctd/2078371818.html","20101124230600",null],["SCCA","MIA","CRAIG","1997 Porsche Boxster Conv. \"MUST SEE\"!!!! - $11900 ","http://miami.craigslist.org/pbc/cto/2078365002.html","20101124230000",null],["SCCA","SAN","CRAIG","2010 PORSCHE PANAMERA S/4S 10893 MILES - $100980 ","http://sandiego.craigslist.org/nsd/ctd/2078358350.html","20101124225500",null],["SCCA","ATL","CRAIG","2000 Porsche 911 C4 - $31000 ","http://atlanta.craigslist.org/nat/cto/2078357440.html","20101124225400",null],["SCCA","PHX","CRAIG","2008 Porsche 911 Coupe Carrera Coupe - $61900","http://phoenix.craigslist.org/nph/ctd/2078354266.html","20101124225200",null],["SCCA","TUS","CRAIG","2008 Porsche Cayman Coupe S Coupe (only 15528 miles) - $51900 ","http://tucson.craigslist.org/ctd/2078351081.html","20101124224900",null],["SGTO","GBR","E_BAY","Scalextric - Orange / Black Porsche GT3RS (DPR) -NrMint","http://cgi.ebay.com/Scalextric-Orange-Black-Porsche-GT3RS-DPR-NrMint-/290504367158?pt=Slot_Cars","20101124224740",null],["SCCA","CHI","CRAIG","1986 Porsche 944 Turbo - $9000 ","http://chicago.craigslist.org/wcl/ctd/2078346406.html","20101124224600",null],["SGTO","SCE","E_BAY","PORSCHE 911 Carrera 1997 - 1/24 Maisto -New!","http://cgi.ebay.com/PORSCHE-911-Carrera-1997-1-24-Maisto-New-/120651783406?pt=Diecast_Vehicles","20101124224522",null],["SGCO","FIN","E_BAY","Finland: Porsche Boxster, Unused, Rare","http://cgi.ebay.com/Finland-Porsche-Boxster-Unused-Rare-/270669282126?pt=LH_DefaultDomain_0","20101124224319",null],["SCCA","CTZ","CRAIG","'87 Porsche 944 Midnight Blue - $4000 ","http://newlondon.craigslist.org/cto/2078340470.html","20101124224100",null],["SGBO","GBR","E_BAY","Porsche Raritäten: Autos, Die Nie In Serie Gingen Aiche","http://cgi.ebay.com/Porsche-Raritaten-Autos-Die-Nie-Serie-Gingen-Aiche-/220701548669?pt=AU_Non_Fiction_Books_2","20101124224036",null],["SGTO","GBR","E_BAY","Scalextric -Orange / Silver Porsche GT3RS (DPR)- NrMint","http://cgi.ebay.com/Scalextric-Orange-Silver-Porsche-GT3RS-DPR-NrMint-/290504364952?pt=Slot_Cars","20101124224024",null],["SCPA","NHZ","EBAYM","Porsche 944 Turbo – Ground Wire Strap ($$ SAVE $$)","http://cgi.ebay.com/Porsche-944-Turbo-Ground-Wire-Strap-SAVE-/300496916600?pt=Motors_Car_Truck_Parts_Accessories","20101124224020",null],["SCPA","NHZ","EBAYM","Porsche 944 Turbo – Brake Duct (Driver) ($$ SAVE $$)","http://cgi.ebay.com/Porsche-944-Turbo-Brake-Duct-Driver-SAVE-/300496916350?pt=Motors_Car_Truck_Parts_Accessories","20101124224006",null],["SCPA","NHZ","EBAYM","Porsche 944 Turbo – Air Duct","http://cgi.ebay.com/Porsche-944-Turbo-Air-Duct-/300496916296?pt=Motors_Car_Truck_Parts_Accessories","20101124223952",null],["SGTO","NHZ","E_BAY","Porsche Diecast 1/34 – Cayman S","http://cgi.ebay.com/Porsche-Diecast-1-34-Cayman-S-/300496916208?pt=Diecast_Vehicles","20101124223930",null],["SCPA","LAX","EBAYM","1997-2004 Porsche 986 Boxster S 2.5 2.7 3.2 m2 Header","http://cgi.ebay.com/1997-2004-Porsche-986-Boxster-S-2-5-2-7-3-2-m2-Header-/130458543943?pt=Motors_Car_Truck_Parts_Accessories","20101124223921",null],["SCPA","BHM","EBAYM","82 90 Porsche 944 AC compressor adjuster rod","http://cgi.ebay.com/82-90-Porsche-944-AC-compressor-adjuster-rod-/170570677324?pt=Motors_Car_Truck_Parts_Accessories","20101124223901",null],["SCCA","VAZ","CRAIG","1986 PORSCHE 944 VERY CLEAN RUNS 100% - $3799 ","http://norfolk.craigslist.org/cto/2078337850.html","20101124223900",null],["SCPA","NJZ","CRAIG","Porsche 911 Rims and Tires - $400 ","http://cnj.craigslist.org/pts/2059960574.html","20101124223900",null],["SCPA","PDX","EBAYM","Porsche 986 996 911 Seal Grey Touch Up Paint 6b5 Gray","http://cgi.ebay.com/Porsche-986-996-911-Seal-Grey-Touch-Up-Paint-6b5-Gray-/320621942275?pt=Motors_Car_Truck_Parts_Accessories","20101124223854",null],["SGTO","NHZ","E_BAY","Porsche Diecast 1/34 – Cayman S","http://cgi.ebay.com/Porsche-Diecast-1-34-Cayman-S-/300496916084?pt=Diecast_Vehicles","20101124223849",null],["SCPA","CHI","EBAYM","Porsche 911 turbo Carrera 2/4 left turn signal assembly","http://cgi.ebay.com/Porsche-911-turbo-Carrera-2-4-left-turn-signal-assembly-/140482504795?pt=Motors_Car_Truck_Parts_Accessories","20101124223841",null],["SCPA","CHI","EBAYM","Porsche 911 fiberglass door trim","http://cgi.ebay.com/Porsche-911-fiberglass-door-trim-/130458543800?pt=Motors_Car_Truck_Parts_Accessories","20101124223840",null],["SCPA","LAS","EBAYM","22 \" Porsche Cayenne Wheels rims Audi Q7 2010 2011","http://cgi.ebay.com/22-Porsche-Cayenne-Wheels-rims-Audi-Q7-2010-2011-/270669280627?pt=Motors_Car_Truck_Parts_Accessories","20101124223827",null],["SCPA","DFW","EBAYM","UP FIXIN DER PORSCHE VOL VIII 8 1987-1989 repair manul","http://cgi.ebay.com/UP-FIXIN-DER-PORSCHE-VOL-VIII-8-1987-1989-repair-manul-/380292592042?pt=Motors_Manuals_Literature","20101124223813",null],["SCCA","PSF","CRAIG","1979 Porsche Targa *Priced to sell* - $12000 ","http://westernmass.craigslist.org/ctd/2078336380.html","20101124223800",null],["SCPA","NJZ","CRAIG","Porsche 911 Rims and Snow Tires - $250 ","http://cnj.craigslist.org/pts/2059977480.html","20101124223800",null],["SCPA","LAX","EBAYM","Porsche 911 Original Plastic Inside Door Handle","http://cgi.ebay.com/Porsche-911-Original-Plastic-Inside-Door-Handle-/150524622549?pt=Vintage_Car_Truck_Parts_Accessories","20101124223758",null],["SCCA","DOV","EBAYM","Porsche : 944 **LOW MILES**UNIQUE**ONE-OF-A-KIND**","http://cgi.ebay.com/Porsche-944-/250732081672?pt=US_Cars_Trucks","20101124223701",null],["SCPA","BHM","EBAYM","77 90 Porsche 944 911 allloy lug nuts OEM","http://cgi.ebay.com/77-90-Porsche-944-911-allloy-lug-nuts-OEM-/170570676667?pt=Motors_Car_Truck_Parts_Accessories","20101124223638",null],["SCCA","PDX","EBAYM","Porsche : 911 Race Car GT3 Cup Race Car GT2 SCCA NASA","http://cgi.ebay.com/Porsche-911-/270669195262?pt=US_Cars_Trucks","20101124223630",null],["SCCA","SFO","CRAIG","1973 Porsche 911T Targa - $5000 ","http://sfbay.craigslist.org/eby/cto/2078331739.html","20101124223600",null],["EBAY","GBR","E_BAY","PORSCHE 356B COUPE 1961 by BURAGO 1:18 BOXED","http://cgi.ebay.com/PORSCHE-356B-COUPE-1961-BURAGO-1-18-BOXED-/140482504005?pt=UK_ToysGames_DiecastVehicles_DiecastVehicles_JN","20101124223549",null],["SGTO","HKG","E_BAY","TOMY Bit char-G Pullback Porsche 911 GT2 Blue GP10 car","http://cgi.ebay.com/TOMY-Bit-char-G-Pullback-Porsche-911-GT2-Blue-GP10-car-/130458543105?pt=Radio_Control_Parts_Accessories","20101124223542",null],["SCPA","LAX","EBAYM","Porsche 911 / 912 Door Opening Push Button","http://cgi.ebay.com/Porsche-911-912-Door-Opening-Push-Button-/150524621122?pt=Vintage_Car_Truck_Parts_Accessories","20101124223341",null],["SCPA","BHM","EBAYM","87 Porsche 944 antilock brake ABS relay 0265003003","http://cgi.ebay.com/87-Porsche-944-antilock-brake-ABS-relay-0265003003-/180591955227?pt=Motors_Car_Truck_Parts_Accessories","20101124223314",null],["SGCL","CHI","E_BAY","Porsche Designs Silver & Gold Aviator Sunglasses 5621","http://cgi.ebay.com/Porsche-Designs-Silver-Gold-Aviator-Sunglasses-5621-/220701546295?pt=US_Sunglasses","20101124223304",null],["SCPA","LAX","EBAYM","99-05 PORSCHE 911 CARRERA 4 RED/CLEAR LED TAIL LIGHTS","http://cgi.ebay.com/99-05-PORSCHE-911-CARRERA-4-RED-CLEAR-LED-TAIL-LIGHTS-/140482503350?pt=Motors_Car_Truck_Parts_Accessories","20101124223304",null],["SCCA","CAZ","CRAIG","2008 Porsche 911 Convertible (only 4602 miles) ","http://inlandempire.craigslist.org/ctd/2078329308.html","20101124223300",null],["SCPA","LAX","EBAYM","Porsche 911 / 912 Driver's Side Pull Door Handle","http://cgi.ebay.com/Porsche-911-912-Drivers-Side-Pull-Door-Handle-/150524620604?pt=Vintage_Car_Truck_Parts_Accessories","20101124223213",null],["SCPA","USA","EBAYM","2003-2007 PORSCHE CAYENNE LED L.E.D. TAIL LIGHTS LAMPS","http://cgi.ebay.com/2003-2007-PORSCHE-CAYENNE-LED-L-E-D-TAIL-LIGHTS-LAMPS-/290504363019?pt=Motors_Car_Truck_Parts_Accessories","20101124223202",null],["SCCA","SFO","CRAIG","1990 Porsche 911 C4 964 Coupe 2k - $2000 ","http://sfbay.craigslist.org/eby/cto/2078324265.html","20101124223100",null],["SGTO","GBR","E_BAY","Scalextric - Black Porsche 997 GT3RS (DPR) - Nr. Mint","http://cgi.ebay.com/Scalextric-Black-Porsche-997-GT3RS-DPR-Nr-Mint-/290504362761?pt=Slot_Cars","20101124223057",null],["SCPA","BHM","EBAYM","87 Porsche 944 antilock brake ABS pump 0265200028","http://cgi.ebay.com/87-Porsche-944-antilock-brake-ABS-pump-0265200028-/180591954401?pt=Motors_Car_Truck_Parts_Accessories","20101124223045",null],["SCPA","PDX","EBAYM","Porsche Key Fob Remote Handsender 996 637 243 01 986 NR","http://cgi.ebay.com/Porsche-Key-Fob-Remote-Handsender-996-637-243-01-986-NR-/320621940058?pt=Motors_Car_Truck_Parts_Accessories","20101124223039",null],["SCPA","LAX","EBAYM","Porsche 911 / 912 Window Crank Plastic Cover NEW","http://cgi.ebay.com/Porsche-911-912-Window-Crank-Plastic-Cover-NEW-/150524620049?pt=Vintage_Car_Truck_Parts_Accessories","20101124223037",null],["SCCA","LAX","CRAIG","2007 Porsche Cayman - Ready for you dream car!! - $31994","http://ventura.craigslist.org/ctd/2078325334.html","20101124223000",null],["SCPA","SAN","EBAYM","PORSCHE 924 944 951 FRONT RIGHT BUMPER IMPACT ABSORBER","http://cgi.ebay.com/PORSCHE-924-944-951-FRONT-RIGHT-BUMPER-IMPACT-ABSORBER-/230554823055?pt=Motors_Car_Truck_Parts_Accessories","20101124222957",null],["SGTO","USA","E_BAY","PORSCHE BOXSTER \"S\" TOY CAR BATTERY RIDE-ON PEDAL $600","http://cgi.ebay.com/PORSCHE-BOXSTER-S-TOY-CAR-BATTERY-RIDE-ON-PEDAL-600-/260698067068?pt=LH_DefaultDomain_0","20101124222857",null],["SCPA","LAX","EBAYM","Porsche 356 Door Hinges With Pins","http://cgi.ebay.com/Porsche-356-Door-Hinges-Pins-/150524619186?pt=Vintage_Car_Truck_Parts_Accessories","20101124222850",null],["SCPA","CAN","EBAYM","No Error SMD LED License Plate Lights Porsche Cayenne","http://cgi.ebay.com/No-Error-SMD-LED-License-Plate-Lights-Porsche-Cayenne-/220701544455?pt=Motors_Car_Truck_Parts_Accessories","20101124222801",null],["SCCA","SAN","CRAIG","2006 PORSCHE 911 CARRERA CAB RED - $57980 ","http://sandiego.craigslist.org/nsd/ctd/2078322474.html","20101124222800",null],["SCCA","NCZ","EBAYM","Porsche : 911 Porsche 911 S Coupe","http://cgi.ebay.com/Porsche-911-/280594283106?pt=US_Cars_Trucks","20101124222756",null],["SGTO","CHI","E_BAY","Exoto pre-production Porsche 917/30 developement model","http://cgi.ebay.com/Exoto-pre-production-Porsche-917-30-developement-model-/250732078394?pt=Diecast_Vehicles","20101124222725",null],["SCPA","CAN","EBAYM","No Error SMD LED License Plate Lights Porsche Carrera","http://cgi.ebay.com/No-Error-SMD-LED-License-Plate-Lights-Porsche-Carrera-/220701544189?pt=Motors_Car_Truck_Parts_Accessories","20101124222710",null],["SCPA","LAX","EBAYM","Porsche 356 '60' Gold Emblem NEW","http://cgi.ebay.com/Porsche-356-60-Gold-Emblem-NEW-/150524618386?pt=Vintage_Car_Truck_Parts_Accessories","20101124222650",null],["SCPA","PDX","EBAYM","Porsche Shifter Bushing Kit 911 912 (65-70)","http://cgi.ebay.com/Porsche-Shifter-Bushing-Kit-911-912-65-70-/220701543897?pt=Motors_Car_Truck_Parts_Accessories","20101124222616",null],["SGTO","SAN","CRAIG","Brand New Porsche 911 GT1 Model car kit - $20 ","http://sandiego.craigslist.org/csd/tag/2078319895.html","20101124222600",null],["SCCA","SAF","CRAIG","1975 Porsche 911S - $11850 ","http://santafe.craigslist.org/cto/2078320322.html","20101124222600",null],["SCCA","SAN","CRAIG","**** 06 PORSCHE 911 **** - $49980 ","http://sandiego.craigslist.org/nsd/ctd/2078318575.html","20101124222500",null],["SCPA","BOS","CRAIG","Porsche 911 \"cookie cutter\" 15'wheels and tires, staggard - $400 ","http://boston.craigslist.org/gbs/pts/2078312200.html","20101124222500",null],["SCPA","LAX","EBAYM","Porsche 356 / 912 Bell Crank","http://cgi.ebay.com/Porsche-356-912-Bell-Crank-/160510869016?pt=Vintage_Car_Truck_Parts_Accessories","20101124222455",null],["SGTO","USA","E_BAY","BSRT G3-R MODIFIED, MARTINI PORSCHE 917, POLY MAGS","http://cgi.ebay.com/BSRT-G3-R-MODIFIED-MARTINI-PORSCHE-917-POLY-MAGS-/130458540809?pt=Slot_Cars","20101124222435",null],["SGTO","PHX","E_BAY","Porsche 356 B 1/18 Burago Porsche Very Good Condition *","http://cgi.ebay.com/Porsche-356-B-1-18-Burago-Porsche-Very-Good-Condition-/190472361137?pt=Diecast_Vehicles","20101124222343",null],["SCPA","SAN","EBAYM","Porsche ( Pedals ) Accessories Body kits Spoiler","http://cgi.ebay.com/Porsche-Pedals-Accessories-Body-kits-Spoiler-/140482500881?pt=Motors_Car_Truck_Parts_Accessories","20101124222334",null],["SCPA","LAX","EBAYM","Porsche 911 / 912 Heat Control Lever","http://cgi.ebay.com/Porsche-911-912-Heat-Control-Lever-/160510868475?pt=Vintage_Car_Truck_Parts_Accessories","20101124222315",null],["SCPA","CHI","EBAYM","5 ZDDP ENGINE OIL ADDITIVE PORSCHE FERRARI MASERATI","http://cgi.ebay.com/5-ZDDP-ENGINE-OIL-ADDITIVE-PORSCHE-FERRARI-MASERATI-/200547309011?pt=Vintage_Car_Truck_Parts_Accessories","20101124222304",null],["SGHG","PHL","E_BAY","NEW PORSCHE DESIGN 8002 A 50-20-150 CHAMPAGNE GLASSES !","http://cgi.ebay.com/NEW-PORSCHE-DESIGN-8002-50-20-150-CHAMPAGNE-GLASSES-/390265618082?pt=LH_DefaultDomain_0","20101124222252",null],["SCPA","USA","EBAYM","H1 Xenon HID Headlight Bulbs Porsche 911 95-98 Low Beam","http://cgi.ebay.com/H1-Xenon-HID-Headlight-Bulbs-Porsche-911-95-98-Low-Beam-/220701542135?pt=Motors_Car_Truck_Parts_Accessories","20101124222130",null],["SCPA","PDX","EBAYM","Porsche RS 3D Badge Decal Emblem plus Wheel Centers 3\"","http://cgi.ebay.com/Porsche-RS-3D-Badge-Decal-Emblem-plus-Wheel-Centers-3-/320621937286?pt=Motors_Car_Truck_Parts_Accessories","20101124222107",null],["SCPA","LAX","EBAYM","Porsche 356 / 912 Headlight Bracket Clips NEW","http://cgi.ebay.com/Porsche-356-912-Headlight-Bracket-Clips-NEW-/160510867738?pt=Vintage_Car_Truck_Parts_Accessories","20101124222022",null],["SCPA","CLT","EBAYM","1985.5 PORSCHE 944 HIDEAWAY HEAD LIGHT ASSEMBLY","http://cgi.ebay.com/1985-5-PORSCHE-944-HIDEAWAY-HEAD-LIGHT-ASSEMBLY-/250732075594?pt=Motors_Car_Truck_Parts_Accessories","20101124222021",null],["SCCA","NYC","CRAIG","2005 Porsche Cayenne S/Tiptronic dvd navi roof - $25995 ","http://newyork.craigslist.org/que/ctd/2078310941.html","20101124221900",null],["SCPA","AZO","EBAYM","COMPLETE BEST PORSCHE 911 CARRERA REPAIR MANUAL 1984-89","http://cgi.ebay.com/COMPLETE-BEST-PORSCHE-911-CARRERA-REPAIR-MANUAL-1984-89-/350416755181?pt=Motors_Car_Truck_Parts_Accessories","20101124221852",null],["SCPA","LAX","EBAYM","Porsche 356 Late BT5 / BT6 Gear Shift And Bracket","http://cgi.ebay.com/Porsche-356-Late-BT5-BT6-Gear-Shift-And-Bracket-/160510867207?pt=Vintage_Car_Truck_Parts_Accessories","20101124221803",null],["SCCA","TUS","CRAIG","2011 Porsche Panamera Sedan 4dr HB 4 AWD Sedan - $89855 ","http://tucson.craigslist.org/ctd/2078309352.html","20101124221800",null],["SCCA","MTZ","EBAYM","Porsche : 911 Carrera 4S 2007 Porsche 911 Yellow Convertible MINT Condition","http://cgi.ebay.com/Porsche-911-/330500368727?pt=US_Cars_Trucks","20101124221712",null],["SGBO","GBR","E_BAY","Porsche 924 and Turbo 1976-85 Owner's Workshop Manual (","http://cgi.ebay.com/Porsche-924-and-Turbo-1976-85-Owners-Workshop-Manual-/230554819317?pt=AU_Non_Fiction_Books_2","20101124221536",null],["SCPA","LAX","EBAYM","Porsche 911 Air Pump Bracket","http://cgi.ebay.com/Porsche-911-Air-Pump-Bracket-/150524614520?pt=Vintage_Car_Truck_Parts_Accessories","20101124221455",null],["SCPA","NYC","EBAYM","PORSCHE 356 Pre A Interior Dome Light","http://cgi.ebay.com/PORSCHE-356-Pre-Interior-Dome-Light-/280594278815?pt=Vintage_Car_Truck_Parts_Accessories","20101124221310",null],["EBAY","GBR","E_BAY","HUGE LAMINATED James Dean porsche car Licenced Poster","http://cgi.ebay.com/HUGE-LAMINATED-James-Dean-porsche-car-Licenced-Poster-/270668675350?pt=UK_DVD_Film_TV_Film_Memorabilia_LE","20101124221247",null],["SCPA","LAX","EBAYM","Porsche 356 Transmission Carrier","http://cgi.ebay.com/Porsche-356-Transmission-Carrier-/150524613990?pt=Vintage_Car_Truck_Parts_Accessories","20101124221242",null],["SCPA","PDX","EBAYM","Porsche Factory OEM Car Cover for 986 Boxster 97-04 NR!","http://cgi.ebay.com/Porsche-Factory-OEM-Car-Cover-986-Boxster-97-04-NR-/320621934719?pt=Motors_Car_Truck_Parts_Accessories","20101124221231",null],["SCPA","LAX","EBAYM","PORSCHE 968 OEM DOOR LOCK ACTUATOR MOTOR RIGHT SIDE","http://cgi.ebay.com/PORSCHE-968-OEM-DOOR-LOCK-ACTUATOR-MOTOR-RIGHT-SIDE-/390265615849?pt=Motors_Car_Truck_Parts_Accessories","20101124221145",null],["SGCO","ORZ","E_BAY","VW & Porsche Oct 1981 Audi Beetle Baja Bug 914 924 944","http://cgi.ebay.com/VW-Porsche-Oct-1981-Audi-Beetle-Baja-Bug-914-924-944-/170570669031?pt=LH_DefaultDomain_0","20101124221141",null],["SCPA","LAX","EBAYM","PORSCHE 968 OEM DOOR LOCK ACTUATOR MOTOR DRIVER SIDE","http://cgi.ebay.com/PORSCHE-968-OEM-DOOR-LOCK-ACTUATOR-MOTOR-DRIVER-SIDE-/390265615811?pt=Motors_Car_Truck_Parts_Accessories","20101124221133",null],["SCPA","MIA","EBAYM","PORSCHE 997 TT TUBISTYLE EXHAUST TIP **LEFT SIDE ONLY**","http://cgi.ebay.com/PORSCHE-997-TT-TUBISTYLE-EXHAUST-TIP-LEFT-SIDE-ONLY-/150524593052?pt=Motors_Car_Truck_Parts_Accessories","20101124221121",null],["SCPA","LAX","EBAYM","PORSCHE 968 COOLANT OVERFLOW RADIATOR RESERVOIR OEM","http://cgi.ebay.com/PORSCHE-968-COOLANT-OVERFLOW-RADIATOR-RESERVOIR-OEM-/390265615778?pt=Motors_Car_Truck_Parts_Accessories","20101124221121",null],["SCPA","LAX","EBAYM","PORSCHE 944 968 951 TURBO ABS SENSOR FRONT OEM","http://cgi.ebay.com/PORSCHE-944-968-951-TURBO-ABS-SENSOR-FRONT-OEM-/390265615737?pt=Motors_Car_Truck_Parts_Accessories","20101124221109",null],["SCPA","LAX","EBAYM","PORSCHE 944 968 951 TURBO ABS SENSOR FRONT OEM","http://cgi.ebay.com/PORSCHE-944-968-951-TURBO-ABS-SENSOR-FRONT-OEM-/390265615701?pt=Motors_Car_Truck_Parts_Accessories","20101124221101",null],["SCPA","LAX","EBAYM","Porsche 356 C / SC / 912 Air Filter Elbow Connector","http://cgi.ebay.com/Porsche-356-C-SC-912-Air-Filter-Elbow-Connector-/160510865273?pt=Vintage_Car_Truck_Parts_Accessories","20101124221026",null]],124]
	 
	 * @example
	 * var head = prompt('Enter a title to search for', 'Porsche 911');
	 * var params = {head: head};
	 * threeTapsSearchClient.new(params, callback);
	 */
	'new': function(params, callback) {
		return this.client.request(this.path, 'new', params, null, function(results) {
			callback(results);
		});
	}
};

threeTapsClient.register('search', threeTapsSearchClient);

exports.threeTapsClient = threeTapsClient;
