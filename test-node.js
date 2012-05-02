#!node

var util      = require('util');
var fs       = require('fs');
var Enumerator = require('./jsenumerator.js').Enumerator;
var Global   = global;

var data;
data = fs.readFileSync('./test.js', 'ascii');
data = data.match(/\/\/ ::Test::Start::([\s\S]+)::Test::End::/)[1];
var testfuns = []; data.replace(/(ok|expect)\(.+/g, function (m) {
	testfuns.push(m);
	return m;
});

var expects = testfuns.length;

function uneval (obj) {
	return util.inspect(obj);
}

function show (msg, expect, result) {
	var okng = this;

	var out = [];
	out.push(color(46, "[", [expects - testfuns.length, expects].join("/"), "]"));
	if (okng == "skip") {
		out.push(" ", color(33, "skipped " + expect + " tests: " + msg));
		console.log(out.join(""));
		while (expect--) testfuns.pop();
	} else
	if (okng == "ng") {
		testfuns.pop();
		expect = (typeof expect == "function") ? uneval(expect).match(/[^{]+/)+"..." : uneval(expect);
		result = (typeof result == "function") ? uneval(result).match(/[^{]+/)+"..." : uneval(result);
		out.push(["NG Test::", msg, expect, result].join("\n"));
		console.log(out.join(""));
		process.exit(1);
	} else {
		testfuns.pop();
		out.push(" ", color(32, "ok"));
		console.log(out.join(""));
	}
}

function msg (m) {
	console.log(m);
}
log = msg;

function ok () {
	show.apply("ok", arguments);
	return true;
}

function ng () {
	show.apply("ng", arguments);
	return true;
}

function skip () {
	show.apply("skip", arguments);
	return true;
}

function expect (msg, expect, result) {
	if (util.inspect(expect) == util.inspect(result)) {
		show.apply("ok", arguments);
	} else {
		show.apply("ng", arguments);
	}
	return true;
}

function color (code) {
	var str = "";
	for (var i = 1; i < arguments.length; i++) str += arguments[i];
	return [
		String.fromCharCode(27), "[", code, "m",
		str,
		String.fromCharCode(27), "[0m"
	].join("");
}

function tests(setname, fun) {
	msg(setname);
	header();
	return next(fun).error(function (e) {
		ng(e);
	});
}

function header () {
}

function next (f) {
	f();
	var r = {
		next : arguments.callee,
		error : function () {
			return r;
		},
		tests : tests
	};
	return r;
}

function doctest (filename) {

	function _doctest (data) {
		var testcode = [];
		var testnums = 0;
		var comments = [];

		data.replace(/\/(\*[\s\S]+?)\*\//g, function (_, m) {
			comments.push(m.replace(/^\s*\*[ \n]/gm, ""));
			return _;
		})
		comments.join("\n").replace(/@example\n(?:    .+\n)+/g, function (code) {
			try {
			code = code.replace(/^@example|^    /gm, "");
			var codeblock = [];
			var lines     = code.split(/\n/);
			for (var i = 0; i < lines.length; i++) {
				if (/^\/\/=> (.+)/.test(lines[i])) {
					var expect = RegExp.$1;
					testcode.push("expect(" + uneval(codeblock.join("\n")) + ", eval(" + uneval(expect) + "), eval(" + uneval(codeblock.join("\n")) + "));");
					testnums++;
					codeblock = [];
				} else
				if (/(.+) \/\/=> (.+)/.test(lines[i])) {
					testcode.push(codeblock.join("\n"));
					codeblock = [];
					var expect = RegExp.$2;
					var testcd = RegExp.$1;
					testcode.push("expect(" + uneval(testcd) + ", eval(" + uneval(expect) + "), eval(" + uneval(testcd) + "));");
					testnums++;
				} else
				if (/^\/\//.test(lines[i])) {
					testcode.push(codeblock.join("\n"));
					codeblock = [];
				} else {
					codeblock.push(lines[i]);
				}
			}
			testcode.push(codeblock.join("\n"));
			} catch (e) { ng(e) }
		});

		return {
			testcode: testcode.join("\n"),
			testnums: testnums
		};
	}

	return next(function (data) {
		data = fs.readFileSync("./jsenumerator.js", 'utf-8');
		var test = _doctest(data);
		expects += test.testnums;
		for (var i = 0; i < test.testnums; i++) testfuns.push("doctest");
		msg("Loaded " + test.testnums + " doctest");
		eval(test.testcode);
	}).error(function (e) {
		ng(e);
	});
}

// run tests
eval(data);

process.on('exit', function () {
	if (expects - testfuns.length == expects) {
		log(color(32, "All tests passed"));
	} else {
		log(color(31, "Some tests failed..."));
		process.exit(1);
	}
});
