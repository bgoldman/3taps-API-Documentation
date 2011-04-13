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
		render(res, 'home/index', {
			documentation: documentation
			,method: req.params.method
		});
	}

	app.get('/', function(req, res) {
		res.redirect('http://3taps.com/developers');
		// render(res, 'home/index', {
		// 	category: 'home'
		// 	,documentation: documentation
		// });
	});
	
	app.get('/glossary', function(req, res) {
		render(res, 'home/glossary', {
			category: 'glossary'
			,documentation: documentation
		});
	});
	
	app.get('/errors', function(req, res) {
		render(res, 'home/errors', {
			category: 'errors'
			,documentation: documentation
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
