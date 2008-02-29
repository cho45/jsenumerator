
Deferred.define();
E = Enumerator;

LOOP = 1000;


benchmark("10element loop", {
	"for" : function () {
		var list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		for (var i = 0; i < LOOP; i++) {
			list[i];
		}
	},

	"MochiKit forEach" : function () {
		var list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		for (var i = 0; i < LOOP; i++) {
			forEach(list, function (i) {
				i;
			});
		}
	},

	"jQuery each" : function () {
		var list = E(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
		for (var i = 0; i < LOOP; i++) {
			jQuery.each(list, function (i) {
				i;
			});
		}
	},

	"prototype.js Array#each" : function () {
		var list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		for (var i = 0; i < LOOP; i++) {
			list.each(function (i) {
				i;
			});
		}
	},

	"JSEnumerator each" : function () {
		var list = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		for (var i = 0; i < LOOP; i++) {
			E(list).each(function (i) {
				i;
			});
		}
	}
}).
benchmark("cycle and imap and toArray", {
	"MochiKit" : function () {
		var i = MochiKit.Iter;
		var b = MochiKit.Base;
		for (var l = 0; l < LOOP; l++) {
			var results = list(
				islice(
					i.imap(
						function (t) {
							return t * t;
						}, i.cycle([1, 2, 3])
					),
					20
				)
			);
		}
	},

	"JSEnumerator" : function () {
		for (var l = 0; l < LOOP; l++) {
			var results = E(1, 2, 3).cycle().imap(function (t) {
				return t * t;
			}).take(20);
		}
	}
}).
benchmark("reduce", {
	"MochiKit (reduce only)" : function () {
		var i = MochiKit.Iter;
		var b = MochiKit.Base;
		for (var l = 0; l < LOOP; l++) {
			var results = reduce(
				function (r, i) {
					return r + i;
				},
				[1, 2, 3]
			);
		}
	},

	"JSEnumerator (reduce only)" : function () {
		for (var l = 0; l < LOOP; l++) {
			var results = E(1, 2, 3).reduce(function (r, i) {
				return r + i;
			});
		}
	},
	"MochiKit (reduce/islice/count)" : function () {
		var i = MochiKit.Iter;
		var b = MochiKit.Base;
		for (var l = 0; l < LOOP; l++) {
			var results = reduce(
				function (r, i) {
					return r + i;
				},
				islice(count(1), 3)
			);
		}
	},

	"JSEnumerator (countup.itake.reduce)" : function () {
		for (var l = 0; l < LOOP; l++) {
			var results = E(1).countup().itake(3).reduce(function (r, i) {
				return r + i;
			});
		}
	}
}).
benchmark("map", {
	"MochiKit" : function () {
		var b = MochiKit.Base;
		for (var l = 0; l < LOOP; l++) {
			var results =  b.map(
				function (t) {
					return t * t;
				},
				[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
			);
		}
	},

	"prototype.js" : function () {
		for (var l = 0; l < LOOP; l++) {
			var results = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (t) {
				return t * t;
			});
		}
	},

	"jQuery" : function () {
		for (var l = 0; l < LOOP; l++) {
			var results = jQuery.map([1, 2, 3, 4, 5, 6, 7, 8, 9], function (t) {
				return t * t;
			});
		}
	},

	"JSEnumerator" : function () {
		for (var l = 0; l < LOOP; l++) {
			var results = E(1, 2, 3, 4, 5, 6, 7, 8, 9).map(function (t) {
				return t * t;
			});
		}
	}
}).
next(function () {
	"end"
});
