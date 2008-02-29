#!rhino
function Main () {

load(Global.arguments[0] || "jsenumerator.js");

var data;
data = readFile("./test.js");
data = data.match(/\/\/ ::Test::Start::((?:\s|[^\s])+)::Test::End::/)[1];
var testfuns = []; data.replace(/(ok|expect)\(.+/g, function (m) {
//	if (window.console) console.log(m);
	testfuns.push(m);
	return m;
});

var expects = testfuns.length;

function show (msg, expect, result) {
	var okng = this;
	testfuns.pop();

	var out = [];
	out.push(color(46, "[", [expects - testfuns.length, expects].join("/"), "]"));
	if (okng == "ng") {
		expect = (typeof expect == "function") ? uneval(expect).match(/[^{]+/)+"..." : uneval(expect);
		result = (typeof result == "function") ? uneval(result).match(/[^{]+/)+"..." : uneval(result);
		out.push(["NG Test::", msg, expect, result].join("\n"));
		print(out.join(""));
		quit();
	} else {
		out.push(" ", color(32, "ok"));
		print(out.join(""));
	}
}

function msg (m) {
	print(m);
}
log = msg;

function ok () {
	show.apply("ok", arguments);
}

function ng () {
	show.apply("ng", arguments);
}

function expect (msg, expect, result) {
	if (uneval(expect) == uneval(result)) {
		show.apply("ok", arguments);
	} else {
		show.apply("ng", arguments);
	}
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
		comments.join("\n").replace(/Code:\n(?:    .+\n)+/g, function (code) {
			try {
			code = code.replace(/^Code:|^    /gm, "");
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
		data = readFile("./jsenumerator.js");
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

addFinalizer(function () {
	if (expects - testfuns.length == expects) {
		print(color(32, "All tests passed"));
	} else {
		print(color(31, "Some tests failed..."));
	}
});

//Deferred.define();
//loop(5, function (n) {
//	print(n);
//});
//
//
//next(function () {
//	print("111");
//	return next(function () {
//		print("222");
//	});
//}).
//next(function () {
//	function aaa () {
//		print("444");
//	}
//	print("333");
//	return call(aaa);
//});

//var id = setTimeout(function () {
//	print("foo");
//}, 1000);
//var id = setTimeout(function () {
//	print("bar");
//	var id = setTimeout(function () {
//		print("bar");
//	}, 1000);
//}, 1000);
//print("hoge");
//print((function () { return this })().setTimeout);

}(function () {
	// emurate setTimeout
	var Global = (function () { return this })();
	var runQueue = [{func:Main,time:0}];
	runQueue.process = function () {
		var now = new Date().valueOf();
		for (var i = 0; i < runQueue.length; i++) {
			if (runQueue[i].time <= now) {
		//		print("invoke"+uneval(runQueue[i]));
				var fun = runQueue[i].func;
				runQueue.splice(i, 1);
				fun();
				break;
			}
		}
	};
	runQueue.add    = function (func, delay) {
		this.push({id:++runQueue._id,func:func, time: new Date().valueOf() + delay});
		return runQueue._id;
	};
	runQueue.remove = function (id) {
		for (var i = 0; i < this.length; i++) {
			if (this[i].id == id) {
				this.splice(i, 1);
				break;
			}
		}
	};
	runQueue._id = 0;

	Global.addFinalizer = function (fun) {
		Global.addFinalizer.finalizers.push(fun);
	};
	Global.addFinalizer.finalizers = [];

	Global.setTimeout = function (func, delay) {
//		print("setTimeout:"+uneval(func));
		return runQueue.add(func, delay);
	};
	Global.clearTimeout = function (id) {
		runQueue.remove(id);
	};

	Global.window = Global;
	Global.Global = Global;
	Global.console = {
		log : function (a) {
			a = Array.prototype.slice.call(arguments, 0);
			print(uneval(a));
		}
	};

	Global.uneval = function  (o) {
		switch (typeof o) {
			case "undefined" : return "(void 0)";
			case "boolean"   : return String(o);
			case "number"    : return String(o);
			case "string"    : return '"' + o.replace(/[\s"'\\]/ig, function (c) {
					return '\\u' + (c.charCodeAt(0) + 0x10000).toString(16).slice(1);
				}) + '"';
			case "function"  : return "(" + o.toString() + ")";
			case "object"    :
				if (o == null) return "null";
				var type = Object.prototype.toString.call(o).match(/\[object (.+)\]/);
				if (!type) throw TypeError("unknown type:"+o);
				switch (type[1]) {
					case "Array":
						var ret = [];
						for (var i = 0; i < o.length; i++) ret.push(arguments.callee(o[i]));
						return "[" + ret.join(", ") + "]";
					case "Object":
						var ret = [];
						for (var i in o) {
							if (!o.hasOwnProperty(i)) continue;
							ret.push(arguments.callee(i) + ":" + arguments.callee(o[i]));
						}
						return "({" + ret.join(", ") + "})";
					case "Number":
						return "(new Number(" + o + "))";
					case "String":
						return "(new String(" + arguments.callee(o) + "))";
					case "Date":
						return "(new Date(" + o.getTime() + "))";
					default:
						if (o.toSource) return o.toSource();
						throw TypeError("unknown type:"+o);
				}
		}
	}

	// run process
	while (runQueue.length) {
		runQueue.process();
	}
	Global.addFinalizer.finalizers.forEach(function (i) { i() });
})();
