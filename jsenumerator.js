/*
 * @fileOverview JSEnumerator
 * @author       cho45@lowreal.net
 * @version      0.1.0
 * @license
 * JSEnumerator
 *
 * Copyright (C) 2012 cho45 <cho45@lowreal.net> ( http://www.lowreal.net/ )
 * Copyright (C) 2008 KAYAC Inc. ( http://www.kayac.com/ )
 *
 *
 * Most functions ('i' prefixed and some) are lazy for evaluation.
 * can't rewind (so you should create Enumerator by each time)
 *
 * License:: MIT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
; // no warnings for uglify.js
/* function Enumerator () //=> constructor
 *
 * Code:
 *
 *     E = Enumerator;
 *
 *     // Array
 *     E([1, 2, 3]).reduce(function (r, i) {
 *         return r + i
 *     });         // Sum up.
 *     //=> 6
 *
 *     // Hash
 *     E({"a":1, "b":2}).reduce(function (r, i) {
 *         r[i[1]] = i[0];
 *         return r
 *     }, {});     // Inverted hash.
 *     //=> ({1:"a",2:"b"})
 *
 *     // Function (infinite list/generator)
 *     E(function () {
 *          return Math.random();
 *     }).take(5); // Random sequence.
 *
 *     // arguments
 *     (function () {
 *         return E(arguments).toArray();
 *     })(1, 2, 3);
 *     //=> [1, 2, 3]
 *
 */
function Enumerator (a) {
	return (arguments.length > 1)       ? new Enumerator().initWithArray(arguments) :
	       (this instanceof Enumerator) ? this.init(a) : new Enumerator(a);
}
Enumerator.prototype = {
	init : function () {
		if (arguments.length === 0) {
			return this.initWithArray([]);
		} else {
			if (arguments[0] && arguments[0].length) {
				return this.initWithArray(arguments[0]);
			} else
			if (typeof arguments[0] == "function") {
				return this.initWithFunction(arguments[0]);
			} else
			if (typeof arguments[0] == "object") {
				if (arguments[0] instanceof Enumerator) {
					return arguments[0];
				} else {
					return this.initWithHash(arguments[0]);
				}
			} else {
				return this.initWithArray([arguments[0]]);
			}
		}
	},

	initWithFunction : function (fun) {
		this.next = fun;
		return this;
	},

	initWithArray : function (array) {
		this.array = array;
		this.pos   = 0;
		this.initWithFunction(function () {
			if (this.pos < array.length) {
				return array[this.pos++];
			} else {
				throw Enumerator.StopIteration;
			}
		});
		return this;
	},

	initWithHash : function (hash) {
		var arr = [];
		for (var k in hash) if (hash.hasOwnProperty(k)) {
			arr.push([k, hash[k]]);
		}
		this.initWithArray(arr);
		return this;
	},

	/* function Enumerator.prototype.toArray () //=> Array
	 *
	 * Expand all values to one Array.
	 *
	 * Code:
	 *     E().countup().itake(5).toArray(); //=> [0, 1, 2, 3, 4]
	 *     E(1, 2, 3).toArray(); //=> [1, 2, 3]
	 *
	 * Receiver must be finate.
	 */
	toArray : function () {
		return this.map(function (x) { return x });
	},

	/* function Enumerator.prototype.cycle () //=> Enumerator
	 *
	 * Return cycled infinite list of receiver.
	 *
	 * Code:
	 *     E(0, 1).cycle().take(10); //=> [0, 1, 0, 1, 0, 1, 0, 1, 0, 1]
	 *     E(0).cycle().take(5);     //=> [0, 0, 0, 0, 0]
	 */
	cycle : function () {
		var self  = this, cache = [];
		return Enumerator(function () {
			try {
				var i = self.next();
				cache.push(i);
				return i;
			} catch (e) {
				if (e != Enumerator.StopIteration) throw e;
				var i = -1;
				this.next = function () { return cache[++i % cache.length] };
				return this.next();
			}
		});
	},

	/* function Enumerator.prototype.each (fun) //=> Array
	 * function Enumerator.prototype.map  (fun) //=> Array
	 *
	 * Receiver must be finite.
	 *
	 * Call passed `fun` and return values returned by `fun`.
	 *
	 * Code:
	 *     E(1, 2, 3).map(function (i) { return i * i }); //=> [1, 4, 9]
	 */
	map : function (fun) {
		var ret = [];
		try {
			if (this.array) {
				var a = this.array, c = this.pos, len = a.length - c, i = len % 8, type = (fun.length > 1) ? "apply" : "call";
				if (i > 0) do {
					ret.push(fun[type](this, a[c++]));
				} while (--i);
				i = len >> 3;
				if (i > 0) do {
					ret.push(
						fun[type](this, a[c++]), fun[type](this, a[c++]),
						fun[type](this, a[c++]), fun[type](this, a[c++]),
						fun[type](this, a[c++]), fun[type](this, a[c++]),
						fun[type](this, a[c++]), fun[type](this, a[c++])
					);
				} while (--i);
				this.pos = c;
			} else {
				while (1) ret.push(fun[fun.length > 1 ? "apply" : "call"](this, this.next()));
			}
		} catch (e) {
			if (e != Enumerator.StopIteration) throw e;
		}
		return ret;
	},

	/* function Enumerator.prototype.imap ([fun]) //=> Enumerator
	 *
	 * Return Enumerator its apply `fun` each value.
	 *
	 * Code:
	 *     E(1, 2, 3).imap(function (i) { return i * i }).toArray(); //=> [1, 4, 9]
	 *     E(1, 2, 3).cycle().imap(function (i) { return i * i }).take(6); //=> [1, 4, 9, 1, 4, 9]
	 */
	imap : function (fun) {
		var self = this;
		return Enumerator(function () {
			return fun[fun.length > 1 ? "apply" : "call"](this, self.next());
		});
	},

	/* function Enumerator.prototype.izip ([p, q...]) //=> Enumerator
	 *
	 * Return Enumerator of list which contains each items self and arguments.
	 *
	 * Code:
	 *     E(1, 2, 3, 4, 5).izip([1, 2, 3], ["a", "b", "c"]).toArray();
	 *     //=> [[1, 1, "a"], [2, 2, "b"], [3, 3, "c"]]
	 */
	izip : function (/* args */) {
		var eles = [this];
		eles.push.apply(eles, Enumerator(arguments).map(function (i) {
			return Enumerator(i);
		}));
		return Enumerator(function () {
			var args = [];
			for (var i = 0; i < eles.length; i++) args.push(eles[i].next());
			return args;
		});
	},

	/* function Enumerator.prototype.ifilter (fun) //=> Enumerator
	 * function Enumerator.prototype.iselect (fun) //=> Enumerator
	 *
	 * Return Enumerator of filtered list with `fun` of receiver.
	 *
	 * Code:
	 *     E().countup().iselect(function (i) {
	 *         return i % 2 == 0;
	 *     }).take(10);
	 *     //=> [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
	 */
	iselect : function (fun) {
		var self = this;
		return Enumerator(function () {
			var val; do {
				val = self.next();
			} while (!fun[fun.length > 1 ? "apply" : "call"](this, val));
			return val;
		});
	},

	/* function Enumerator.prototype.find (fun) //=> Enumerator
	 *
	 * Return a item which is true with `fun`.
	 *
	 * Code:
	 *     E({a:1}, {a:2}, {a:3}).find(function (i) {
	 *         return i.a == 2;
	 *     });
	 *     //=> ({a:2});
	 *
	 * Receiver must be finite.
	 */
	find : function (fun) {
		var ret; do {
			ret = this.next();
		} while (!fun[fun.length > 1 ? "apply" : "call"](this, ret));
		return ret;
	},

	/* function Enumerator.prototype.inject (fun [, init]) //=> any
	 * function Enumerator.prototype.reduce (fun [, init]) //=> any
	 *
	 * Fold receiver to one value.
	 *
	 * Code:
	 *     E(1).countup().itake(3).reduce(function (r, i) {
	 *         return r + i;
	 *     });
	 *     //=> 6
	 *
	 * Receiver must be finite.
	 */
	reduce : function (fun, init) {
		var self = this;
		var rval = (typeof init == "undefined") ? self.next() : init;
		this.each(function (i) { rval = fun.call(this, rval, i) });
		return rval;
	},

	/* function Enumerator.prototype.max ([fun]) //=> any
	 *
	 * If you want to take max value of some numbers,
	 * you should use Math.max.
	 *
	 * Code:
	 *     E(1, 5, 3).max(); //=> 5
	 *     E({k:1}, {k:5}, {k:3}).max(function (a, b) {
	 *         return a.k - b.k;
	 *     });
	 *     //=> ({k:5})
	 *
	 * Receiver must be finite.
	 */
	max : function (fun) {
		if (!fun) fun = function (a, b) { return a - b };
		var t =  this.toArray().sort(fun);
		return t[t.length-1];
	},

	/* function Enumerator.prototype.min ([fun]) //=> any
	 *
	 * If you want to take max value of some numbers,
	 * you should use Math.max.
	 *
	 * Code:
	 *     E(1, 5, 3).min(); //=> 1
	 *
	 * Receiver must be finite.
	 */
	min : function (fun) {
		if (!fun) fun = function (a, b) { return a - b };
		var t =  this.toArray().sort(fun);
		return t[0];
	},

	/* function Enumerator.prototype.chain (enum [, enum...]) //=> Enumerator
	 *
	 * Chain some Enumerator to one;
	 *
	 * Code:
	 *     E(1, 2, 3).chain(E(4, 5, 6)).toArray(); //=> [1, 2, 3, 4, 5, 6]
	 *
	 */
	chain : function (enums) {
		var f = this, a = Enumerator(arguments).imap(function (i) {
			return Enumerator(i);
		});
		return Enumerator(function () {
			try {
				return f.next();
			} catch (e) {
				if (e != Enumerator.StopIteration) throw e;
				f = a.next();
				return f.next();
			}
		});
	},

	/* function Enumerator.prototype.itake (n) //=> Enumerator
	 *
	 * Take `n` values from first of receiver and return Enumerator.
	 *
	 * Code:
	 *     E().countup().itake(10).drop(2); //=> [2, 3, 4, 5, 6, 7, 8, 9]
	 *
	 */
	itake : function (a) {
		var self = this;
		if (typeof(a) == "number") { // take
			var i = 0;
			return Enumerator(function () {
				if (i++ < a)
					return self.next();
				else
					throw Enumerator.StopIteration;
			});
		} else
		if (typeof(a) == "function") { // takewhile
			return Enumerator(function () {
				var ret = self.next();
				if (a[a.length > 1 ? "apply" : "call"](this, ret))
					return ret;
				else
					throw Enumerator.StopIteration;
			});
		}
		throw ArgumentErrro("expect number or function");
	},


	/* function Enumerator.prototype.take (n) //=> Array
	 *
	 * Take `n` values from the first of receiver and return Array.
	 *
	 * Receiver must be finite.
	 */
	take : function (a) {
		return this.itake(a).toArray();
	},

	/* function Enumerator.prototype.idrop (n) //=> Enumerator
	 *
	 * Drop `n` values from the first of receiver and return Enumerator.
	 *
	 * Code:
	 *     E().countup().idrop(2).take(10); //=> [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
	 */
	idrop : function (a) {
		var self = this, i;
		if (typeof(a) == "number") {   // drop
			for (i = 0; i < a; i++) this.next();
			return this;
		} else
		if (typeof(a) == "function") { // dropwhile
			while (a[a.length > 1 ? "apply" : "call"](this, i = this.next())) {}
			return Enumerator(function () {
				this.next = self.next;
				return i;
			});
		}
		throw ArgumentErrro("expect number or function");
	},

	/* function Enumerator.prototype.drop (n) //=> Array
	 *
	 * Drop `n` values from the first of receivera and return Array.
	 *
	 * Code:
	 *     E().countup().itake(10).drop(5); //=> [5, 6, 7, 8, 9]
	 *
	 * Receiver must be finite.
	 */
	drop : function (a) {
		return this.idrop(a).toArray();
	},

	/* function Enumerator.prototype.every (fun) //=> Boolean
	 *
	 * Evaluate `fun` with the items and when every items are all true,
	 * this function returns true.
	 * (Actually, this function returns false immediately if `fun` returns false.)
	 * You may also know this as `all`.
	 *
	 * Code:
	 *     E(1, 1, 1).every(function (i) { return i == 1 }); //=> true
	 *     E(1, 1, 0).every(function (i) { return i == 1 }); //=> false
	 *
	 * Receiver must be finite.
	 */
	every : function (fun) {
		try {
			while (!(fun[fun.length > 1 ? "apply" : "call"](this, this.next()) === false)) {}
			return false;
		} catch (e) {
			if (e != Enumerator.StopIteration) throw e;
			return true;
		}
	},

	/* function Enumerator.prototype.some (fun) //=> Boolean
	 *
	 * Evaluate `fun` with the items and some items return true,
	 * this function returns true.
	 * (Actually, this function returns true immediately if `fun` returns true.)
	 * You may also know this as `any`.
	 *
	 * Code:
	 *     E(0, 1, 0).some(function (i) { return i == 1 }); //=> true
	 *     E(0, 0, 0).some(function (i) { return i == 1 }); //=> false
	 *
	 * Receiver must be finite.
	 */
	some : function (fun) {
		try {
			while (!(fun[fun.length > 1 ? "apply" : "call"](this, this.next()) === true)) {}
			return true;
		} catch (e) {
			if (e != Enumerator.StopIteration) throw e;
			return false;
		}
	},

	/* function Enumerator.prototype.withIndex ([start=0]) //=> Enumerator
	 *
	 * Return Enumerator of list which has receiver item and index.
	 *
	 * Code:
	 *     E("a", "b", "c").withIndex().each(function (item, index) {
	 *         log(item);  // a, b, c
	 *         log(index); // 0, 1, 2
	 *     });
	 */
	withIndex : function (start) {
		return this.izip(E(start || 0).countup());
	},

	/* function Enumerator.prototype.countup ([n=0]) //=> Enumerator
	 *
	 * Returns infinite list start with `n`.
	 *
	 * Code:
	 *     E().countup().take(3);   //=> [0, 1, 2]
	 *     E(10).countup().take(3); //=> [10, 11, 12]
	 */
	countup : function () {
		var start = this.next() || 0;
		return Enumerator(function () { return start++ });
	},

	/* function Enumerator.prototype.stop () //=> throw Enumerator.StopIteration
	 *
	 * This is a convenient function for stop iteration.
	 *
	 * Code:
	 *    E(1, 2, 3).map(function (i) {
	 *        if (i == 2) this.stop();
	 *    });
	 *    //=> [1, 2]
	 *
	 */
	stop : function () {
		throw Enumerator.StopIteration;
	}
};

Enumerator.prototype.to_a    = Enumerator.prototype.toArray;
Enumerator.prototype.each    = Enumerator.prototype.map;
Enumerator.prototype.inject  = Enumerator.prototype.reduce;
Enumerator.prototype.ifilter = Enumerator.prototype.iselect;
Enumerator.StopIteration     = new Error("StopIteration");
this.Enumerator = Enumerator;


