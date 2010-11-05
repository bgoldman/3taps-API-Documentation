var express = require('express');
var app = express.createServer();

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyDecoder());
    app.use(app.router);
    app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
});

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
});

var hooks = require('./lib/hooks');
hooks.events.init(app);

// init controllers
var controllers = require('./controllers/_init');
controllers.init(app);

var port = process.argv[2] || 41019;
app.listen(port, 'goldmaninteractive.com');
