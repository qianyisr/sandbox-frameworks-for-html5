define(function (require, exports, module) {
	var $ = require('Jquery');
	var PicLoader = require('PicLoader');
	var Scroll = require('Scroll');


	window.myScroll;
	var once = 0;
	var picQueue = [];

	var infiniteElements = document.querySelectorAll("#scroller dl");
	var _infiniteElements = {};
	var infiniteElementsLength = infiniteElements.length - 1;

	for (var i = infiniteElementsLength; i >= 0; i--) {
		var el = $(infiniteElements[i]);
		var banner = el.find('.banner');
		var icons = el.find('.icon');

		_infiniteElements[i] = {
			el : el,
			banner : banner,
			icons : icons
		}
	};

	delete el, banner, icons

	var loader = new PicLoader(function (e) {

		    if ( e ) {
		    	arguments[1].el.style.backgroundImage = "url('" + arguments[1].src + "')";
		    } else {
		    	arguments[1].el.style.backgroundImage = "none";
		    }

   		}).limit(3);

	function picLoaded () {
		picQueue = picQueue.slice((-1 - infiniteElementsLength) * 3);

		for ( var i = 0, l = picQueue.length - 1; i <= l; i++ ) {

	        loader.add({
	        	el: picQueue[i].el,
	        	src: picQueue[i].images
	        })
		        
		}

		picQueue = [];

		loader.start();
		
	}

	function start () {
		var flipStop = false;
		var fliped = [];

		myScroll = new Scroll('#grid', {
			useTransition: true,
			mouseWheel: true,
			keyBindings: true,
			infiniteElements: infiniteElements,
			infiniteLimit: 2000,
			infiniteType: "differ",
			scrollY: true,
			scrollX: false,
			dataset: requestData,
			dataFiller: updateContent,
			deceleration: 0.003,
			infiniteCacheBuffer: 200,
			speedLimit: 6,
			preventDefault: false
		})

		myScroll.on('beforeScrollStart', function () {
			flipStop = true;
			loader.stop().clear();

			if ( fliped.length ) {
				_infiniteElements[fliped[0].id].el.className = "cl";

				if ( fliped[0].type == "banner" ) {
					_infiniteElements[fliped[0].id]["banner"][0].className = "banner";
				} else if ( fliped[0].type == "icon1" ) {
					_infiniteElements[fliped[0].id]["icons"][0].className = "icon";
				} else if ( fliped[0].type == "icon2" ) {
					_infiniteElements[fliped[0].id]["icons"][1].className = "icon";
				}

				fliped = [];
			}
		})

		myScroll.on('infiniteCachedReady', function () {
			document.getElementById('grid').style.visibility = "visible";
		})

		myScroll.on('scrollEnd infiniteCachedReady', function () {
			if ( arguments[0] == "break" ) return;

			picLoaded();

			flipStop = false;

			function step () {
				var i = Math.round(Math.random()*infiniteElementsLength);
				var time = Math.round(Math.random()*1000);

				setTimeout(function () {
					if ( flipStop == true ) return;
					var n = Math.round(Math.random()*3);

					if ( fliped.length ) {
						_infiniteElements[fliped[0].id].el.className = "cl";
					}

					_infiniteElements[i].el.className = "cl viewport-flip";

					fliped = [];

					if ( n == 1 ) {
						if ( _infiniteElements[i].banner[0].getAttribute("data-flip") != "true" ) {
							_infiniteElements[i].banner[0].className = "banner flip front";
							_infiniteElements[i].banner[0].setAttribute("data-flip", "true");
						} else {
							_infiniteElements[i].banner[0].className = "banner flip back";
							_infiniteElements[i].banner[0].setAttribute("data-flip", "true");
						}
						fliped.push({
							id : i,
							type : "banner"
						});
					} else if ( n == 2 ) {
						if ( _infiniteElements[i].icons[0].getAttribute("data-flip") != "true" ) {
							_infiniteElements[i].icons[0].className = "icon flip front";
							_infiniteElements[i].icons[0].setAttribute("data-flip", "true");
						} else {
							_infiniteElements[i].icons[0].className = "icon flip back";
							_infiniteElements[i].icons[0].setAttribute("data-flip", "true");
						}
						fliped.push({
							id : i,
							type : "icon1"
						});
					} else if ( n == 3 ) {
						if ( _infiniteElements[i].icons[1].getAttribute("data-flip") != "true" ) {
							_infiniteElements[i].icons[1].className = "icon flip front";
							_infiniteElements[i].icons[1].setAttribute("data-flip", "true");
						} else {
							_infiniteElements[i].icons[1].className = "icon flip back";
							_infiniteElements[i].icons[1].setAttribute("data-flip", "true");
						}
						fliped.push({
							id : i,
							type : "icon2"
						});
					}

					step();
				}, time)
				
			}

			step();
		})
	}

	function requestData (start, callback) {
		var count = 1000;
		$.ajax({
			url : 'dataset.php?start=' + start + '&count=' + count,
			success: function (data) {
				data = JSON.parse(data);
				callback(data)
			}
		})
	}

	function updateContent (el, data) {
		var index = el._index;
		var banner = _infiniteElements[el._index].banner[0];
		var icon_1 = _infiniteElements[el._index].icons[0];
		var icon_2 = _infiniteElements[el._index].icons[1];
		var images = data.split(',');

		var queue = [];

		if ( loader.isCached(images[0]) ) {
			banner.style.backgroundImage = "url(" + images[0] + ")";
		} else {
			banner.style.backgroundImage = "none";
			queue.push({
				el : banner,
				images : images[0]
			})
		}

		if ( loader.isCached(images[1]) ) {
			icon_1.style.backgroundImage = "url(" + images[1] + ")";
		} else {
			icon_1.style.backgroundImage = "none";
			queue.push({
				el : icon_1,
				images : images[1]
			})
		}

		if ( loader.isCached(images[2]) ) {
			icon_2.style.backgroundImage = "url(" + images[2] + ")";
		} else {
			icon_2.style.backgroundImage = "none";
			queue.push({
				el : icon_2,
				images : images[2]
			})
		}

		picQueue = picQueue.concat(queue);

	}

	

	document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

	return {
		start: start
	}

})