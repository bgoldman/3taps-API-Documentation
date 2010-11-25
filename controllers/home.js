var authId = 'fc275ac3498d6ab0f0b4389f8e94422c';
var agentId = '3taps-developers';
var threeTapsLib = require('../lib/apis/3taps');
var threeTaps = new threeTapsLib.threeTaps(authId, agentId);

var threeTapsClientDocumentation = require('../lib/apis/3taps-client-documentation');
var documentation = threeTapsClientDocumentation.documentation();

var data = [
	{text: 'San Francisco, California'},
	{text: 'Los Angeles, California'}
];

exports.controller = function(app, render) {
	var methodAction = function(req, res) {
		/*
		var posts = [
			{source: 'ebaym', category: 'ebay', location: 'ZZZ', heading: 'some title', body: 'some body', price: 5, currency: 'USD', externalID: 12345}
			,{source: 'ebaym', category: 'ebay', location: 'ZZZ', heading: 'some title 2', body: 'some body 2', price: 6, currency: 'USD', externalID: 12346}
			,{source: 'ebaym', category: 'ebay', location: 'ZZZ', heading: 'some title 3', body: 'some body 3', price: 7, currency: 'USD', externalID: 12347}
		];
		threeTaps.posting.get(posts, function(response) {
			console.log(response);
		});
		*/
		console.log(documentation);
		render(res, 'home/index', {
			documentation: documentation
			,method: req.params.method
		});
	}

	app.get('/', function(req, res) {
		render(res, 'home/index', {
			documentation: documentation
		});
	});
	
	app.get('/methods/:category', function(req, res) {
		var categoryName = req.params.category;
		
		if (!documentation[categoryName]) {
			res.redirect('/');
		}
		
		var category = documentation[categoryName];
		render(res, 'home/category', {
			category: category
			,documentation: documentation
			,methods: category.methods
		});
	});
};
