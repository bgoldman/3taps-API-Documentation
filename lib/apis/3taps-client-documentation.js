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
			name: type
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
			category.methods[prop] = {
				name: prop
				,description: method.desc || ''
				,params: method.params || ''
				,returns: method.returns || ''
			};
		}
		
		categories[type] = category;
	}
	
	return categories;
}

exports.documentation = documentation;
