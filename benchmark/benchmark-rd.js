function benchmark (name, set) {
	Deferred.register("benchmark", benchmark);

	var results = [];

	var set = E(set);

	var dummyfun = function () {
		var start = (new Date()).getTime();

		var dummy = 0;
		for (var i = 0; i < 10000; i++) {
			document.getElementsByTagName("html");
			dummy++;
			dummy--;
		}
		var stop  = (new Date()).getTime();
		return stop - start;
	};

	var constant_dummy = [];
	var logger = benchmark.logger;
	return next(function () {
		logger.log("Prepare... " + name);
	}).
//	loop(9, function () {
//		// 誤差判定用に何回かダミーを実行し中央値をとっておき、
//		// 各プロセス毎にこれを実行しなおし、大きく離れていたら再計測する。
//		// (殆ど Opera 用)
//		constant_dummy.push(dummyfun());
//	}).
//	next(function () {
//		constant_dummy = constant_dummy.sort(function (a, b) {
//			return a - b;
//		})[Math.floor(constant_dummy.length / 2)];
//		logger.log("constant (for detecting error):" + constant_dummy);
//	}).
	next(function () {
		function calc (descfun) {
			var desc = descfun[0];
			var func = descfun[1];

			logger.log('.');
			logger.log('*** ' + desc + ' ***');

			try {
				var times = 1;
				while (true) {
					var start = new Date().getTime();
					for (var i = 0; i < times; i ++) func();
					var stop = new Date().getTime();
					if ((stop - start) > 100) break; else times *= 10;
				}
				var t  = (stop - start) / times;
				var bc = benchmark.benchCost();
				var tm = benchmark.timeCost() / times;
				logger.log('result : ' + (t - (bc + tm)) + '[ms]');

//				if (Math.abs(dummyfun() - constant_dummy) > constant_dummy / 10) {
//					logger.log('detect some error. retry this test');
//					return call(arguments.callee, descfun);
//				}

				results.push({
					desc : desc,
					func : func,
					time : t - (bc + tm)
				});
			} catch (e) {
				results.push({
					desc : desc + " Error(" + e + ")",
					func : func,
					time : 9999
				});
			}

			return call(arguments.callee, set.next());
		}

		return call(calc, set.next());
	}).
	error(function (e) {
		if (e != Enumerator.StopIteration) throw e;
	}).
	next(function () {
		logger.clear();
	}).
	next(function () {
		var max = results.sort(function (a, b) {
			return b.time - a.time;
		})[0];
		results.reverse();

		// show results with table
		var table = document.createElement("table");
		var tbody = document.createElement("tbody");
		var capti = document.createElement("caption");
		capti.appendChild(document.createTextNode(name));
		table.appendChild(capti);

		var s = table.style;
		s.border = "2px solid #000";
		s.width  = "100%";
		for (var i = 0; i < results.length; i++) {
			var r = results[i];
			var tr = document.createElement("tr");

			var td_desc = document.createElement("td");
			td_desc.style.width = "20em";
			td_desc.appendChild(document.createTextNode(r.desc));
			tr.appendChild(td_desc);

//			var td_func = document.createElement("td");
//			var pr_func = document.createElement("pre");
//			var func    = r.func.toString().replace(/^function\s*\(.*\)\s*\{|\s*\}\s*$/g, "");
//			func = func.replace(RegExp("^"+func.match(/^([\t ]+)/m)[1], "gm"), "");
//			pr_func.appendChild(document.createTextNode(func));
//			td_func.style.width    = "20em";
//			pr_func.style.width    = "100%";
//			pr_func.style.overflow = "auto";
//			td_func.appendChild(pr_func);
//			tr.appendChild(td_func);

			var td_time = document.createElement("td");
			var sp_time = document.createElement("div");
			sp_time.appendChild(document.createTextNode(r.time));
			sp_time.style.width      = ((r.time / max.time) * 100) + "%";
			sp_time.style.background = "#ccc";
			sp_time.style.padding    = "0.5em 0.5em";
			sp_time.style.border     = "1px solid #000";
			sp_time.style.margin     = "-0.5em";
			td_time.appendChild(sp_time);

			tr.appendChild(td_time);

			tbody.appendChild(tr);
		}
		table.appendChild(tbody);
		document.body.appendChild(table);
	}).
	error(function (e) {
		alert(e);
	});
}
benchmark.benchCost = function () {
	if (arguments.callee.cost) return arguments.callee.cost;

	var dummyfun = function () { };
	var dummyvar = null;

	var times = 1;
	while (true) {
		var start = new Date().getTime();
		for (var i = 0; i < times; i++) {
			dummyfun();
		}
		var stop = new Date().getTime();
		if ((stop - start) > 50) break; else times *= 10;
	}
	arguments.callee.cost = (stop - start) / times;
	return arguments.callee.cost;
};
benchmark.timeCost = function () {
	if (arguments.callee.cost) return arguments.callee.cost;

	var dummyfun = function () { };
	var dummyvar = null;

	var times = 1;
	while (true) {
		var start = new Date().getTime();
		for (var i = 0; i < times; i++) new Date().getTime();
		var stop = new Date().getTime();
		if ((stop - start) > 50) break; else times *= 10;
	}
	arguments.callee.cost = (stop - start) / times;
	return arguments.callee.cost;
};
benchmark.logger = {
	init : function () {
		if (!this.parent) {
			this.parent = document.createElement("div");
			this.parent.style.border     = "2px solid #000";
			this.parent.style.background = "#fff";
			this.parent.style.overflow   = "auto";
			this.parent.style.position   = "absolute";
			this.parent.style.padding    = "0.5em";
			this.parent.style.bottom     = "0";
			this.parent.style.right      = "0";
			this.parent.style.width      = "30em";
			this.parent.style.height     = "25%";
			document.body.appendChild(this.parent);
		}
	},

	log : function (m) {
		this.init();
		var div = document.createElement("div");
		div.appendChild(document.createTextNode(m));
		this.parent.scrollOffset =  this.parent.scrollHeight;
		this.parent.style.display = "block";
		this.parent.insertBefore(div, this.parent.firstChild);
		if (window.console) console.log(m);
	},

	clear : function () {
		while (this.parent.firstChild) this.parent.removeChild(this.parent.firstChild);
		this.parent.style.display = "none";
	}
};
