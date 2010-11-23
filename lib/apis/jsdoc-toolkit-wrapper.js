var fs = require('fs');
var root = fs.realpathSync('.');

var IO = global.IO = {
	include: function(file) {
		file = file.substr(0, file.indexOf('.'));
		
		var file1 = '/lib/packages/jsdoc-toolkit/app/' + file;
		var file2 = '/lib/packages/jsdoc-toolkit/app/lib/' + file;
		var files = [file1, file2];
		var realpath = null;
		
		for (var i in files) {
			var path = root + files[i];

			try {
				realpath = fs.realpathSync(path + '.js');
				break;
			} catch (e) {
				// no match
			}
		}
		
		if (!realpath) {
			console.log('Could not IO.include: ' + file);
			return false;
		}
		
		require(realpath);
	},
	
	ls: function(dir) {
		return [dir];
	},
	
	readFile: function(file) {
		return fs.readFileSync(file).toString();
	}
};

var LOG = global.LOG = {
	warn: function(message) {
		console.log('LOG.warn: ' + message);
	}
};

var defined = global.defined = function(bj) {
	return (typeof obj != 'undefined');
}

var print = global.print = function(message) {
	console.log('Print: ' + message);
}

var files = [];
files.push(root + '/lib/apis/3taps-client.js');
var JSDOC = global.JSDOC = {
	opt: {
		'_': files
	}
	,version: '2.3.2'
};

// include the main file
IO.include('JSDOC/JsDoc.js');

// include the frame files
IO.include('frame/Chain.js');
IO.include('frame/Dumper.js');
IO.include('frame/Hash.js');
IO.include('frame/Link.js');
IO.include('frame/Namespace.js');
IO.include('frame/Opt.js');
IO.include('frame/Reflection.js');
IO.include('frame/String.js');
IO.include('frame/Testrun.js');

// include the jsdoc files
IO.include('JSDOC/DocComment.js');
IO.include('JSDOC/DocTag.js');
IO.include('JSDOC/JsPlate.js');
IO.include('JSDOC/Lang.js');
IO.include('JSDOC/Parser.js');
IO.include('JSDOC/PluginManager.js');
IO.include('JSDOC/Symbol.js');
IO.include('JSDOC/SymbolSet.js');
IO.include('JSDOC/TextStream.js');
IO.include('JSDOC/Token.js');
IO.include('JSDOC/TokenReader.js');
IO.include('JSDOC/TokenStream.js');
IO.include('JSDOC/Util.js');
IO.include('JSDOC/Walker.js');

// run jsdoc
JSDOC.JsDoc(JSDOC.opt);

exports.symbols = JSDOC.Parser.symbols.toArray();
