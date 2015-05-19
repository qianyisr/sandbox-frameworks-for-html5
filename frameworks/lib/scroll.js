define(function (require, exports, module) {
	return (function (window, document, Math) {
		'use strict';
		var $ = require("Jquery"),
			device = require("Device");

		var browser = {
	          	touch           : device.feat.touch,
	          	isBadTransition : device.feat.isBadTransition,
	          	feat            : {
	          						hasObserver: device.feat.observer,
	                                hasTransform: device.feat.prefixStyle('transform') !== false,
									hasPerspective: device.feat.prefixStyle('perspective'),
									hasTouch: device.feat.touch,
									hasPointer: navigator.msPointerEnabled,
									hasTransition: device.feat.prefixStyle('transition')
	                              },
	            prefixStyle 	: {
						           	transform: device.feat.prefixStyle('transform'),
						           	transition: device.feat.prefixStyle('transition'),
									transitionTimingFunction: device.feat.prefixStyle('transitionTimingFunction'),
									transitionDuration: device.feat.prefixStyle('transitionDuration'),
									transitionDelay: device.feat.prefixStyle('transitionDelay'),
									transformOrigin: device.feat.prefixStyle('transformOrigin')
						          }
	        };

		var utils = (function () {

			var self = {};

			self.prefixStyle = device.feat.prefixStyle;

			self.getTime = Date.now || function getTime () { return new Date().getTime(); };

			self.extend = function (target, obj) {
				for ( var i in obj ) {
					target[i] = obj[i];
				}
			};

			self.addEvent = function (el, type, fn, capture) {
				el.addEventListener(type, fn, !!capture);
			};

			self.removeEvent = function (el, type, fn, capture) {
				el.removeEventListener(type, fn, !!capture);
			};

			self.momentum = function (current, start, time, lowerMargin, wrapperSize, deceleration, acceleration, speedLimit) {
				var distance = (current - start),
					speed = Math.min(Math.abs(distance) / time, speedLimit),
					destination,
					duration;

				destination = current + ( speed * speed ) / deceleration * Math.min(.5 + acceleration, 1) * ( distance < 0 ? -1 : 1 );
				duration = speed / deceleration;

				if ( destination < lowerMargin ) {
					destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin;
					distance = Math.abs(destination - current);
					duration = distance / speed;
				} else if ( destination > 0 ) {
					destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0;
					distance = Math.abs(current) + destination;
					duration = distance / speed;
				}

				return {
					destination: Math.round(destination),
					duration: Math.max(duration, 300)
				};
			};

			self.scale = function (px) {
				return px*device.ui.scale;
			};

			self.offset = function (el) {
				var left = -el.offsetLeft,
					top = -el.offsetTop;

				// jshint -W084
				while (el = el.offsetParent) {
					left -= el.offsetLeft;
					top -= el.offsetTop;
				}
				// jshint +W084

				return {
					left: left,
					top: top
				};
			};

			self.preventDefaultException = function (el, exceptions) {
				for ( var i in exceptions ) {
					if ( exceptions[i].test(el[i]) ) {
						return true;
					}
				}

				return false;
			};

			self.extend(self.eventType = {}, {
				touchstart: 1,
				touchmove: 1,
				touchend: 1,

				mousedown: 2,
				mousemove: 2,
				mouseup: 2,

				MSPointerDown: 3,
				MSPointerMove: 3,
				MSPointerUp: 3
			});

			self.extend(self.ease = {}, {
				quadratic: {
					style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
					fn: function (k) {
						return k * ( 2 - k );
					}
				},
				circular: {
					style: 'cubic-bezier(0.1, 0.1, 0.1, 1)',	// cubic-bezier(0.1, 0.57, 0.1, 1) : Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
					fn: function (k) {
						return Math.sqrt( 1 - ( --k * k ) );
					}
				},
				back: {
					style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
					fn: function (k) {
						var b = 4;
						return ( k = k - 1 ) * k * ( ( b + 1 ) * k + b ) + 1;
					}
				},
				bounce: {
					style: '',
					fn: function (k) {
						if ( ( k /= 1 ) < ( 1 / 2.75 ) ) {
							return 7.5625 * k * k;
						} else if ( k < ( 2 / 2.75 ) ) {
							return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
						} else if ( k < ( 2.5 / 2.75 ) ) {
							return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
						} else {
							return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
						}
					}
				},
				elastic: {
					style: '',
					fn: function (k) {
						var f = 0.22,
							e = 0.4;

						if ( k === 0 ) { return 0; }
						if ( k == 1 ) { return 1; }

						return ( e * Math.pow( 2, - 10 * k ) * Math.sin( ( k - f / 4 ) * ( 2 * Math.PI ) / f ) + 1 );
					}
				}
			});

			self.tap = function (e, eventName) {
				var ev = document.createEvent('Event');
				ev.initEvent(eventName, true, true);
				ev.pageX = e.pageX;
				ev.pageY = e.pageY;
				e.target.dispatchEvent(ev);
			};

			self.click = function (e) {
				var target = e.target,
					ev;

				if ( !(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName) ) {
					ev = document.createEvent('MouseEvents');
					ev.initMouseEvent('click', true, true, e.view, 1,
						target.screenX, target.screenY, target.clientX, target.clientY,
						e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
						0, null);

					ev._constructed = true;
					target.dispatchEvent(ev);
				}
			};

			return self;
		})();

		function Scroll (el, options) {
			this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
			this.scroller = this.wrapper.children[0];
			this.scrollerStyle = this.scroller.style;		// cache style for better performance

			this.options = {

				resizeScrollbars: true,

				mouseWheelSpeed: 20,

				snapThreshold: 0.15,

				infiniteType: 'equal',

				infiniteUseTransform: true,

				infiniteCacheBuffer: 100,

				deceleration: 0.003,

				speedLimit: 3,

		// INSERT POINT: OPTIONS 

				startX: 0,
				startY: 0,
				scrollY: true,
				directionLockThreshold: 5,
				momentum: true,

				bounce: true,
				bounceTime: 600,
				bounceEasing: '',

				preventDefault: true,
				preventDefaultException: { tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/ },

				HWCompositing: true,
				useTransition: true,
				useTransform: true
			};

			for ( var i in options ) {
				this.options[i] = options[i];
			}

			// Normalize options
			this.translateZ = this.options.HWCompositing && browser.feat.hasPerspective ? ' translateZ(0)' : '';

			this.options.useTransition = browser.feat.hasTransition && this.options.useTransition;
			this.options.useTransform = browser.feat.hasTransform && this.options.useTransform;

			this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
			this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

			// If you want eventPassthrough I have to lock one of the axes
			this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
			this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

			// With eventPassthrough we also need lockDirection mechanism
			this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
			this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

			this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

			this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

			if ( this.options.tap === true ) {
				this.options.tap = 'tap';
			}

			if ( browser.isBadTransition && this.options.useTransition && this.options.shrinkScrollbars == 'scale' ) {
				this.options.shrinkScrollbars == 'clip';
			}

			this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

			if ( this.options.infiniteElements ) {
				this.options.probeType = 3;
			}
			this.options.infiniteUseTransform = this.options.infiniteUseTransform && this.options.useTransform;

		// INSERT POINT: NORMALIZATION

			// Some defaults	
			this.x = 0;
			this.y = 0;
			this.directionX = 0;
			this.directionY = 0;
			this._events = {};

		// INSERT POINT: DEFAULTS

			this._init();
			this.refresh();

			this.scrollTo(this.options.startX, this.options.startY);
			this.enable();
		}

		Scroll.prototype = {

			_init: function () {
				this._initEvents();
				this._aid();

				if ( this.options.scrollbars || this.options.indicators ) {
					this._initIndicators();
				}

				if ( this.options.mouseWheel ) {
					this._initWheel();
				}

				if ( this.options.snap ) {
					this._initSnap();
				}

				if ( this.options.keyBindings ) {
					this._initKeys();
				}

				if ( this.options.infiniteElements ) {
					this._initInfinite();
				}

		// INSERT POINT: _init

			},

			_aid: function () {
				var that = this;

				// 加速度;
				this.acceleration = 0;
				// acceleration;
				this.on('scrollEnd', function (type) {
					// reset if we are outside of the boundaries
					if ( this.trendX >= 0 && this.trendY >= 0 && this.bounceScope == false ) {
						return this.acceleration = 0;
					}
					if ( type === "break" ) {
						this.acceleration += utils.getTime() - this.startTime < 300 ? .1 : 0;
					} else {
						this.acceleration = 0;
					}
				})

				// 监测任何子元素变动;
				if ( browser.feat.hasObserver ) {
					$(this.scroller).observer({
	                    childList: true,
	                    subtree: true,
	                    characterData: true
					}, function (records) {
						for (var i = records.length - 1; i >= 0; i--) {
							if ( records[i].type === "childList" ) return that.refresh();
						}
					})
				}
			},

			destroy: function () {
				this._initEvents(true);

				this._execEvent('destroy');
			},

			_transitionEnd: function (e) {
				if ( e.target != this.scroller || !this.isInTransition ) {
					return;
				}

				this._transitionTime();

				this.x = this.transitionendPosX;
				this.y = this.transitionendPosY;

				if ( !this.resetPosition(this.options.bounceTime) ) {
					this.isInTransition = false;
					this._execEvent('scrollEnd');
				}
			},

			_start: function (e) {
				// React to left mouse button only
				if ( utils.eventType[e.type] != 1 ) {
					if ( e.button !== 0 ) {
						return;
					}
				}

				if ( !this.enabled || (this.initiated && utils.eventType[e.type] !== this.initiated) ) {
					return;
				}

				if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
					e.preventDefault();
				}

				var point = e.touches ? e.touches[0] : e,
					time = 0,
					pos
				;

				this.initiated	= utils.eventType[e.type];
				this.moved		= false;
				this.distX		= 0;
				this.distY		= 0;
				this.trendX     = 0;
				this.trendY     = 0;
				this.directionX = 0;
				this.directionY = 0;
				this.directionLocked = 0;

				if ( this.options.useTransition && this.isInTransition ) {
					pos = this.getComputedPosition();

					this.x = pos.x;
					this.y = pos.y;

			/* FOR BAD TRANSITION START: promote */

					if ( browser.isBadTransition ) {
						time = 0.001;

						if ( this.trendX >= 0 && this.trendY >= 0 && this.bounceScope == false ) {
							this.x += this.dropX;
							this.y += this.dropY;
						}

						this.resetBadTransition = true;
					}

			/* FOR BAD TRANSITION END: promote */

					this._transitionTime(time);
					this._translate(this.x, this.y);

					this.isInTransition = false;
					this._execEvent('scrollEnd', "break");
				} else if ( !this.options.useTransition && this.isAnimating ) {
					this.isAnimating = false;
					this._execEvent('scrollEnd', "break");
				}

				this.startTime = utils.getTime();

				// drop rate by LIEN;
				this.dropX = 0;
				this.dropY = 0;

				this.startX    = this.x;
				this.startY    = this.y;
				this.absStartX = this.x;
				this.absStartY = this.y;
				this.pointX    = point.pageX;
				this.pointY    = point.pageY;

				this._execEvent('beforeScrollStart');
			},

			_move: function (e) {
				if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
					return;
				}

				// increases performance on Android? TODO: check!;
				if ( this.options.preventDefault ) {
					e.preventDefault();
				}

				var point		= e.touches ? e.touches[0] : e,
					deltaX		= point.pageX - this.pointX,
					deltaY		= point.pageY - this.pointY,
					timestamp	= utils.getTime(),
					isBounce 	= false,					// for badTransition;
					newX, newY,
					absDistX, absDistY,
					directionX, directionY;

				this.pointX		= point.pageX;
				this.pointY		= point.pageY;

				this.distX		+= deltaX;
				this.distY		+= deltaY;
				absDistX		= Math.abs(this.distX);
				absDistY		= Math.abs(this.distY);

		/* FOR BAD TRANSITION START: promote */

				//clear 1ms，reset time;
				if ( this.resetBadTransition ) {
					// clear bad transition time and cancle promote;
					this._transitionTime();
					this.resetBadTransition = false;
				}

		/* FOR BAD TRANSITION END: promote */

				// We need to move at least 10 pixels for the scrolling to initiate
				if ( timestamp - this.endTime > 300 && (absDistX < utils.scale(10) && absDistY < utils.scale(10)) ) {
					return;
				}

				// If you are scrolling in one direction lock the other
				if ( !this.directionLocked && !this.options.freeScroll ) {
					if ( absDistX > absDistY + this.options.directionLockThreshold ) {
						this.directionLocked = 'h';		// lock horizontally
					} else if ( absDistY >= absDistX + this.options.directionLockThreshold ) {
						this.directionLocked = 'v';		// lock vertically
					} else {
						this.directionLocked = 'n';		// no lock
					}
				}

				if ( this.directionLocked == 'h' ) {
					if ( this.options.eventPassthrough == 'vertical' ) {
						e.preventDefault();
					} else if ( this.options.eventPassthrough == 'horizontal' ) {
						this.initiated = false;
						return;
					}

					deltaY = 0;
				} else if ( this.directionLocked == 'v' ) {
					if ( this.options.eventPassthrough == 'horizontal' ) {
						e.preventDefault();
					} else if ( this.options.eventPassthrough == 'vertical' ) {
						this.initiated = false;
						return;
					}

					deltaX = 0;
				}

				deltaX = this.hasHorizontalScroll ? deltaX : 0;
				deltaY = this.hasVerticalScroll ? deltaY : 0;

				newX = this.x + deltaX;
				newY = this.y + deltaY;

				// Slow down if outside of the boundaries
				if ( newX > 0 || newX < this.maxScrollX ) {
					newX = this.options.bounce ? this.x + deltaX / 2 : newX > 0 ? 0 : this.maxScrollX;
				}
				if ( newY > 0 || newY < this.maxScrollY ) {
					newY = this.options.bounce ? this.y + deltaY / 2 : newY > 0 ? 0 : this.maxScrollY;
				}

				directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
				directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

				this.trendX = this.directionX == directionX ? 1 : -1;
				this.trendY = this.directionY == directionY ? 1 : -1;

				this.directionX = directionX;
				this.directionY = directionY;

				if ( !this.moved ) {
					this._execEvent('scrollStart');
				}

				this.moved = true;

				this._translate(newX, newY);	

		/* REPLACE START: _move */

				if ( timestamp - this.startTime > 300 ) {
					this.startTime = timestamp;
					this.startX = this.x;
					this.startY = this.y;

					if ( this.options.probeType == 1 ) {
						this._execEvent('scroll', 'moving');
					}
				}

				if ( this.options.probeType > 1 ) {
					this._execEvent('scroll', 'moving');
				}

		/* REPLACE END: _move */

			},

			_end: function (e) {
				if ( !this.enabled || utils.eventType[e.type] !== this.initiated ) {
					return;
				}

				if ( this.options.preventDefault && !utils.preventDefaultException(e.target, this.options.preventDefaultException) ) {
					e.preventDefault();
				}

				var point = e.changedTouches ? e.changedTouches[0] : e,
					momentumX,
					momentumY,
					duration = utils.getTime() - this.startTime,
					newX = Math.round(this.x),
					newY = Math.round(this.y),
					distanceX = Math.abs(newX - this.startX),
					distanceY = Math.abs(newY - this.startY),
					time = 0,
					easing = '';

				this.isInTransition = false;
				this.initiated = 0;
				this.endTime = utils.getTime();

				// reset if we are outside of the boundaries
				if ( this.resetPosition(this.options.bounceTime) ) {
					return;
				}

				this.scrollTo(newX, newY);	// ensures that the last position is rounded

				// we scrolled less than 10 pixels
				if ( !this.moved ) {
					if ( this.options.tap ) {
						utils.tap(e, this.options.tap);
					}

					if ( this.options.click ) {
						utils.click(e);
					}

					this._execEvent('scrollCancel');
					return;
				}

				if ( this._events.flick && duration < 200 && distanceX < utils.scale(100) && distanceY < utils.scale(100) ) {
					this._execEvent('flick');
					return;
				}

				// start momentum animation if needed
				if ( this.options.momentum && duration < 300 ) {
					momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration, this.acceleration, this.options.speedLimit) : { destination: newX, duration: 0 };
					momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration, this.acceleration, this.options.speedLimit) : { destination: newY, duration: 0 };
					newX = momentumX.destination;
					newY = momentumY.destination;
					time = Math.max(momentumX.duration, momentumY.duration);

					this.isInTransition = true;
				}


				if ( this.options.snap ) {
					var snap = this._nearestSnap(newX, newY);
					this.currentPage = snap;
					time = this.options.snapSpeed || Math.max(
							Math.max(
								Math.min(Math.abs(newX - snap.x), 1000),
								Math.min(Math.abs(newY - snap.y), 1000)
							), 300);
					newX = snap.x;
					newY = snap.y;

					this.directionX = 0;
					this.directionY = 0;
					easing = this.options.bounceEasing;
				}

		// INSERT POINT: _end
				if ( newX != this.x || newY != this.y ) {
					// change easing function when scroller goes out of the boundaries
					if ( newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY ) {
						easing = utils.ease.quadratic;
					}

					this.scrollTo(newX, newY, time, easing);
					
					return;
				}

				this._execEvent('scrollEnd');
			},

			_resize: function () {
				var that = this;

				clearTimeout(this.resizeTimeout);

				this.resizeTimeout = setTimeout(function () {
					that.refresh();
				}, this.options.resizePolling);
			},

			resetPosition: function (time) {
				var x = this.x,
					y = this.y;

				time = time || 0;

				if ( !this.hasHorizontalScroll || this.x > 0 ) {
					x = 0;
				} else if ( this.x < this.maxScrollX ) {
					x = this.maxScrollX;
				}

				if ( !this.hasVerticalScroll || this.y > 0 ) {
					y = 0;
				} else if ( this.y < this.maxScrollY ) {
					y = this.maxScrollY;
				}

				if ( x == this.x && y == this.y ) {
					return this.bounceScope = false;
				}

				this.scrollTo(x, y, time, this.options.bounceEasing);

				return this.bounceScope = true;
			},

			disable: function () {
				this.enabled = false;
			},

			enable: function () {
				this.enabled = true;
			},

			refresh: function () {
				var rf = this.wrapper.offsetHeight;		// Force reflow

				this.wrapperWidth	= this.wrapper.clientWidth;
				this.wrapperHeight	= this.wrapper.clientHeight;

		/* REPLACE START: refresh */

				this.scrollerWidth	= this.options.infiniteElements ? this.scrollerWidth : this.scroller.offsetWidth;
				this.scrollerHeight	= this.options.infiniteElements ? this.scrollerHeight : this.scroller.offsetHeight;

				this.maxScrollX		= this.wrapperWidth - this.scrollerWidth;
				this.maxScrollY		= this.wrapperHeight - this.scrollerHeight;
				
		/* REPLACE END: refresh */

				this.hasHorizontalScroll	= this.options.scrollX && this.maxScrollX < 0;
				this.hasVerticalScroll		= this.options.scrollY && this.maxScrollY < 0;

				if ( !this.hasHorizontalScroll ) {
					this.maxScrollX = 0;
					this.scrollerWidth = this.wrapperWidth;
				}

				if ( !this.hasVerticalScroll ) {
					this.maxScrollY = 0;
					this.scrollerHeight = this.wrapperHeight;
				}

				this.endTime = 0;
				this.directionX = 0;
				this.directionY = 0;

				this.wrapperOffset = utils.offset(this.wrapper);

				this._execEvent('refresh');

				this.resetPosition();

		// INSERT POINT: _refresh

			},

			on: function (type, fn) {
				var types = type.split(' ');

				for (var i = 0, l = types.length; i < l; i++) {

					var type = types[i];

					if ( !this._events[type] ) {
						this._events[type] = [];
					}

					this._events[type].push(fn);
				}
			},

			off: function (type, fn) {
				var types = type.split(' ');

				for (var i = 0, l = types.length; i < l; i++) {

					var type = types[i];

					if ( !this._events[type] ) {
						return;
					}

					var index = this._events[type].indexOf(fn);

					if ( index > -1 ) {
						this._events[type].splice(index, 1);
					}
				}
			},

			_execEvent: function (type) {
				if ( !this._events[type] ) {
					return;
				}

				var i = 0,
					l = this._events[type].length;

				if ( !l ) {
					return;
				}

				for ( ; i < l; i++ ) {
					this._events[type][i].apply(this, [].slice.call(arguments, 1));
				}
			},

			scrollBy: function (x, y, time, easing) {
				x = this.x + x;
				y = this.y + y;
				time = time || 0;

				this.scrollTo(x, y, time, easing);
			},

			scrollTo: function (x, y, time, easing) {
				easing = easing || utils.ease.circular;

				this.isInTransition = this.options.useTransition && time > 0;

				if ( !time || (this.options.useTransition && easing.style) ) {
					if ( this.options.useTransition ) {
						this._transitionTimingFunction(easing.style);
						this._transitionTime(time);
					}
					
					this._translate(x, y);

					this._transitionScroll(x, y);

				} else {
					this._animate(x, y, time, easing.fn);
				}
			},

			scrollToElement: function (el, time, offsetX, offsetY, easing) {
				el = el.nodeType ? el : this.scroller.querySelector(el);

				if ( !el ) {
					return;
				}

				var pos = utils.offset(el);

				pos.left -= this.wrapperOffset.left;
				pos.top  -= this.wrapperOffset.top;

				// if offsetX/Y are true we center the element to the screen
				if ( offsetX === true ) {
					offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
				}
				if ( offsetY === true ) {
					offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
				}

				pos.left -= offsetX || 0;
				pos.top  -= offsetY || 0;

				pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
				pos.top  = pos.top  > 0 ? 0 : pos.top  < this.maxScrollY ? this.maxScrollY : pos.top;

				time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x-pos.left), Math.abs(this.y-pos.top)) : time;

				this.scrollTo(pos.left, pos.top, time, easing);
			},

			_transitionTime: function (time) {
				time = time || 0;

				this.scrollerStyle[browser.prefixStyle.transitionDuration] = time + 'ms';



				if ( this.indicators ) {
					for ( var i = this.indicators.length; i--; ) {
						this.indicators[i].transitionTime(time);
					}
				}
		// INSERT POINT: _transitionTime

			},

			_transitionTimingFunction: function (easing) {
				this.scrollerStyle[browser.prefixStyle.transitionTimingFunction] = easing;


				if ( this.indicators ) {
					for ( var i = this.indicators.length; i--; ) {
						this.indicators[i].transitionTimingFunction(easing);
					}
				}

		// INSERT POINT: _transitionTimingFunction

			},

			_transitionScroll: function (x, y) {
				this.transitionendPosX = x;
				this.transitionendPosY = y;
				// useTransition 的scroll事件;
				var that = this;
				function step () {
					if ( !that.isInTransition ) return;

					var pos = that.getComputedPosition();

					// drop rate;
					that.dropX = (pos.x - that.x) || that.dropX;
					that.dropY = (pos.y - that.y) || that.dropY;

					that.x = pos.x;
					that.y = pos.y;

					if ( that.options.probeType == 3 ) {
						that._execEvent('scroll');
					}

					window.requestAnimationFrame(step);
				}

				step();
			},

			_translate: function (x, y) {
				if ( this.options.useTransform ) {

		/* REPLACE START: _translate */

					this.scrollerStyle[browser.prefixStyle.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;

		/* REPLACE END: _translate */

				} else {
					x = Math.round(x);
					y = Math.round(y);
					this.scrollerStyle.left = x + 'px';
					this.scrollerStyle.top = y + 'px';
				}

				this.x = x;
				this.y = y;

				if ( this.indicators ) {
					for ( var i = this.indicators.length; i--; ) {
						this.indicators[i].updatePosition();
					}
				}
		// INSERT POINT: _translate

			},

			_initEvents: function (remove) {
				var eventType = remove ? utils.removeEvent : utils.addEvent,
					target = this.options.bindToWrapper ? this.wrapper : window;

				eventType(window, 'orientationchange', this);
				eventType(window, 'resize', this);

				if ( this.options.click ) {
					eventType(this.wrapper, 'click', this, true);
				}

				if ( !this.options.disableMouse ) {
					eventType(this.wrapper, 'mousedown', this);
					eventType(target, 'mousemove', this);
					eventType(target, 'mousecancel', this);
					eventType(target, 'mouseup', this);
				}

				if ( browser.feat.hasPointer && !this.options.disablePointer ) {
					eventType(this.wrapper, 'MSPointerDown', this);
					eventType(target, 'MSPointerMove', this);
					eventType(target, 'MSPointerCancel', this);
					eventType(target, 'MSPointerUp', this);
				}

				if ( browser.feat.hasTouch && !this.options.disableTouch ) {
					eventType(this.wrapper, 'touchstart', this);
					eventType(target, 'touchmove', this);
					eventType(target, 'touchcancel', this);
					eventType(target, 'touchend', this);
				}

				eventType(this.scroller, 'transitionend', this);
				eventType(this.scroller, 'webkitTransitionEnd', this);
				eventType(this.scroller, 'oTransitionEnd', this);
				eventType(this.scroller, 'MSTransitionEnd', this);

				// 内容结构变更重新刷新;
				if ( !browser.feat.hasObserver ) {
					eventType(this.scroller, 'DOMNodeInserted', this);
					eventType(this.scroller, 'DOMNodeRemoved', this);
				}
			},

			getComputedPosition: function () {
				var matrix = window.getComputedStyle(this.scroller, null),
					x, y;

				if ( this.options.useTransform ) {
					matrix = matrix[browser.prefixStyle.transform].split(')')[0].split(', ');
					x = +(matrix[12] || matrix[4]);
					y = +(matrix[13] || matrix[5]);
				} else {
					x = +matrix.left.replace(/[^-\d.]/g, '');
					y = +matrix.top.replace(/[^-\d.]/g, '');
				}

				return { x: x, y: y };
			},

			_initIndicators: function () {
				var interactive = this.options.interactiveScrollbars,
					customStyle = typeof this.options.scrollbars != 'string',
					indicators = [],
					indicator;

				var that = this;

				this.indicators = [];

				if ( this.options.scrollbars ) {
					// Vertical scrollbar
					if ( this.options.scrollY ) {
						indicator = {
							el: createDefaultScrollbar('v', interactive, this.options.scrollbars),
							interactive: interactive,
							defaultScrollbars: true,
							customStyle: customStyle,
							resize: this.options.resizeScrollbars,
							shrink: this.options.shrinkScrollbars,
							fade: this.options.fadeScrollbars,
							listenX: false
						};

						this.wrapper.appendChild(indicator.el);
						indicators.push(indicator);
					}

					// Horizontal scrollbar
					if ( this.options.scrollX ) {
						indicator = {
							el: createDefaultScrollbar('h', interactive, this.options.scrollbars),
							interactive: interactive,
							defaultScrollbars: true,
							customStyle: customStyle,
							resize: this.options.resizeScrollbars,
							shrink: this.options.shrinkScrollbars,
							fade: this.options.fadeScrollbars,
							listenY: false
						};

						this.wrapper.appendChild(indicator.el);
						indicators.push(indicator);
					}
				}

				if ( this.options.indicators ) {
					// TODO: check concat compatibility
					indicators = indicators.concat(this.options.indicators);
				}

				for ( var i = indicators.length; i--; ) {
					this.indicators.push( new Indicator(this, indicators[i]) );
				}

				// TODO: check if we can use array.map (wide compatibility and performance issues)
				function _indicatorsMap (fn) {
					for ( var i = that.indicators.length; i--; ) {
						fn.call(that.indicators[i]);
					}
				}

				if ( this.options.fadeScrollbars ) {
					this.on('scrollEnd', function () {
						_indicatorsMap(function () {
							this.fade();
						});
					});

					this.on('scrollCancel', function () {
						_indicatorsMap(function () {
							this.fade();
						});
					});

					this.on('scrollStart', function () {
						_indicatorsMap(function () {
							this.fade(1);
						});
					});

					this.on('beforeScrollStart', function () {
						_indicatorsMap(function () {
							this.fade(1, true);
						});
					});
				}


				this.on('refresh', function () {
					_indicatorsMap(function () {
						this.refresh();
					});
				});

				this.on('modify', function () {
					_indicatorsMap(function () {
						this.refresh();
					});
				});

				this.on('destroy', function () {
					_indicatorsMap(function () {
						this.destroy();
					});

					delete this.indicators;
				});
			},

			_initWheel: function () {
				utils.addEvent(this.wrapper, 'wheel', this);
				utils.addEvent(this.wrapper, 'mousewheel', this);
				utils.addEvent(this.wrapper, 'DOMMouseScroll', this);

				this.on('destroy', function () {
					utils.removeEvent(this.wrapper, 'wheel', this);
					utils.removeEvent(this.wrapper, 'mousewheel', this);
					utils.removeEvent(this.wrapper, 'DOMMouseScroll', this);
				});
			},

			_wheel: function (e) {
				if ( !this.enabled ) {
					return;
				}

				e.preventDefault();
				e.stopPropagation();

				var wheelDeltaX, wheelDeltaY,
					newX, newY,
					that = this;

				if ( this.wheelTimeout === undefined ) {
					that._execEvent('scrollStart');
				}

				// Execute the scrollEnd event after 400ms the wheel stopped scrolling
				clearTimeout(this.wheelTimeout);
				this.wheelTimeout = setTimeout(function () {
					that._execEvent('scrollEnd');
					that.wheelTimeout = undefined;
				}, 400);

				if ( 'deltaX' in e ) {
					wheelDeltaX = -e.deltaX;
					wheelDeltaY = -e.deltaY;
				} else if ( 'wheelDeltaX' in e ) {
					wheelDeltaX = e.wheelDeltaX / 120 * this.options.mouseWheelSpeed;
					wheelDeltaY = e.wheelDeltaY / 120 * this.options.mouseWheelSpeed;
				} else if ( 'wheelDelta' in e ) {
					wheelDeltaX = wheelDeltaY = e.wheelDelta / 120 * this.options.mouseWheelSpeed;
				} else if ( 'detail' in e ) {
					wheelDeltaX = wheelDeltaY = -e.detail / 3 * this.options.mouseWheelSpeed;
				} else {
					return;
				}

				wheelDeltaX *= this.options.invertWheelDirection;
				wheelDeltaY *= this.options.invertWheelDirection;

				if ( !this.hasVerticalScroll ) {
					wheelDeltaX = wheelDeltaY;
					wheelDeltaY = 0;
				}

				if ( this.options.snap ) {
					newX = this.currentPage.pageX;
					newY = this.currentPage.pageY;

					if ( wheelDeltaX > 0 ) {
						newX--;
					} else if ( wheelDeltaX < 0 ) {
						newX++;
					}

					if ( wheelDeltaY > 0 ) {
						newY--;
					} else if ( wheelDeltaY < 0 ) {
						newY++;
					}

					this.goToPage(newX, newY);

					return;
				}

				newX = this.x + Math.round(this.hasHorizontalScroll ? wheelDeltaX : 0);
				newY = this.y + Math.round(this.hasVerticalScroll ? wheelDeltaY : 0);

				if ( newX > 0 ) {
					newX = 0;
				} else if ( newX < this.maxScrollX ) {
					newX = this.maxScrollX;
				}

				if ( newY > 0 ) {
					newY = 0;
				} else if ( newY < this.maxScrollY ) {
					newY = this.maxScrollY;
				}

				this.scrollTo(newX, newY, 0);

				if ( this.options.probeType > 1 ) {
					this._execEvent('scroll');
				}

		// INSERT POINT: _wheel
			},

			_initSnap: function () {
				this.currentPage = {};

				if ( typeof this.options.snap == 'string' ) {
					this.options.snap = this.scroller.querySelectorAll(this.options.snap);
				}

				this.on('refresh', function () {
					var i = 0, l,
						m = 0, n,
						cx, cy,
						x = 0, y,
						stepX = this.options.snapStepX || this.wrapperWidth,
						stepY = this.options.snapStepY || this.wrapperHeight,
						el;

					this.pages = [];

					if ( !this.wrapperWidth || !this.wrapperHeight || !this.scrollerWidth || !this.scrollerHeight ) {
						return;
					}

					if ( this.options.snap === true ) {
						cx = Math.round( stepX / 2 );
						cy = Math.round( stepY / 2 );

						while ( x > -this.scrollerWidth ) {
							this.pages[i] = [];
							l = 0;
							y = 0;

							while ( y > -this.scrollerHeight ) {
								this.pages[i][l] = {
									x: Math.max(x, this.maxScrollX),
									y: Math.max(y, this.maxScrollY),
									width: stepX,
									height: stepY,
									cx: x - cx,
									cy: y - cy
								};

								y -= stepY;
								l++;
							}

							x -= stepX;
							i++;
						}
					} else {
						el = this.options.snap;
						l = el.length;
						n = -1;

						for ( ; i < l; i++ ) {
							if ( i === 0 || el[i].offsetLeft <= el[i-1].offsetLeft ) {
								m = 0;
								n++;
							}

							if ( !this.pages[m] ) {
								this.pages[m] = [];
							}

							x = Math.max(-el[i].offsetLeft, this.maxScrollX);
							y = Math.max(-el[i].offsetTop, this.maxScrollY);
							cx = x - Math.round(el[i].offsetWidth / 2);
							cy = y - Math.round(el[i].offsetHeight / 2);

							this.pages[m][n] = {
								x: x,
								y: y,
								width: el[i].offsetWidth,
								height: el[i].offsetHeight,
								cx: cx,
								cy: cy
							};

							if ( x > this.maxScrollX ) {
								m++;
							}
						}
					}

					this.goToPage(this.currentPage.pageX || 0, this.currentPage.pageY || 0, 0);

					// Update snap threshold if needed
					if ( this.options.snapThreshold % 1 === 0 ) {
						this.snapThresholdX = this.options.snapThreshold;
						this.snapThresholdY = this.options.snapThreshold;
					} else {
						this.snapThresholdX = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].width * this.options.snapThreshold);
						this.snapThresholdY = Math.round(this.pages[this.currentPage.pageX][this.currentPage.pageY].height * this.options.snapThreshold);
					}
				});

				this.on('flick', function () {
					var time = this.options.snapSpeed || Math.max(
							Math.max(
								Math.min(Math.abs(this.x - this.startX), 1000),
								Math.min(Math.abs(this.y - this.startY), 1000)
							), 300);

					this.goToPage(
						this.currentPage.pageX + this.directionX,
						this.currentPage.pageY + this.directionY,
						time
					);
				});
			},

			_nearestSnap: function (x, y) {
				if ( !this.pages.length ) {
					return { x: 0, y: 0, pageX: 0, pageY: 0 };
				}

				var i = 0,
					l = this.pages.length,
					m = 0;

				// Check if we exceeded the snap threshold
				if ( Math.abs(x - this.absStartX) < this.snapThresholdX &&
					Math.abs(y - this.absStartY) < this.snapThresholdY ) {
					return this.currentPage;
				}

				if ( x > 0 ) {
					x = 0;
				} else if ( x < this.maxScrollX ) {
					x = this.maxScrollX;
				}

				if ( y > 0 ) {
					y = 0;
				} else if ( y < this.maxScrollY ) {
					y = this.maxScrollY;
				}

				for ( ; i < l; i++ ) {
					if ( x >= this.pages[i][0].cx ) {
						x = this.pages[i][0].x;
						break;
					}
				}

				l = this.pages[i].length;

				for ( ; m < l; m++ ) {
					if ( y >= this.pages[0][m].cy ) {
						y = this.pages[0][m].y;
						break;
					}
				}

				if ( i == this.currentPage.pageX ) {
					i += this.directionX;

					if ( i < 0 ) {
						i = 0;
					} else if ( i >= this.pages.length ) {
						i = this.pages.length - 1;
					}

					x = this.pages[i][0].x;
				}

				if ( m == this.currentPage.pageY ) {
					m += this.directionY;

					if ( m < 0 ) {
						m = 0;
					} else if ( m >= this.pages[0].length ) {
						m = this.pages[0].length - 1;
					}

					y = this.pages[0][m].y;
				}

				return {
					x: x,
					y: y,
					pageX: i,
					pageY: m
				};
			},

			goToPage: function (x, y, time, easing) {
				easing = easing || this.options.bounceEasing;

				if ( x >= this.pages.length ) {
					x = this.pages.length - 1;
				} else if ( x < 0 ) {
					x = 0;
				}

				if ( y >= this.pages[x].length ) {
					y = this.pages[x].length - 1;
				} else if ( y < 0 ) {
					y = 0;
				}

				var posX = this.pages[x][y].x,
					posY = this.pages[x][y].y;

				time = time === undefined ? this.options.snapSpeed || Math.max(
					Math.max(
						Math.min(Math.abs(posX - this.x), 1000),
						Math.min(Math.abs(posY - this.y), 1000)
					), 300) : time;

				this.currentPage = {
					x: posX,
					y: posY,
					pageX: x,
					pageY: y
				};

				this.scrollTo(posX, posY, time, easing);
			},

			next: function (time, easing) {
				var x = this.currentPage.pageX,
					y = this.currentPage.pageY;

				x++;

				if ( x >= this.pages.length && this.hasVerticalScroll ) {
					x = 0;
					y++;
				}

				this.goToPage(x, y, time, easing);
			},

			prev: function (time, easing) {
				var x = this.currentPage.pageX,
					y = this.currentPage.pageY;

				x--;

				if ( x < 0 && this.hasVerticalScroll ) {
					x = 0;
					y--;
				}

				this.goToPage(x, y, time, easing);
			},

			_initKeys: function (e) {
				// default key bindings
				var keys = {
					pageUp: 33,
					pageDown: 34,
					end: 35,
					home: 36,
					left: 37,
					up: 38,
					right: 39,
					down: 40
				};
				var i;

				// if you give me characters I give you keycode
				if ( typeof this.options.keyBindings == 'object' ) {
					for ( i in this.options.keyBindings ) {
						if ( typeof this.options.keyBindings[i] == 'string' ) {
							this.options.keyBindings[i] = this.options.keyBindings[i].toUpperCase().charCodeAt(0);
						}
					}
				} else {
					this.options.keyBindings = {};
				}

				for ( i in keys ) {
					this.options.keyBindings[i] = this.options.keyBindings[i] || keys[i];
				}

				utils.addEvent(window, 'keydown', this);

				this.on('destroy', function () {
					utils.removeEvent(window, 'keydown', this);
				});
			},

			_key: function (e) {
				if ( !this.enabled ) {
					return;
				}

				var snap = this.options.snap,	// we are using this alot, better to cache it
					newX = snap ? this.currentPage.pageX : this.x,
					newY = snap ? this.currentPage.pageY : this.y,
					now = utils.getTime(),
					prevTime = this.keyTime || 0,
					acceleration = 0.250,
					pos;

				if ( this.options.useTransition && this.isInTransition ) {
					pos = this.getComputedPosition();

					this._translate(Math.round(pos.x), Math.round(pos.y));
					this.isInTransition = false;
				}

				this.keyAcceleration = now - prevTime < 200 ? Math.min(this.keyAcceleration + acceleration, 50) : 0;

				switch ( e.keyCode ) {
					case this.options.keyBindings.pageUp:
						if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
							newX += snap ? 1 : this.wrapperWidth;
						} else {
							newY += snap ? 1 : this.wrapperHeight;
						}
						break;
					case this.options.keyBindings.pageDown:
						if ( this.hasHorizontalScroll && !this.hasVerticalScroll ) {
							newX -= snap ? 1 : this.wrapperWidth;
						} else {
							newY -= snap ? 1 : this.wrapperHeight;
						}
						break;
					case this.options.keyBindings.end:
						newX = snap ? this.pages.length-1 : this.maxScrollX;
						newY = snap ? this.pages[0].length-1 : this.maxScrollY;
						break;
					case this.options.keyBindings.home:
						newX = 0;
						newY = 0;
						break;
					case this.options.keyBindings.left:
						newX += snap ? -1 : 5 + this.keyAcceleration>>0;
						break;
					case this.options.keyBindings.up:
						newY += snap ? 1 : 5 + this.keyAcceleration>>0;
						break;
					case this.options.keyBindings.right:
						newX -= snap ? -1 : 5 + this.keyAcceleration>>0;
						break;
					case this.options.keyBindings.down:
						newY -= snap ? 1 : 5 + this.keyAcceleration>>0;
						break;
					default:
						return;
				}

				if ( snap ) {
					this.goToPage(newX, newY);
					return;
				}

				if ( newX > 0 ) {
					newX = 0;
					this.keyAcceleration = 0;
				} else if ( newX < this.maxScrollX ) {
					newX = this.maxScrollX;
					this.keyAcceleration = 0;
				}

				if ( newY > 0 ) {
					newY = 0;
					this.keyAcceleration = 0;
				} else if ( newY < this.maxScrollY ) {
					newY = this.maxScrollY;
					this.keyAcceleration = 0;
				}

				this.scrollTo(newX, newY, 0);

				this.keyTime = now;
			},

			_animate: function (destX, destY, duration, easingFn) {
				var that = this,
					startX = this.x,
					startY = this.y,
					startTime = utils.getTime(),
					destTime = startTime + duration;

				function step () {
					var now = utils.getTime(),
						newX, newY,
						easing;

					if ( now >= destTime ) {
						that.isAnimating = false;
						that._translate(destX, destY);
						
						if ( !that.resetPosition(that.options.bounceTime) ) {
							that._execEvent('scrollEnd');
						}

						return;
					}

					now = ( now - startTime ) / duration;
					easing = easingFn(now);
					newX = ( destX - startX ) * easing + startX;
					newY = ( destY - startY ) * easing + startY;
					that._translate(newX, newY);

					if ( that.isAnimating ) {
						window.requestAnimationFrame(step);
					}

					if ( that.options.probeType == 3 ) {
						that._execEvent('scroll');
					}
				}

				this.isAnimating = true;
				step();
			},

			_initInfinite: function () {
				var that = this;
				var el = this.options.infiniteElements;

				this.infiniteElements = typeof el == 'string' ? document.querySelectorAll(el) : el;
				this.infiniteLength = this.infiniteElements.length;
				this.infiniteCacheLength = 0;
				this.scrollerHeight = 0;

				switch ( this.options.infiniteType ) {
					case "equal":
						this.infiniteMaster = this.infiniteElements[0];
						this.infiniteElementWidth = this.infiniteMaster.offsetWidth;
						this.infiniteElementHeight = this.infiniteMaster.offsetHeight;
						this.infiniteContainerWidth = this.infiniteLength * this.infiniteElementWidth;
						this.infiniteContainerHeight = this.infiniteLength * this.infiniteElementHeight;
						break;
					case "differ":
						this.infinitePhase = 0;
						this.infiniteMaxPhase = 0;
						this.infiniteContentWidth = 0;
						this.infiniteContentHeight = 0;
						this.infiniteContentPos = [0, 0];
						this.infiniteContainerCenter = 0;
						this.infiniteElementsPos = [];
						this.infiniteElementsEdge = [0, 0];
						this.infinitePhaseElements = [];
						break;
				}

				this.fragment = [];
				this.infiniteCache = [];

				// 第一次排序完毕后刷新滚动;
				this.on('infiniteCachedReady', function () {
					// refresh maxScrollX and maxScrollY;
					this.refresh();
				});

				// scroll刷新后更新计算数据;
				this.on('refresh', function () {
					switch ( this.options.infiniteType ) {
						case "equal":
							if ( this.options.scrollX ) {
								var elementsPerPage = Math.ceil(this.wrapperWidth / this.infiniteElementWidth);
								this.infiniteUpperBufferSize = Math.floor((this.infiniteLength - elementsPerPage) / 2);
							} else if ( this.options.scrollY ) {
								var elementsPerPage = Math.ceil(this.wrapperHeight / this.infiniteElementHeight);
								this.infiniteUpperBufferSize = Math.floor((this.infiniteLength - elementsPerPage) / 2);
							}

							break;
						case "differ":
							// 监听infinite item的dom节点更新，更新后刷新节点位置;
							if ( this.infiniteChangeEvent ) {
								that.refreshInfinite();
							}
							break;
					}
					
					this.reorderInfinite();
				});

				// 滚动事件触发排序;
				this.on('scroll scrollEnd', function (type) {
					// if moving : stop scroll;
					if ( type == "moving" ) return;
					
					this.reorderInfinite();
				});
			},

			// 加载数据回调;
			datasetInfinite: function (callback) {
				if ( this.datasetInfinite.lock === true ) return;

				var that = this;
				var start = this.infiniteCache.length;
				// ajax lock;
				this.datasetInfinite.lock = true;
				this.options.dataset.call(this, start, function (data) {
					if ( data === undefined || !data.length ) return that.datasetInfinite.lock = true;
					// 更新数据缓存;
					that.updateInfiniteCache(start, data);
					// 成功回调;
					callback && callback.call(that, start);
					// 初始化事件;
					if ( start === 0 ) {
						that._execEvent('infiniteCachedReady');
					}
					// open lock;
					that.datasetInfinite.lock = false;
				})
			},

			// TO-DO: clean up the mess
			reorderInfinite: function () {

				switch ( this.options.infiniteType ) {
					case "equal":
						var that = this,
							item,
							i = 0,
							l = this.infiniteLength,
							top = 0,
							left = 0,
							pos,
							point,
							center,
							minorPhase,
							majorPhase,
							phase,
							infiniteContainerSize,
							infiniteElementSize,
							infiniteCacheBuffer,
							update = [];

						if ( this.options.scrollX ) {
							point = -this.x;
							center = point + this.wrapperWidth / 2;
							infiniteElementSize = this.infiniteElementWidth;
							infiniteContainerSize = this.infiniteContainerWidth;
						} else if ( this.options.scrollY ) {
							point = -this.y;
							center = point + this.wrapperHeight / 2;
							infiniteElementSize = this.infiniteElementHeight;
							infiniteContainerSize = this.infiniteContainerHeight;
						}

						minorPhase = Math.max(Math.floor(point / infiniteElementSize) - this.infiniteUpperBufferSize, 0),
						majorPhase = Math.floor(minorPhase / this.infiniteLength),
						phase = minorPhase - majorPhase * this.infiniteLength,
						infiniteCacheBuffer = this.infiniteCacheLength - minorPhase;

						// detect infinite upper buffer size;
						while ( i < l ) {
							pos = i * infiniteElementSize + majorPhase * infiniteContainerSize;
							item = this.infiniteElements[i];
							item._index = i;

							if ( phase > i ) {
								pos += infiniteElementSize * this.infiniteLength;
							}

							if ( item._pos !== pos ) {
								item._phase = pos / infiniteElementSize;

								if ( item._phase < this.options.infiniteLimit ) {
									update.push(item);

									this.updateInfinitePos(item, pos);
								}
							}

							i++;
						}

						if ( infiniteCacheBuffer <= this.options.infiniteCacheBuffer ) {
							this.datasetInfinite(function (start) {
								// if on first page, update content;
								if ( start == 0 ) {
									this.updateInfiniteContent(update);
								}

								// updata scrollerWidth And scrollerHeight;
								if ( this.options.scrollX ) {
									this.scrollerWidth = this.infiniteElementWidth * this.infiniteCacheLength;
								} else if ( this.options.scrollY ) {
									this.scrollerHeight	= this.infiniteElementHeight * this.infiniteCacheLength;
								}
							})
						}

						this.updateInfiniteContent(update);

						break;

					case "differ":
						var that = this,
							point,
							center,
							supplement,
							update = [];
						
						point = -this.y;
						// 内容绝对中心位置;
						center = point + this.wrapperHeight / 2;
						// 移动补充正负值;
						supplement = this.infiniteContainerCenter - center;
						supplement = supplement === 0 ? 0 : supplement < 0 ? -1 : 1;

						// 记录中心位置;
						this.infiniteContainerCenter = center;
						// 滚动内容高度;
						this.infiniteContentHeight = this.infiniteContentPos[1] - this.infiniteContentPos[0];
						this.infiniteBufferSize = Math.floor((this.infiniteContentHeight - this.wrapperHeight) / 2);

						// 剩余容量;
						this.infiniteSurplus = this.infiniteCacheLength - this.infinitePhase;

						// 数据缓冲不足
						if ( this.infiniteSurplus <= this.options.infiniteCacheBuffer ) {
							this.datasetInfinite(function (start) {
								this.rearrangeInfinite(start === 0 ? -1 : 0);
							})
							// 如果没有数据，停止排序;
							if ( this.infiniteCacheLength === 0 ) return;
						}

						// 重新排序;
						this.rearrangeInfinite(supplement);
						break;
				}

			},

			detectInfiniteBalance: function () {
				return this.infiniteContentPos[1] + this.infiniteContentPos[0] - 2*this.infiniteContainerCenter;
			},

			rearrangeInfinite: function (supplement) {
				var item,
					pos,
					size,
					phase,
					index,
					round;

				switch (supplement) {
					case -1:
						while ( this.detectInfiniteBalance() < 0 || this.infinitePhase < this.infiniteLength ) {
							// 剩余容量;
							this.infiniteSurplus = this.infiniteCacheLength - this.infinitePhase;
							// 列表超出最大数据缓存则停止, 注意: 此处是小于零而不是小于等于，等于零时为最后一个item通过;
							if ( this.infiniteSurplus < 0 ) return this._execEvent('infiniteCachedEnd');
							// 当前操作阶段序列
							phase = this.infinitePhase++;
							// 当前操作dom序列
							index = phase % this.infiniteLength;
							// 循环序列
							round = Math.max((phase + 1 - this.infiniteLength) % this.infiniteLength, 0);
							
							// 设置item
							item = this.infiniteElements[index];
							item._index = index;
							item._phase = phase;
							
							// 更新item内容
							this.updateInfiniteContent([item]);
							// 获取item尺寸
							size = item.offsetHeight;
							// 更新item位置
							pos = this.infiniteContentPos[1];
							this.updateInfinitePos(item, pos);
							// 记录item坐标
							this.infiniteElementsPos[index] = [pos, pos+size];
							
							// 更新item集上坐标和下坐标
							this.infiniteElementsEdge = [round, index];
							this.infiniteContentPos[0] = this.infiniteElementsPos[round][0];
							this.infiniteContentPos[1] += size;

							// 更新滚动区域高度和最大滚动高度
							this.refreshInfinite(phase, pos+size);
						} 
						break;
					case 1:
						while ( this.detectInfiniteBalance() > 0 ) {
							// 列表序列为0时则停止;
							if ( this.infinitePhase - this.infiniteLength <= 0 ) return; 
							// 当前操作阶段序列
							phase = --this.infinitePhase;
							// 当前操作dom序列
							index = phase % this.infiniteLength;
							// 循环序列
							round = (phase - 1) % this.infiniteLength;

							// 设置item
							item = this.infiniteElements[index];
							item._index = index;
							item._phase = phase - this.infiniteLength;

							// 更新item内容
							this.updateInfiniteContent([item]);
							// 获取item尺寸
							size = item.offsetHeight;
							// 更新item位置和
							pos = this.infiniteContentPos[0] - size;
							this.updateInfinitePos(item, pos);
							// 记录item坐标
							this.infiniteElementsPos[index] = [pos, pos+size];

							// 更新item集上坐标和下坐标
							this.infiniteElementsEdge = [index, round];
							this.infiniteContentPos[0] -= size;
							this.infiniteContentPos[1] = this.infiniteElementsPos[round][1];
						} 
						break;
					default:
						break;
				}
				
			},

			refreshInfinite: function (phase, pos) {
				// 如果未指定增量, 强制更新位置;
				if ( phase === undefined ) {
					var i,
						l = this.infiniteLength,
						mixPhase = this.infiniteElementsEdge[0],
						index,
						item,
						size,
						supplement,
						contentHeight = this.infiniteContentPos[1] - this.infiniteContentPos[0];

						this.infiniteContentPos[1] = this.infiniteContentPos[0];

					for ( i = 0; i < l; i++ ) {
						index = (mixPhase + i) % this.infiniteLength;
						item = this.infiniteElements[index];
						size = item.offsetHeight;

						pos = this.infiniteContentPos[1];
						this.updateInfinitePos(item, pos);
						// 记录item坐标
						this.infiniteElementsPos[index] = [pos, pos+size];

						this.infiniteContentPos[1] += size;
					};

					// item改变后总高度变化;
					supplement = this.infiniteContentPos[1] - this.infiniteContentPos[0] - contentHeight;
					// 修正最大滚动高度受内容改变的影响;
					this.scrollerHeight += supplement;
					this.maxScrollY = this.wrapperHeight - this.scrollerHeight;
					this._execEvent("modify");

					return;
				}

				// 如果增量没有超出或者不进行强制更新位置;
				if ( phase <= this.infiniteMaxPhase ) return;

				// 如果还有缓存数据，则增加两倍视图高度的虚拟缓冲区;
				this.scrollerHeight = pos + this.infiniteSurplus * (pos / phase);
				this.maxScrollY = this.wrapperHeight - this.scrollerHeight;

				// 数据剩余为0或每增加一页刷新一次滚动条
				if ( this.infiniteSurplus == 0 || phase % this.infiniteLength == 0 ) {
					this._execEvent("modify");
				}

				this.infiniteMaxPhase = phase;
			},

			updateInfinitePos: function (item, pos) {
				item._pos = pos;

				if ( this.options.scrollX ) {
					if ( this.options.infiniteUseTransform ) {
						item.style[browser.prefixStyle.transform] = 'translate(' + pos + 'px, 0)' + this.translateZ;
					} else {
						item.style.left = pos + 'px';
					}
				} else if ( this.options.scrollY ) {
					if ( this.options.infiniteUseTransform ) {
						item.style[browser.prefixStyle.transform] = 'translate(0, ' + pos + 'px)' + this.translateZ;
					} else {
						item.style.top = pos + 'px';
					}
				}
			},

			updateInfiniteContent: function (els) {
				var el,
					data;

				this.infiniteChangeEvent = false;
				for ( var i = 0, l = els.length; i < l; i++ ) {
					el = els[i],
					data = this.infiniteCache[el._phase];

					if ( !data ) return;

					if ( this.options.dataFiller ) {
						this.options.dataFiller.call(this, el, data);
					} else {
					    el.innerHTML = data;
					}
				}
				this.infiniteChangeEvent = true;
			},

			updateInfiniteCache: function (start, data) {

				for ( var i = 0, l = data.length; i < l; i++ ) {
					this.infiniteCache[start++] = data[i];
				}

				this.infiniteCacheLength = start;

			},


			handleEvent: function (e) {
				switch ( e.type ) {
					case 'touchstart':
					case 'MSPointerDown':
					case 'mousedown':
						this._start(e);
						break;
					case 'touchmove':
					case 'MSPointerMove':
					case 'mousemove':
						this._move(e);
						break;
					case 'touchend':
					case 'MSPointerUp':
					case 'mouseup':
					case 'touchcancel':
					case 'MSPointerCancel':
					case 'mousecancel':
						this._end(e);
						break;
					case 'orientationchange':
					case 'resize':
						this._resize();
						break;
					case 'transitionend':
					case 'webkitTransitionEnd':
					case 'oTransitionEnd':
					case 'MSTransitionEnd':
						this._transitionEnd(e);
						break;
					case 'wheel':
					case 'DOMMouseScroll':
					case 'mousewheel':
						this._wheel(e);
						break;
					case 'keydown':
						this._key(e);
						break;
					case 'click':
						if ( !e._constructed ) {
							e.preventDefault();
							e.stopPropagation();
						}
						break;
					case 'DOMNodeInserted':
					case 'DOMNodeRemoved':
						if ( !browser.feat.hasObserver ) {
							this.refresh();
						}
						break;
				}
				// 监听infinite item的dom节点更新，更新后刷新节点位置;
			}
		};

		function createDefaultScrollbar (direction, interactive, type) {
			var scrollbar = document.createElement('div'),
				indicator = document.createElement('div');

			if ( type === true ) {
				scrollbar.style.cssText = 'position: absolute; z-index:9999';
				indicator.style.cssText = 'position: absolute; ' + utils.prefixStyle("box-sizing") + ': border-box; background: rgba(0,0,0,0.4); ' + utils.prefixStyle("border-radius") + ': ' + utils.scale(2.5) + 'px';
			}

			indicator.className = 'iScrollIndicator';

			if ( direction == 'h' ) {
				if ( type === true ) {
					scrollbar.style.cssText += '; height:' + utils.scale(2.5) + 'px; left: ' + utils.scale(2) + 'px; right: ' + utils.scale(2) + 'px; bottom: ' + utils.scale(4) + 'px';
					indicator.style.height = '100%';
				}
				scrollbar.className = 'iScrollHorizontalScrollbar';
			} else {
				if ( type === true ) {
					scrollbar.style.cssText += '; width: ' + utils.scale(2.5) + 'px; bottom: ' + utils.scale(2) + 'px; top: ' + utils.scale(2) + 'px; right: ' + utils.scale(4) + 'px';
					indicator.style.width = '100%';
				}
				scrollbar.className = 'iScrollVerticalScrollbar';
			}

			scrollbar.style.cssText += '; overflow: hidden';

			if ( !interactive ) {
				scrollbar.style.pointerEvents = 'none';
			}

			scrollbar.appendChild(indicator);

			return scrollbar;
		}

		function Indicator (scroller, options) {
			this.wrapper = typeof options.el == 'string' ? document.querySelector(options.el) : options.el;
			this.wrapperStyle = this.wrapper.style;
			this.indicator = this.wrapper.children[0];
			this.indicatorStyle = this.indicator.style;
			this.scroller = scroller;

			this.options = {
				listenX: true,
				listenY: true,
				interactive: false,
				resize: true,
				defaultScrollbars: false,
				shrink: false,
				fade: false,
				speedRatioX: 0,
				speedRatioY: 0
			};

			for ( var i in options ) {
				this.options[i] = options[i];
			}

			this.sizeRatioX = 1;
			this.sizeRatioY = 1;
			this.maxPosX = 0;
			this.maxPosY = 0;

			if ( this.options.interactive ) {
				if ( !this.options.disableTouch ) {
					utils.addEvent(this.indicator, 'touchstart', this);
					utils.addEvent(window, 'touchend', this);
				}
				if ( !this.options.disablePointer ) {
					utils.addEvent(this.indicator, 'MSPointerDown', this);
					utils.addEvent(window, 'MSPointerUp', this);
				}
				if ( !this.options.disableMouse ) {
					utils.addEvent(this.indicator, 'mousedown', this);
					utils.addEvent(window, 'mouseup', this);
				}
			}

			if ( this.options.fade ) {
				this.wrapperStyle[browser.prefixStyle.transform] = this.scroller.translateZ;
				this.wrapperStyle[browser.prefixStyle.transitionDuration] = '0ms';
				this.wrapperStyle.opacity = '0';
			}
		}

		Indicator.prototype = {
			handleEvent: function (e) {
				switch ( e.type ) {
					case 'touchstart':
					case 'MSPointerDown':
					case 'mousedown':
						this._start(e);
						break;
					case 'touchmove':
					case 'MSPointerMove':
					case 'mousemove':
						this._move(e);
						break;
					case 'touchend':
					case 'MSPointerUp':
					case 'mouseup':
					case 'touchcancel':
					case 'MSPointerCancel':
					case 'mousecancel':
						this._end(e);
						break;
				}
			},

			destroy: function () {
				if ( this.options.interactive ) {
					utils.removeEvent(this.indicator, 'touchstart', this);
					utils.removeEvent(this.indicator, 'MSPointerDown', this);
					utils.removeEvent(this.indicator, 'mousedown', this);

					utils.removeEvent(window, 'touchmove', this);
					utils.removeEvent(window, 'MSPointerMove', this);
					utils.removeEvent(window, 'mousemove', this);

					utils.removeEvent(window, 'touchend', this);
					utils.removeEvent(window, 'MSPointerUp', this);
					utils.removeEvent(window, 'mouseup', this);
				}

				if ( this.options.defaultScrollbars ) {
					this.wrapper.parentNode.removeChild(this.wrapper);
				}
			},

			_start: function (e) {
				var point = e.touches ? e.touches[0] : e;

				e.preventDefault();
				e.stopPropagation();

				this.transitionTime();

				this.initiated = true;
				this.moved = false;
				this.lastPointX	= point.pageX;
				this.lastPointY	= point.pageY;

				this.startTime	= utils.getTime();

				if ( !this.options.disableTouch ) {
					utils.addEvent(window, 'touchmove', this);
				}
				if ( !this.options.disablePointer ) {
					utils.addEvent(window, 'MSPointerMove', this);
				}
				if ( !this.options.disableMouse ) {
					utils.addEvent(window, 'mousemove', this);
				}

				this.scroller._execEvent('beforeScrollStart');
			},

			_move: function (e) {
				var point = e.touches ? e.touches[0] : e,
					deltaX, deltaY,
					newX, newY,
					timestamp = utils.getTime();

				if ( !this.moved ) {
					this.scroller._execEvent('scrollStart');
				}

				this.moved = true;

				deltaX = point.pageX - this.lastPointX;
				this.lastPointX = point.pageX;

				deltaY = point.pageY - this.lastPointY;
				this.lastPointY = point.pageY;

				newX = this.x + deltaX;
				newY = this.y + deltaY;

				this._pos(newX, newY);

		// INSERT POINT: indicator._move

				e.preventDefault();
				e.stopPropagation();
			},

			_end: function (e) {
				if ( !this.initiated ) {
					return;
				}

				this.initiated = false;

				e.preventDefault();
				e.stopPropagation();

				utils.removeEvent(window, 'touchmove', this);
				utils.removeEvent(window, 'MSPointerMove', this);
				utils.removeEvent(window, 'mousemove', this);

				if ( this.scroller.options.snap ) {
					var snap = this.scroller._nearestSnap(this.scroller.x, this.scroller.y);

					var time = this.options.snapSpeed || Math.max(
							Math.max(
								Math.min(Math.abs(this.scroller.x - snap.x), 1000),
								Math.min(Math.abs(this.scroller.y - snap.y), 1000)
							), 300);

					if ( this.scroller.x != snap.x || this.scroller.y != snap.y ) {
						this.scroller.directionX = 0;
						this.scroller.directionY = 0;
						this.scroller.currentPage = snap;
						this.scroller.scrollTo(snap.x, snap.y, time, this.scroller.options.bounceEasing);
					}
				}

				if ( this.moved ) {
					this.scroller._execEvent('scrollEnd');
				}
			},

			transitionTime: function (time) {
				time = time || 0;
				this.indicatorStyle[browser.prefixStyle.transitionDuration] = time + 'ms';
			},

			transitionTimingFunction: function (easing) {
				this.indicatorStyle[browser.prefixStyle.transitionTimingFunction] = easing;
			},

			refresh: function () {
				this.transitionTime();

				if ( this.options.listenX && !this.options.listenY ) {
					this.indicatorStyle.display = this.scroller.hasHorizontalScroll ? 'block' : 'none';
				} else if ( this.options.listenY && !this.options.listenX ) {
					this.indicatorStyle.display = this.scroller.hasVerticalScroll ? 'block' : 'none';
				} else {
					this.indicatorStyle.display = this.scroller.hasHorizontalScroll || this.scroller.hasVerticalScroll ? 'block' : 'none';
				}

				if ( this.scroller.hasHorizontalScroll && this.scroller.hasVerticalScroll ) {
					$(this.wrapper).addClass('iScrollBothScrollbars').removeClass('iScrollLoneScrollbar');

					if ( this.options.defaultScrollbars && this.options.customStyle ) {
						if ( this.options.listenX ) {
							this.wrapper.style.right = utils.scale(4) + 'px';
						} else {
							this.wrapper.style.bottom = utils.scale(4) + 'px';
						}
					}
				} else {
					$(this.wrapper).removeClass('iScrollBothScrollbars').addClass('iScrollLoneScrollbar');

					if ( this.options.defaultScrollbars && this.options.customStyle ) {
						if ( this.options.listenX ) {
							this.wrapper.style.right = utils.scale(2) + 'px';
						} else {
							this.wrapper.style.bottom = utils.scale(2) + 'px';
						}
					}
				}

				var r = this.wrapper.offsetHeight;	// force refresh

				if ( this.options.listenX ) {
					this.wrapperWidth = this.wrapper.clientWidth;
					if ( this.options.resize ) {
						this.indicatorWidth = Math.max(Math.round(this.wrapperWidth * this.wrapperWidth / (this.scroller.scrollerWidth || this.wrapperWidth || utils.scale(1))), utils.scale(4));
						this.indicatorStyle.width = this.indicatorWidth + 'px';
					} else {
						this.indicatorWidth = this.indicator.clientWidth;
					}

					this.maxPosX = this.wrapperWidth - this.indicatorWidth;

					if ( this.options.shrink == 'clip' ) {
						this.minBoundaryX = -this.indicatorWidth + utils.scale(4);
						this.maxBoundaryX = this.wrapperWidth - utils.scale(4);
					} else {
						this.minBoundaryX = 0;
						this.maxBoundaryX = this.maxPosX;
					}

					this.sizeRatioX = this.options.speedRatioX || (this.scroller.maxScrollX && (this.maxPosX / this.scroller.maxScrollX));	
				}

				if ( this.options.listenY ) {
					this.wrapperHeight = this.wrapper.clientHeight;
					if ( this.options.resize ) {
						this.indicatorHeight = Math.max(Math.round(this.wrapperHeight * this.wrapperHeight / (this.scroller.scrollerHeight || this.wrapperHeight || utils.scale(1))), utils.scale(4));
						this.indicatorStyle.height = this.indicatorHeight + 'px';
					} else {
						this.indicatorHeight = this.indicator.clientHeight;
					}

					this.maxPosY = this.wrapperHeight - this.indicatorHeight;

					if ( this.options.shrink == 'clip' ) {
						this.minBoundaryY = -this.indicatorHeight + utils.scale(4);
						this.maxBoundaryY = this.wrapperHeight - utils.scale(4);
					} else {
						this.minBoundaryY = 0;
						this.maxBoundaryY = this.maxPosY;
					}

					this.maxPosY = this.wrapperHeight - this.indicatorHeight;
					this.sizeRatioY = this.options.speedRatioY || (this.scroller.maxScrollY && (this.maxPosY / this.scroller.maxScrollY));
				}

				this.updatePosition();
			},

			updatePosition: function () {
				var x = this.options.listenX && Math.round(this.sizeRatioX * this.scroller.x) || 0,
					y = this.options.listenY && Math.round(this.sizeRatioY * this.scroller.y) || 0;

				if ( !this.options.ignoreBoundaries ) {
					if ( x < this.minBoundaryX ) {
						if ( this.options.shrink == 'scale' ) {
							this.width = Math.max(this.indicatorWidth + x, utils.scale(4));
							this.indicatorStyle.width = this.width + 'px';
						}
						x = this.minBoundaryX;
					} else if ( x > this.maxBoundaryX ) {
						if ( this.options.shrink == 'scale' ) {
							this.width = Math.max(this.indicatorWidth - (x - this.maxPosX), utils.scale(4));
							this.indicatorStyle.width = this.width + 'px';
							x = this.maxPosX + this.indicatorWidth - this.width;
						} else {
							x = this.maxBoundaryX;
						}
					} else if ( this.options.shrink == 'scale' && this.width != this.indicatorWidth ) {
						this.width = this.indicatorWidth;
						this.indicatorStyle.width = this.width + 'px';
					}

					if ( y < this.minBoundaryY ) {
						if ( this.options.shrink == 'scale' ) {
							this.height = Math.max(this.indicatorHeight + y * 3, utils.scale(4));
							this.indicatorStyle.height = this.height + 'px';
						}
						y = this.minBoundaryY;
					} else if ( y > this.maxBoundaryY ) {
						if ( this.options.shrink == 'scale' ) {
							this.height = Math.max(this.indicatorHeight - (y - this.maxPosY) * 3, utils.scale(4));
							this.indicatorStyle.height = this.height + 'px';
							y = this.maxPosY + this.indicatorHeight - this.height;
						} else {
							y = this.maxBoundaryY;
						}
					} else if ( this.options.shrink == 'scale' && this.height != this.indicatorHeight ) {
						this.height = this.indicatorHeight;
						this.indicatorStyle.height = this.height + 'px';
					}
				}

				this.x = x;
				this.y = y;

				if ( this.scroller.options.useTransform ) {
					this.indicatorStyle[browser.prefixStyle.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.scroller.translateZ;
				} else {
					this.indicatorStyle.left = x + 'px';
					this.indicatorStyle.top = y + 'px';
				}
			},

			_pos: function (x, y) {
				if ( x < 0 ) {
					x = 0;
				} else if ( x > this.maxPosX ) {
					x = this.maxPosX;
				}

				if ( y < 0 ) {
					y = 0;
				} else if ( y > this.maxPosY ) {
					y = this.maxPosY;
				}

				x = this.options.listenX ? Math.round(x / this.sizeRatioX) : this.scroller.x;
				y = this.options.listenY ? Math.round(y / this.sizeRatioY) : this.scroller.y;

				this.scroller.scrollTo(x, y);
			},

			fade: function (val, hold) {
				if ( hold && !this.visible ) {
					return;
				}

				clearTimeout(this.fadeTimeout);
				this.fadeTimeout = null;

				var time = val ? 250 : 500,
					delay = val ? 0 : 300;

				val = val ? '1' : '0';

				this.wrapperStyle[browser.prefixStyle.transitionDuration] = time + 'ms';

				this.fadeTimeout = setTimeout((function (val) {
					this.wrapperStyle.opacity = val;
					this.visible = +val;
				}).bind(this, val), delay);
			}
		};

		Scroll.browser = browser;
		Scroll.utils = utils;

		return Scroll;
	})(window, document, Math);
})