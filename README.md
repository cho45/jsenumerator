JSEnumerator
============

A light-weight library for list or enumeration.

Download
--------

* https://raw.github.com/cho45/jsenumerator/master/jsenumerator.js

== License ==

MIT. See header of https://raw.github.com/cho45/jsenumerator/master/jsenumerator.js

Concept
-------

 * Do not taint global.
 * Infinite list functions like MochiKit.
 * Enumeration method chain like Ruby 1.9.

Using method chain for generating sequence has advantages over nesting function call for writing as you think.

Sample
------

FizzBuzz

	// normal
	fizzbuzz  = E(1).countup().imap(function (i) {
		return (i % 3 == 0) ? (i % 5 == 0) ? "FizzBuzz" : "Fizz" :
							  (i % 5 == 0) ? "Buzz"     :      i ;
	}).take(20);

	// take some values from pre-defined sequence
	fizzbuzz = E(1)
		.countup()
		.izip(
			E(["", "", "Fizz"]).cycle(),
			E(["", "", "", "", "Buzz"]).cycle())
		.imap(function (num, fizz, buzz) {
			return fizz + buzz || num;
		})
		.take(20);


with JSDeferred
---------------

	function fib () {
		var p = 0, i = 1;
		return E([0, 1]).chain(E(function () {
			var ret = p + i;
			p = i;
			i = ret;
			return ret;
		}));
	}

	Enumerator.prototype.dloop = function (fun, n) {
		var enum = this;
		if (!n) n = 1;
		return next(function () {
			for (var  i = 0; i < n; i++) {
				fun.call(enum, enum.next());
			}
			return call(arguments.callee);
		}).error(function (e) {
			if (e != Enumerator.StopIteration) throw e;
		});
	};

	fib().itake(100).dloop(function (i) {
		log(i);
	});

