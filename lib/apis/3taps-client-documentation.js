var threeTapsClientLib = require('./3taps-client');
var clients = threeTapsClientLib.threeTapsClient.clients;

var jsdocToolkit = require('./jsdoc-toolkit-wrapper');
var symbols = jsdocToolkit.symbols;
var symbolsByClass = {};

for (var i in symbols) {
	var symbol = symbols[i];
	var category = symbol.name;
	var methods = symbol.getMethods();
	var methodsByName = {};
	
	for (var j in methods) {
		var method = methods[j];
		methodsByName[method.name] = method;
	}
	
	symbolsByClass[category] = {
		description: symbol.classDesc || ''
		,methods: methodsByName
	};
}

var documentation = function() {
	var categories = [];
	
	for (var type in clients) {
		var client = clients[type];
		
		var category = {
			name: type.substr(0, 1).toUpperCase() + type.substr(1)
			,methods: {}
		};
		
		var capitalized = type.substr(0, 1).toUpperCase() + type.substr(1);
		var className = 'threeTaps' + capitalized + 'Client';
		var symbol = symbolsByClass[className];
		category.description = symbol.description;
		var methods = symbol.methods;
		
		for (var prop in client.prototype) {
			if (typeof client.prototype[prop] != 'function') {
				continue;
			}
			
			var method = methods[prop] || {};
			var hideParams = false;
			
			if (method._params && method._params[0] && method._params[0] && method._params[0].type == 'Hide') {
				hideParams = true;
			}

			category.methods[prop] = {
				name: prop
				,description: method.desc || ''
				,exampleCode: (method.example && method.example.length > 0) ? utils.trim(method.example[1].desc) : ''
				,exampleResponse: (method.example && method.example.length > 1) ? utils.trim(method.example[0].desc) : ''
				,hideParams: hideParams
				,params: method.params || ''
				,returns: method.returns || ''
			};
			
			var restStructure = method.comment ? method.comment.getTag('restStructure') : '';
			if (restStructure.length > 0) category.methods[prop].restStructure = restStructure[0].desc;

			var restUrlExample = method.comment ? method.comment.getTag('restUrlExample') : '';
			if (restUrlExample.length > 0) category.methods[prop].restUrlExample = restUrlExample[0].desc;

			var sampleCodeRun = method.comment ? method.comment.getTag('sampleCodeRun') : 1;
			category.methods[prop].sampleCodeRun = sampleCodeRun;
		}
		
		categories[type] = category;
	}
	
	return categories;
}

exports.documentation = documentation;
