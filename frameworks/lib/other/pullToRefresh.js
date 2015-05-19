(function( $ ) {

	$.fn.pullToRefresh = function (options) {

		var isTouch = !!('ontouchstart' in window),
			cfg = $.extend({
				message: {
					pull: 'Pull to refresh',
					release: 'Release to refresh',
					loading: $_LANG['Loading'],
					noMore: $_LANG['noMore']
				},
				scroller: false,
				preload: 500 //预先载入的长度
			}, options);

		var moduleId = cfg.moduleId,
			moduleWindow = cfg.window,
			module = $_MODULE[moduleId];

		var	preload = cfg.preload || 0;

		var _startPull;
		var _closePull;
		var pull = {};
		var touch = {};
		var start = {};
		var to = 0;
		var pullPos = 0;
		var bounce = 0;
		var scrollPos = 0;
		var pullDown = this.find('#pullDown'),
			pullDownHeight = pullDown.height(),
			pullDownLabel = pullDown.find('.pullDownLabel'),
			pullDownCanvas = pullDown.find('.pullDownCanvas'),
			pullDownCanvasColor = pullDownCanvas.css("color"),
			pullUp = this.find('#pullUp'),
			pullUpHeight = pullUp.height(),
			pullUpLabel = pullUp.find('.pullUpLabel'),
			pullUpCanvas = pullUp.find('.pullUpCanvas'),
			pullUpCanvasColor = pullUpCanvas.css("color");

		var target = this;
		var that = target[0];
		var screenHeight = moduleWindow.innerHeight;

		function translate(slide, dist, speed) {

		    var style = slide && slide.style;

		    if (!style) return;

		    style.webkitTransitionDuration = 
		    style.MozTransitionDuration = 
		    style.msTransitionDuration = 
		    style.OTransitionDuration = 
		    style.transitionDuration = speed + 'ms';

		    style.webkitTransform = 'translate(0,' + dist + 'px)' + 'translateZ(0)';
		    style.msTransform = 
		    style.MozTransform = 
		    style.OTransform = 'translateY(' + dist + 'px)';

		    pullPos = dist;

		}

		/**
		 * 实现下拉刷新 ===============================================================
		 * 对目标模型touch事件的处理
		 * 实现下拉刷新和动画阻力
		*/

		if ($_UI.feat.iscroll && $_UI.rate == 'speed') {

			_closePull = function(type) {
				switch(type) {
					case 1:
						to = 0;
						translate(that, to, 300);
						break;
					case 2:
						break;
				}
			};

			$(moduleWindow).bind('_complete', function() {

				moduleWindow.windowScroll.on('scrollEnd', function() {

					if (this.startY > $.fn.dipToPx(40)) {
						bounce = 1;
					} else if (Math.abs(this.startY-screenHeight) >= that.offsetHeight - preload) {
						bounce = 2;
						if (Math.abs(this.startY-screenHeight) >= that.offsetHeight) {
							pull.bounceBorder = true;
						} else {
							pull.bounceBorder = false;
						}
					} else {
						bounce = 0;
					}

					switch(bounce) {
						case 0:
							break;
						case 1:
							if (this.endTime - this.startTime > 30 && to == 0) {
								to = parseInt(pullDownHeight); 
								translate(that, to, 300);

								moduleWindow.pullDownAction(that, 1);
							}
							break;
						case 2:
							if (this.endTime - this.startTime > 30 && to == 0) {
								
								if (preload == 0 || pull.bounceBorder == true) {
									to = -Math.abs(parseInt(that.offsetHeight)-parseInt(screenHeight)+parseInt(pullUpHeight));
									translate(that, to, 300);
								}
								moduleWindow.pullUpAction(that, 2);
							}
							break;
					}

					//取消清除锁定
					if (_startPull) clearTimeout(_startPull);
					//过时清除锁定
					_startPull = setTimeout(function(){
						to = 0;
					}, 1000);

				});
			})

		} else {

			_closePull = function() {
				to = 0;
				translate(that, to, 300);
			};

			target.on('touchstart', function (event) {

				var touches = event.touches[0];

				// 测量起始值
				start = {

					// 获得初始触摸坐标
					x : touches.pageX,
					y : touches.pageY,

					pos : pullPos,
					top : target.offset().top,
					height : target.height(),

					// 记录时间来确定触摸持续时间
					time : +new Date

				};

				if ($_UI.rate == 'lower') {
					start.top = -document.body.scrollTop;
				}

			}).on('touchmove', function (event) {

				var touches = event.touches[0];

				// 测量改变x和y
				delta = {
					x : touches.pageX - start.x,
					y : touches.pageY - start.y
				};

				if (start.top >= 0 && delta.y > 0) {

					bounce = 1;

					event.preventDefault();
					delta.y = start.pos + delta.y / ( Math.abs(delta.y) / screenHeight + 2 );
					translate(this, delta.y, 0);

				} else if (Math.abs(start.top-screenHeight) >= (start.height - preload) && delta.y < 0) {

					bounce = 2;
					/* 如果不做预载入，则执行pull动画 */
					if (preload == 0 || Math.abs(start.top-screenHeight) >= start.height) {
						event.preventDefault();
						delta.y = start.pos + delta.y / ( Math.abs(delta.y) / screenHeight + 2 );
						translate(this, delta.y, 0);

						isPull = true; //触发了边缘pull

					} else {

						isPull = false; //未触发边缘化pull加载动画

					}

				} else {

					bounce = 0;

				}

			}).on('touchend', function (event) {

				switch(bounce) {
					case 0:
						break;
					case 1:
						if (+new Date - start.time > 60 && delta.y > 50 && to == 0) {
							to = parseInt(pullDownHeight); 
							translate(this, to, 600);

							moduleWindow.pullDownAction(this);
						}
						break;
					case 2:
						if (+new Date - start.time > 60 && delta.y < -50 && to == 0) {

							/* 如果不做预载入，则执行pull动画 */
							if (preload == 0 || isPull) {
								to = parseInt(-pullUpHeight);
								translate(this, to, 600);
							}

							moduleWindow.pullUpAction(this);
						}
						break;
				}

				//取消清除锁定
				if (_startPull) clearTimeout(_startPull);
				//过时清除锁定
				_startPull = setTimeout(function(){
					to = 0;
				}, 3000);

			});

		}


		/**
		 * 通用下拉刷新处理方案 =============================================================
		 * 是否是选择默认的处理类型
		 * 事件出发后对目标模型更新数据
		 */
		if (module.pullToRefresh.type == 'common') {

			//错误类型预处理
			$(window).on('_error', function (event) {
				switch(event.data) {
					case -4:
						clearInterval(window._loader[moduleId + "_pullUpCanvas"]);
						pullUp.removeClass('loading');
						pullUpLabel.html(cfg.message.noMore);
						break;
					default:
						hideLoading();
						break;
				}
			});

			var hideLoading = function(type) {
				_closePull(type);
				pullDownCanvas.hideLoading(moduleId);
				pullDown.removeClass('loading');
			};

			moduleWindow.pullDownAction = function (pullTarget, type) {
				
				pullDown.addClass('loading');

				function showLoading() {

					var size = pullDownCanvas.width();
					var opts = {
			            shape: "roundRect",
			            diameter: size,
			            density: 12,
			            speed: 1,
			            FPS: 12,
			            range: 0.95,
			            color: "#999999"
			        };

			        pullDownCanvas.showLoading(moduleId, opts);

				}

				var loader = window._loaders[moduleId];
				if (!loader) showLoading();

				if (!moduleWindow.pullDownupdate) {

					setTimeout(function() {
						hideLoading(type);
					}, 1000);

				} else {

					moduleWindow.pullDownupdate(function() {
						hideLoading();
					});

				}

			};

			moduleWindow.pullUpAction = function (pullTarget, type) {
					
				pullUp.addClass('loading');

				function showLoading() {

					var size = pullUpCanvas.width();
					var opts = {
			            shape: "roundRect",
			            diameter: size,
			            density: 12,
			            speed: 1,
			            FPS: 12,
			            range: 0.95,
			            color: "#999999"
			        };

			        pullUpCanvas.showLoading(moduleId, opts);

				}

				var loader = window._loaders[moduleId];
				if (!loader) showLoading();


				if (!moduleWindow.pullUpUpdate) {

					var success = function() {
						hideLoading(type);
					};

					var page = (module.pageNum || 0) + 1;

					var includeOpts = {
		                "cacheId" : moduleId,
		                "path" : module.pullToRefresh.source || module.source,
		                "async" : module.pullToRefresh.data || module.data,
		                "param" : [(module.param[0] || '') + (module.pullToRefresh.param || "?page=") + page],
		                "layout" : 0,
		                "iframe" : "update",
		                "update" : 1,
		                "worker" : module.worker,
		                "callback": function(html) {

		                	moduleWindow.$$(updateTarget, "self").append(html);

		                    page++;
		                    module.pageNum = page;
		                    
		                    moduleWindow._loading = 0;

		                    success();

		                    if (cfg.callback) cfg.callback();

		                }
		            };

		            $_DATA[moduleId].ajax = {
		                "page": page
		            };

		            includeOpts.async.push("ajax");

		            var updateTarget = module.pullToRefresh.target;

		            moduleWindow._loading = 1;
		            $.fn.include(includeOpts);

		        } else {

		        	moduleWindow.pullUpUpdate(function() {
						hideLoading();
					});

		        }

			};
		}


	};

})(IO);
