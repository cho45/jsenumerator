$(function () { $.get("test.js", {}, function (data) {

// get tests number.
data = data.match(/\/\/ ::Test::Start::((?:\s|[^\s])+)::Test::End::/)[1];
var testfuns = []; data.replace(/(ok|expect)\(.+/g, function (m) {
	//if (window.console) console.log(m);
	testfuns.push(m);
	return m;
});

var results = $("#results tbody");
var expects = testfuns.length;

function show (msg, expect, result) {
	var okng = this;
	testfuns.pop();
	$("#nums").text([expects - testfuns.length, expects].join("/"));
	expect = (typeof expect == "function") ? uneval(expect).match(/[^{]+/)+"..." : uneval(expect);
	result = (typeof result == "function") ? uneval(result).match(/[^{]+/)+"..." : uneval(result);
	$("<tr class='"+okng+"'><td>"+[msg, expect, result].join("</td><td>")+"</td></tr>").appendTo(results);
	if (testfuns.length) {
		$("#nums").css("color", "#900");
	} else {
		$("#nums").css("color", "");
	}
	if (okng == "ng" || arguments.callee.ng) {
		arguments.callee.ng = true;
		$("#nums").css("background", "#900");
		$("#nums").css("color", "#fff");
	}
	window.scrollTo(0, document.body.scrollHeight);
}

function msg (m) {
	$("<tr class='msg'><td colspan='3'>"+m+"</td></tr>").appendTo(results);
	window.scrollTo(0, document.body.scrollHeight);
}

function print (m) {
	$("<tr class='msg low'><td colspan='3'>"+m+"</td></tr>").appendTo(results);
	window.scrollTo(0, document.body.scrollHeight);
}

function header () {
	$("<tr> <th>Message</th> <th>Expect</th> <th>Result</th> </tr>").appendTo(results);
}

window.print = print;
window.log = print;

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

Deferred.define();
function tests(setname, fun) {
	msg(setname);
	header();
	return next(fun).error(function (e) {
		ng(e);
	});
}
Deferred.register("tests", tests);

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

	return $.get(filename).next(function (data) {
		var test = _doctest(data);
		expects += test.testnums;
		for (var i = 0; i < test.testnums; i++) testfuns.push("doctest");
		msg("Loaded " + test.testnums + " doctest");
		eval(test.testcode);
	}).error(function (e) {
		ng(e);
	});
}

// ::Test::Start::

E = Enumerator;

msg("Loaded "+testfuns.length+" tests (without doctest)");

tests("Constructor Tests", function () {
	expect("new Enumerator", true, (new Enumerator) instanceof Enumerator);
	expect("Enumerator()",   true,     Enumerator() instanceof Enumerator);

	expect("function", 1, E(function () {
		return 1;
	}).next());

	expect("Basic", [1],       E(1).toArray());
	expect("Basic without bracket", [1, 2],    E(1, 2).toArray());
	expect("Basic without bracket", [1, 2, 3], E(1, 2, 3).toArray());
	expect("Basic", [1, 2],    E([1, 2]).toArray());
	expect("Basic", [1, 2, 3], E([1, 2, 3]).toArray());

	expect("Basic with new", [1],       (new E(1)).toArray());
	expect("Basic with new", [1, 2],    (new E(1, 2)).toArray());
	expect("Basic with new", [1, 2, 3], (new E(1, 2, 3)).toArray());
	expect("Basic with new", [1, 2],    (new E([1, 2])).toArray());
	expect("Basic with new", [1, 2, 3], (new E([1, 2, 3])).toArray());


	expect("Solo Array",  [1, 2, 3], E([1, 2, 3]).toArray());
	expect("Object Key/Val",  [["foo", 1]], E({foo:1}).toArray());

	(function () {
		expect("arguments", [1, 2, 3], E(arguments).toArray());
	})(1, 2, 3);

	var e = E(function () {
		return Math.random();
	});
	var n = e.next(), nn;

	nn = e.next();
	expect("random: "+ [n, nn].join(", "), false, nn == n);
	n  = nn;

	nn = e.next();
	expect("random: "+ [n, nn].join(", "), false, nn == n);
	n  = nn;

	nn = e.next();
	expect("random: "+ [n, nn].join(", "), false, nn == n);
	n  = nn;
}).
tests("StopIteration", function () {
	var e = E([1, 2, 3]);
	expect("1", 1, e.next());
	expect("2", 2, e.next());
	expect("3", 3, e.next());
	try {
		e.next();
		ng("should not be called");
	} catch (e) {
		if (e == Enumerator.StopIteration) {
			ok("StopIteration thrown");
		} else {
			ng("Unknown Error occured:" + String(e));
		}
	}
}).
tests("cycle", function () {
	var e;
	e = E([1, 2, 3]).cycle();
	expect("1", 1, e.next());
	expect("2", 2, e.next());
	expect("3", 3, e.next());
	expect("1", 1, e.next());
	expect("2", 2, e.next());
	expect("3", 3, e.next());

	e = E([1]).cycle();
	expect("1", 1, e.next());
	expect("1", 1, e.next());
	expect("1", 1, e.next());

	e = E([1, 2]).cycle();
	expect("1", 1, e.next());
	expect("2", 2, e.next());
	expect("1", 1, e.next());
	expect("2", 2, e.next());
	expect("1", 1, e.next());
	expect("2", 2, e.next());

	e = E(function () {
		return Math.random();
	}).cycle();
	var n = 9;
	if (( n = e.next() ) < 1) ok("random: "+n); else ng("random: "+n);
	if (( n = e.next() ) < 1) ok("random: "+n); else ng("random: "+n);
	if (( n = e.next() ) < 1) ok("random: "+n); else ng("random: "+n);
}).
tests("map", function () {
	expect("Basic", [1, 4, 9], E([1, 2, 3]).map(function (i) {
		return i * i;
	}));

	expect("apply", [3, 5], E([[1, 2], [2, 3]]).map(function (x, y) {
		return x + y;
	}));
}).
tests("imap", function () {
	expect("Basic", [1, 4, 9], E([1, 2, 3]).imap(function (i) {
		return i * i;
	}).toArray());

	expect("apply", [1, 4, 9], E([[1, "a"], [2, "b"], [3, "c"]]).imap(function (i, _) {
		return i * i;
	}).toArray());
}).
tests("each", function () {
	var ret;
	ret = [];
	E([1, 2, 3]).each(function (i) {
		ret.push(i);
	});
	expect("Basic", [1, 2, 3], ret);

	ret = [];
	E([1, 2, 3]).each(function (i) {
		ret.push(i);
		throw Enumerator.StopIteration;
	});
	expect("Basic", [1], ret);

	ret = [];
	E([[ 1, "a" ], [ 2, "b"], [ 3, "c" ]]).each(function (i, _) {
		ret.push(i);
	});
	expect("Basic", [1, 2, 3], ret);

	ret = [];
	E([[ 1, "a" ], [ 2, "b"], [ 3, "c" ]]).each(function (i, _) {
		ret.push(i);
		throw Enumerator.StopIteration;
	});
	expect("Basic", [1], ret);
}).
tests("toArray, to_a", function () {
	var a;
	a = [1, 2, 3];
	expect("toArray", a, E(a).toArray());
	expect("to_a",    a, E(a).to_a());

	a = ["1", "2", "3"];
	expect("toArray", a, E(a).toArray());
	expect("to_a",    a, E(a).to_a());
}).
tests("izip", function () {
	expect("Basic", [[1, "a"], [2, "b"], [3, "c"]], E([1, 2, 3]).izip(["a", "b", "c"]).toArray());

	expect("different size enums (should be cut down to shortest)", [[1, "a"], [2, "b"]], E([1, 2, 3]).izip(["a", "b"]).toArray());
}).
tests("iselect, ifilter", function () {
	expect("Basic", [4, 5], E([1, 2, 3, 4, 5]).iselect(function (i) {
		return i > 3;
	}).toArray());

	expect("Basic", [4, 5], E([1, 2, 3, 4, 5]).ifilter(function (i) {
		return i > 3;
	}).toArray());

	expect("Basic", [[ 4 ], [ 5 ]], E([[ 1 ], [ 2 ], [ 3 ], [ 4 ], [ 5 ]]).iselect(function (i, _) {
		return i > 3;
	}).toArray());

	expect("Basic", [[ 4 ], [ 5 ]], E([[ 1 ], [ 2 ], [ 3 ], [ 4 ], [ 5 ]]).ifilter(function (i, _) {
		return i > 3;
	}).toArray());
}).
tests("find", function () {
	expect("Basic", 4, E([1, 2, 3, 4, 5]).find(function (i) {
		return i > 3;
	}));

	expect("apply", [ 4, "d" ], E([[ 1, "a"], [ 2, "b" ], [ 3, "c" ], [ 4, "d" ], [ 5, "e" ]]).find(function (i, _) {
		return i > 3;
	}));
}).
tests("reduce", function () {
	expect("Basic", 6, E([1, 2, 3]).reduce(function (r, i) {
		return r + i;
	}));

	expect("Basic (inject)", 6, E([1, 2, 3]).inject(function (r, i) {
		return r + i;
	}));

	expect("Basic with inital value", 16, E([1, 2, 3]).reduce(function (r, i) {
		return r + i;
	}, 10));

	expect("Invert hash", ({"1":"a", "2":"b"}), E({"a":1, "b":2}).reduce(function (r, i) {
		r[i[1]] = i[0];
		return r
	}, {}));
}).
tests("max", function () {
	expect("Basic", 3, E([1, 2, 3]).max());
	expect("Basic", 3, E([1, 2, 3, 2, 1]).max());
}).
tests("min", function () {
	expect("Basic", 1, E([1, 2, 3]).min());
	expect("Basic", 1, E([1, 2, 3, 2, 1]).min());
}).
tests("chain", function () {
	expect("Basic", [1, 2, 3, 4, 5, 6], E([1, 2, 3]).chain(E([4, 5, 6])).toArray());
	expect("Basic", [1, 2, 3, 4, 5, 6, 7, 8, 9], E([1, 2, 3]).chain(E([4, 5, 6]), [7, 8, 9]).toArray());
}).
tests("itake", function () {
	expect("Basic",     [1, 2], E([1, 2, 3]).itake(2).toArray());
	expect("with func", [1, 2], E([1, 2, 3]).itake(function (i) {
		return i < 3;
	}).toArray());
}).
tests("idrop", function () {
	expect("Basic",        [3], E([1, 2, 3]).idrop(2).toArray());
	expect("with func",    [3], E([1, 2, 3]).idrop(function (i) {
		return i < 3;
	}).toArray());
}).
tests("every", function () {
	expect("Basic", true, E([1, 2, 3]).every(function (i) {
		return typeof(i) == "number";
	}));

	expect("Basic", false, E([1, 2, 3, ""]).every(function (i) {
		return typeof(i) == "number";
	}));
}).
tests("some", function () {
	expect("Basic", true, E([1, 2, 3]).some(function (i) {
		return typeof(i) == "number";
	}));

	expect("Basic", true, E([1, 2, 3, ""]).some(function (i) {
		return typeof(i) == "number";
	}));

	expect("Basic", true, E([1, 2, 3, ""]).some(function (i) {
		return typeof(i) == "string";
	}));

	expect("Basic", false, E([1, 2, 3]).some(function (i) {
		return typeof(i) == "string";
	}));
}).
tests("countup", function () {
	expect("Basic", [1, 2, 3], E([1, 2, 3]).countup().take(3));
	expect("Basic", [2, 3, 4],         E(2).countup().take(3));
	expect("Basic", [0, 1, 2],          E().countup().take(3));
}).
tests("withIndex", function () {
	expect("Basic", [["a", 0], ["b", 1], ["c", 2]], E(["a", "b", "c"]).withIndex().toArray());
	expect("Basic", [["a", 10], ["b", 11], ["c", 12]], E(["a", "b", "c"]).withIndex(10).toArray());

	expect("Basic", ["a", "b", "c"], E(["a", "b", "c"]).withIndex().map(function (item, index) {
		return item;
	}));
}).
tests("stop", function () {
	expect("Basic", ["a"], E(["a", "b", "c"]).map(function (i) {
		if (i == "b")
			this.stop();
		else
			return i;
	}));
}).
tests("Application", function () {
	expect("cycle.imap.take", [1, 4, 9, 1, 4, 9], E([1, 2, 3]).cycle().imap(function (i) {
		return i * i;
	}).take(6));

	expect("izip/cycle", [["a", 1], ["b", 2], ["c", 3], ["d", 1]], E(["a", "b", "c", "d"]).izip(E([1, 2, 3]).cycle()).toArray() );

	expect("(izip/cycle).withIndex.iselect",
		[[["a", 1], 0], [["c", 3], 2]],
		E(["a", "b", "c", "d"]).izip(E([1, 2, 3]).cycle()).withIndex().iselect(function (item, index) {
			return index % 2 == 0;
		}).toArray()
	);

	var fizzbuzzA = [1, 2, "Fizz", 4, "Buzz", "Fizz", 7, 8, "Fizz", "Buzz", 11, "Fizz", 13, 14, "FizzBuzz", 16, 17, "Fizz", 19, "Buzz"];

	var fizzbuzz;

	fizzbuzz = E(1)
		.countup()
		.izip(
			E(["", "", "Fizz"]).cycle(),
			E(["", "", "", "", "Buzz"]).cycle())
		.imap(function (num, fizz, buzz) {
			return fizz + buzz || num;
		})
		.take(20);
	expect("FizzBuzz", fizzbuzzA, fizzbuzz);

	fizzbuzz  = E(1).countup().itake(20).map(function (i) {
		return (i % 3 == 0) ? (i % 5 == 0) ? "FizzBuzz" : "Fizz" :
		                      (i % 5 == 0) ? "Buzz"     :      i ;
	});
	expect("FizzBuzz", fizzbuzzA, fizzbuzz);

	function fib () {
		var p = 0, i = 1;
		return E([0, 1]).chain(E(function () {
			var ret = p + i;
			p = i;
			i = ret;
			return ret;
		}));
	}

	var f = fib();
	expect("Fibonacci", [0, 1, 1, 2, 3, 5, 8, 13, 21, 34], f.take(10));
	expect("Fibonacci", [55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181], f.take(10));
	expect("Fibonacci", [6765, 10946, 17711, 28657, 46368], f.take(5));


//	Enumerator.prototype.dloop = function (fun, n) {
//		var enum = this;
//		if (!n) n = 1;
//		return next(function () {
//			for (var  i = 0; i < n; i++) {
//				fun.call(enum, enum.next());
//			}
//			return call(arguments.callee);
//		}).error(function (e) {
//			if (e != Enumerator.StopIteration) throw e;
//		});
//	};
//
//	return fib().itake(20).dloop(function (i) {
//		log(i);
//	});
}).
tests("DocTest", function () {
	return doctest("jsenumerator.js");
}).
next(function () { msg("End") });

// ::Test::End::
}) });




/* util */

if (typeof uneval != "function") {
	uneval = function  (o) {
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
}

