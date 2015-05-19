define(function (require, exports, module) {
	var Scroll = require('Scroll');

		function ajax (url, parms) {
			parms = parms || {};
			var req = new XMLHttpRequest(),
				post = parms.post || null,
				callback = parms.callback || null,
				timeout = parms.timeout || null;

			req.onreadystatechange = function () {
				if ( req.readyState != 4 ) return;

				// Error
				if ( req.status != 200 && req.status != 304 ) {
					if ( callback ) callback(false);
					return;
				}

				if ( callback ) callback(req.responseText);
			};

			if ( post ) {
				req.open('POST', url, true);
				req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			} else {
				req.open('GET', url, true);
			}

			req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');


			req.send(post);

			if ( timeout ) {
				setTimeout(function () {
					req.onreadystatechange = function () {};
					req.abort();
					if ( callback ) callback(false);
				}, timeout);
			}
		}
		/*
		 *****************************************************************************/

		//var myScroll;

		function loaded2 () {
			var myScroll344 = new Scroll('#wrapper', {
				useTransition: false,
				useTransform: true,
				mouseWheel: true,
				infiniteElements: '#scroller .rows',
				infiniteLimit: 2000,
				infiniteType: "differ",
				dataset: requestData,
				dataFiller: updateContent,
				deceleration: 0.003,
				cacheSize: 1000,
				preventDefault: false,
				speedLimit: 3,
				scrollbars: true
				// shrinkScrollbars: 'scale'
			});
		}

		function requestData (start, callback) {
			var count = 1000;
			ajax('dataset_ranking.php?start=' + start + '&count=' + count, {
				callback: function (data) {
					data = JSON.parse(data);
					callback(data)
				}
			});
		}

		var fragment;
		function updateContent (el, data) {

			//el.innerHTML = data;

			// var oldEl = el.children[0];

			// var newEl = oldEl.cloneNode(false);  
		 //    newEl.innerHTML = data;  
		 //    el.replaceChild(newEl, oldEl);  
		}

		

		document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

		return {
			start: loaded2
		}

})