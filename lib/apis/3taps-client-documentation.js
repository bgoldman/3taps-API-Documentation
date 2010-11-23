var threeTapsClientLib = require('./3taps-client');
var clients = threeTapsClientLib.threeTapsClient.clients;

var documentation = function() {
	var categories = [];
	
	for (var type in clients) {
		var client = clients[type];
		var category = {
			name: type
			,methods: {}
		};
		
		for (var prop in client.prototype) {
			if (typeof client.prototype[prop] != 'function') {
				continue;
			}
			
			category.methods[prop] = {
				name: prop
			};
		}
		
		categories[type] = category;
	}
	
	return categories;
}

exports.documentation = documentation;
