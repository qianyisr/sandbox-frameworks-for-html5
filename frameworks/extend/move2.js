define(function(require, exports, module) {
    'use strict';

    var $ = require("Jquery");
    var device = require("Device");

    var browser = {
            prefixStyle : device.feat.prefixStyle
        }


    var once = (function () {
        var n = 0;
        var global = (function () { return this })();

        return function (fn) {
            var id = n++;
            var called;
            function once () {
                // no receiver
                if ( this == global ) {
                    if ( called ) return;
                    called = true;
                    return fn.apply(this, arguments);
                }

                // receiver
                var key = '__called_' + id + '__';
                if ( this[key] ) return;
                this[key] = true;

                return fn.apply(this, arguments);
            }

            return once;
        };
    })();

    var hasTranslate3d = function () {
        //device.feat.prefixStyle('perspective') && typeof getComputedStyle === 'function';

        var prop = device.feat.prefixStyle('transform');

        if (!prop || !window.getComputedStyle) {
            return false;

        } else {
            var map = {
              webkitTransform: '-webkit-transform',
              OTransform: '-o-transform',
              msTransform: '-ms-transform',
              MozTransform: '-moz-transform',
              transform: 'transform'
            }
        };

        var el = document.createElement('div');
        el.style[prop] = 'translate3d(1px,1px,1px)';
        document.body.insertBefore(el, null);
        var val = getComputedStyle(el).getPropertyValue(map[prop]);
        document.body.removeChild(el);

        return null != val && val.length && 'none' != val;

    };

    var afterTransition = function () {

        var hasTransitions = device.feat.prefixStyle('transition')
        , transitionend = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd'
        ;

        /**
        * Invoke the given `fn` after transitions
        *
        * It will be invoked only if the browser
        * supports transitions __and__
        * the element has transitions
        * set in `.style` or css.
        *
        * @param {Element} el
        * @param {Function} fn
        * @return {Function} fn
        * @api public
        */

        function after (el, fn) {
            if ( !hasTransitions ) return fn();
            $(el).bind(transitionend, fn);
            return fn;
        };

        /**
        * Same as `after()` only the function is invoked once.
        *
        * @param {Element} el
        * @param {Function} fn
        * @return {Function}
        * @api public
        */

        after.once = function (el, fn) {
            var callback = once(fn);
            after(el, fn = function () {
                  $(el).unbind(transitionend, fn);
                  callback();
                }
            )
        }

        return after;

    };



    function Emitter (obj) {
        if ( obj ) return mixin(obj);
    };

    /**
    * Mixin the emitter properties.
    *
    * @param {Object} obj
    * @return {Object}
    * @api private
    */

    function mixin (obj) {
        for (var key in Emitter.prototype) {
          obj[key] = Emitter.prototype[key];
        }
        return obj;
    }

    /**
    * Listen on the given `event` with `fn`.
    *
    * @param {String} event
    * @param {Function} fn
    * @return {Emitter}
    * @api public
    */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function (event, fn) {
        this._callbacks = this._callbacks || {};
        (this._callbacks[event] = this._callbacks[event] || []).push(fn);
        return this;
    };

    /**
    * Adds an `event` listener that will be invoked a single
    * time then automatically removed.
    *
    * @param {String} event
    * @param {Function} fn
    * @return {Emitter}
    * @api public
    */

    Emitter.prototype.once = function (event, fn) {
        var self = this;
        this._callbacks = this._callbacks || {};

        function on () {
            self.off(event, on);
            fn.apply(this, arguments);
        }

        on.fn = fn;
        this.on(event, on);
        return this;
    };

    /**
    * Remove the given callback for `event` or all
    * registered callbacks.
    *
    * @param {String} event
    * @param {Function} fn
    * @return {Emitter}
    * @api public
    */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function (event, fn) {
        this._callbacks = this._callbacks || {};

        // all
        if (0 == arguments.length) {
            this._callbacks = {};
            return this;
        }

        // specific event
        var callbacks = this._callbacks[event];
        if ( !callbacks ) return this;

        // remove all handlers
        if (1 == arguments.length) {
            delete this._callbacks[event];
            return this;
        }

        // remove specific handler
        var cb;
        for (var i = 0; i < callbacks.length; i++) {
            cb = callbacks[i];
            if (cb === fn || cb.fn === fn) {
                callbacks.splice(i, 1);
                break;
            }
        }

        return this;
    };

    /**
    * Emit `event` with the given args.
    *
    * @param {String} event
    * @param {Mixed} ...
    * @return {Emitter}
    */

    Emitter.prototype.emit = function (event) {
        this._callbacks = this._callbacks || {};
        var args = [].slice.call(arguments, 1)
          , callbacks = this._callbacks[event];

        if ( callbacks ) {
            callbacks = callbacks.slice(0);
            for (var i = 0, len = callbacks.length; i < len; ++i) {
                callbacks[i].apply(this, args);
            }
        }

        return this;
    };

    /**
    * Return array of callbacks for `event`.
    *
    * @param {String} event
    * @return {Array}
    * @api public
    */

    Emitter.prototype.listeners = function (event) {
        this._callbacks = this._callbacks || {};
        return this._callbacks[event] || [];
    };

    /**
    * Check if this emitter has `event` handlers.
    *
    * @param {String} event
    * @return {Boolean}
    * @api public
    */

    Emitter.prototype.hasListeners = function (event) {
        return !! this.listeners(event).length;
    };



    /**
    * CSS Easing functions
    */

    var ease = {
          'in':                'ease-in'
        , 'out':               'ease-out'
        , 'in-out':            'ease-in-out'
        , 'snap':              'cubic-bezier(0,1,.5,1)'
        , 'linear':            'cubic-bezier(0.250, 0.250, 0.750, 0.750)'
        , 'ease-in-quad':      'cubic-bezier(0.550, 0.085, 0.680, 0.530)'
        , 'ease-in-cubic':     'cubic-bezier(0.550, 0.055, 0.675, 0.190)'
        , 'ease-in-quart':     'cubic-bezier(0.895, 0.030, 0.685, 0.220)'
        , 'ease-in-quint':     'cubic-bezier(0.755, 0.050, 0.855, 0.060)'
        , 'ease-in-sine':      'cubic-bezier(0.470, 0.000, 0.745, 0.715)'
        , 'ease-in-expo':      'cubic-bezier(0.950, 0.050, 0.795, 0.035)'
        , 'ease-in-circ':      'cubic-bezier(0.600, 0.040, 0.980, 0.335)'
        , 'ease-in-back':      'cubic-bezier(0.600, -0.280, 0.735, 0.045)'
        , 'ease-out-quad':     'cubic-bezier(0.250, 0.460, 0.450, 0.940)'
        , 'ease-out-cubic':    'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
        , 'ease-out-quart':    'cubic-bezier(0.165, 0.840, 0.440, 1.000)'
        , 'ease-out-quint':    'cubic-bezier(0.230, 1.000, 0.320, 1.000)'
        , 'ease-out-sine':     'cubic-bezier(0.390, 0.575, 0.565, 1.000)'
        , 'ease-out-expo':     'cubic-bezier(0.190, 1.000, 0.220, 1.000)'
        , 'ease-out-circ':     'cubic-bezier(0.075, 0.820, 0.165, 1.000)'
        , 'ease-out-back':     'cubic-bezier(0.175, 0.885, 0.320, 1.275)'
        , 'ease-in-out-quad':  'cubic-bezier(0.455, 0.030, 0.515, 0.955)'
        , 'ease-in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1.000)'
        , 'ease-in-out-quart': 'cubic-bezier(0.770, 0.000, 0.175, 1.000)'
        , 'ease-in-out-quint': 'cubic-bezier(0.860, 0.000, 0.070, 1.000)'
        , 'ease-in-out-sine':  'cubic-bezier(0.445, 0.050, 0.550, 0.950)'
        , 'ease-in-out-expo':  'cubic-bezier(1.000, 0.000, 0.000, 1.000)'
        , 'ease-in-out-circ':  'cubic-bezier(0.785, 0.135, 0.150, 0.860)'
        , 'ease-in-out-back':  'cubic-bezier(0.680, -0.550, 0.265, 1.550)'
    };



    /**
    * Module Dependencies.
    */

    var after = afterTransition();
    var has3d = hasTranslate3d();

    /**
    * CSS Translate
    */

    var translate = has3d
    ? ['translate3d(', ', 0)']
    : ['translate(', ')'];

    /**
    * Get computed style.
    */

    var style = window.getComputedStyle
    || window.currentStyle;

    /**
    * Export `ease`
    */

    Move.ease = ease;

    /**
    * Defaults.
    *
    *   `duration` - default duration of 500ms
    *
    */

    Move.defaults = {
        duration: 500
    };

    /**
    * Default element selection utilized by `move(selector)`.
    *
    * Override to implement your own selection, for example
    * with jQuery one might write:
    *
    *     move.select = function(selector) {
    *       return jQuery(selector).get(0);
    *     };
    *
    * @param {Object|String} selector
    * @return {Element}
    * @api public
    */

    Move.select = function (selector) {
        if ('string' != typeof selector) return selector;
        return $(selector)[0];
    };

    /**
    * Initialize a new `Move` with the given `el`.
    *
    * @param {Element} el
    * @api public
    */

    function Move (el) {
        if (!(this instanceof Move)) return new Move(el);
        if ('string' == typeof el) el = $(el)[0];
        if (!el) throw new TypeError('Move must be initialized with element or selector');
        this.el = el;
        this._props = {};
        this._rotate = 0;
        this._transitionProps = [];
        this._transforms = [];
        this.duration(Move.defaults.duration)
    };


    /**
    * Inherit from `EventEmitter.prototype`.
    */

    Emitter(Move.prototype);

    /**
    * Buffer `transform`.
    *
    * @param {String} transform
    * @return {Move} for chaining
    * @api private
    */

    Move.prototype.transform = function (transform) {
        this._transforms.push(transform);
        return this;
    };

    /**
    * Skew `x` and `y`.
    *
    * @param {Number} x
    * @param {Number} y
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.skew = function (x, y) {
        return this.transform('skew('
          + x + 'deg, '
          + (y || 0)
          + 'deg)');
    };

    /**
    * Skew x by `n`.
    *
    * @param {Number} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.skewX = function (n) {
        return this.transform('skewX(' + n + 'deg)');
    };

    /**
    * Skew y by `n`.
    *
    * @param {Number} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.skewY = function (n) {
        return this.transform('skewY(' + n + 'deg)');
    };

    /**
    * Translate `x` and `y` axis.
    *
    * @param {Number} x
    * @param {Number} y
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.translate =
    Move.prototype.to = function (x, y) {
        return this.transform(translate.join(''
          + x +'px, '
          + (y || 0)
          + 'px'));
    };

    /**
    * Translate on the x axis to `n`.
    *
    * @param {Number} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.translateX =
    Move.prototype.x = function (n) {
        return this.transform('translateX(' + n + 'px)');
    };

    /**
    * Translate on the y axis to `n`.
    *
    * @param {Number} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.translateY =
    Move.prototype.y = function (n) {
        return this.transform('translateY(' + n + 'px)');
    };

    Move.prototype.translateZ =
    Move.prototype.z = function (n) {
        return this.transform('translateZ(' + n + 'px)');
    };

    /**
    * Scale the x and y axis by `x`, or
    * individually scale `x` and `y`.
    *
    * @param {Number} x
    * @param {Number} y
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.scale = function (x, y) {
        return this.transform('scale('
          + x + ', '
          + (y || x)
          + ')');
    };

    /**
    * Scale x axis by `n`.
    *
    * @param {Number} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.scaleX = function (n) {
        return this.transform('scaleX(' + n + ')')
    };

    /**
    * Apply a matrix transformation
    *
    * @param {Number} m11 A matrix coefficient
    * @param {Number} m12 A matrix coefficient
    * @param {Number} m21 A matrix coefficient
    * @param {Number} m22 A matrix coefficient
    * @param {Number} m31 A matrix coefficient
    * @param {Number} m32 A matrix coefficient
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.matrix = function (m11, m12, m21, m22, m31, m32) {
        return this.transform('matrix(' + [m11,m12,m21,m22,m31,m32].join(',') + ')');
    };

    /**
    * Scale y axis by `n`.
    *
    * @param {Number} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.scaleY = function (n) {
        return this.transform('scaleY(' + n + ')')
    };

    /**
    * Rotate `n` degrees.
    *
    * @param {Number} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.rotate = function (n) {
        return this.transform('rotate(' + n + 'deg)');
    };

    Move.prototype.rotateX = function (n) {
        return this.transform('rotateX(' + n + 'deg)');
    };

    Move.prototype.rotateY = function (n) {
        return this.transform('rotateY(' + n + 'deg)');
    };

    Move.prototype.rotateZ = function (n) {
        return this.transform('rotateZ(' + n + 'deg)');
    };

    Move.prototype.rotate3d = function (x, y, z, d) {
        return this.transform('rotate3d(' + x + 'px, ' + y + 'px,' + z +'px,' + d + 'deg)');
    };

    Move.prototype.perspective = function (z) {
        this.el.parentNode.style.setProperty(browser.prefixStyle('transform-style', true), 'preserve-3d', '');
        this.el.parentNode.style.setProperty(browser.prefixStyle('perspective', true), z + 'px', '');
        return this;
    };

    /**
    * Set transition easing function to to `fn` string.
    *
    * When:
    *
    *   - null "ease" is used
    *   - "in" "ease-in" is used
    *   - "out" "ease-out" is used
    *   - "in-out" "ease-in-out" is used
    *
    * @param {String} fn
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.ease = function (fn) {
        fn = ease[fn] || fn || 'ease';
        return this.setProperty('transition-timing-function', fn);
    };

    /**
    * Set animation properties
    *
    * @param {String} name
    * @param {Object} props
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.animate = function (name, props) {
        for (var i in props){
          if ( props.hasOwnProperty(i) ) {
            this.setProperty('animation-' + i, props[i])
          }
        }
        return this.setProperty('animation-name', name);
    }

    /**
    * Set duration to `n`.
    *
    * @param {Number|String} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.duration = function (n) {
        n = this._duration = 'string' == typeof n
          ? parseFloat(n) * 1000
          : n;
        return this.setProperty('transition-duration', n + 'ms');
    };

    /**
    * Delay the animation by `n`.
    *
    * @param {Number|String} n
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.delay = function (n) {
        n = 'string' == typeof n
          ? parseFloat(n) * 1000
          : n;
        return this.setProperty('transition-delay', n + 'ms');
    };

    /**
    * Set `prop` to `val`, deferred until `.end()` is invoked.
    *
    * @param {String} prop
    * @param {String} val
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.setProperty = function (prop, val) {
        this._props[prop] = val;
        return this;
    };

    /**
    * Set `prop` to `value`, deferred until `.end()` is invoked
    * and adds the property to the list of transition props.
    *
    * @param {String} prop
    * @param {String} val
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.set = function (prop, val) {
        this.transition(prop);
        this._props[prop] = val;
        return this;
    };

    /**
    * Increment `prop` by `val`, deferred until `.end()` is invoked
    * and adds the property to the list of transition props.
    *
    * @param {String} prop
    * @param {Number} val
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.add = function (prop, val) {
        if (!style) return;
        var self = this;
        return this.on('start', function () {
          var curr = parseInt(self.current(prop), 10);
          self.set(prop, curr + val + 'px');
        });
    };

    /**
    * Decrement `prop` by `val`, deferred until `.end()` is invoked
    * and adds the property to the list of transition props.
    *
    * @param {String} prop
    * @param {Number} val
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.sub = function (prop, val) {
        if (!style) return;
        var self = this;
        return this.on('start', function () {
          var curr = parseInt(self.current(prop), 10);
          self.set(prop, curr - val + 'px');
        });
    };

    /**
    * Get computed or "current" value of `prop`.
    *
    * @param {String} prop
    * @return {String}
    * @api public
    */

    Move.prototype.current = function (prop) {
        return style(this.el).getPropertyValue(prop);
    };

    /**
    * Add `prop` to the list of internal transition properties.
    *
    * @param {String} prop
    * @return {Move} for chaining
    * @api private
    */

    Move.prototype.transition = function (prop) {
        if (!this._transitionProps.indexOf(prop)) return this;
        this._transitionProps.push(prop);
        return this;
    };

    /**
    * Commit style properties, aka apply them to `el.style`.
    *
    * @return {Move} for chaining
    * @see Move#end()
    * @api private
    */

    Move.prototype.applyProperties = function () {
        for (var prop in this._props) {
          this.el.style.setProperty(browser.prefixStyle(prop, true), this._props[prop], '');
        }
        return this;
    };

    /**
    * Re-select element via `selector`, replacing
    * the current element.
    *
    * @param {String} selector
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.move =
    Move.prototype.select = function (selector) {
        this.el = Move.select(selector);
        return this;
    };

    /**
    * Defer the given `fn` until the animation
    * is complete. `fn` may be one of the following:
    *
    *   - a function to invoke
    *   - an instanceof `Move` to call `.end()`
    *   - nothing, to return a clone of this `Move` instance for chaining
    *
    * @param {Function|Move} fn
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.then = function (fn) {
        // invoke .end()
        if ( fn instanceof Move ) {
          this.on('end', function () {
            fn.end();
          });
        // callback
        } else if ('function' == typeof fn) {
          this.on('end', fn);
        // chain
        } else {
          var clone = new Move(this.el);
          clone._transforms = this._transforms.slice(0);
          this.then(clone);
          clone.parent = this;
          return clone;
        }

        return this;
    };

    /**
    * Pop the move context.
    *
    * @return {Move} parent Move
    * @api public
    */

    Move.prototype.pop = function () {
        return this.parent;
    };

    /**
    * Reset duration.
    *
    * @return {Move}
    * @api public
    */

    Move.prototype.clear = function () {
        this.el.style[browser.prefixStyle('transitionDuration')] = '';
        return this;
    };

    /**
    * Start animation, optionally calling `fn` when complete.
    *
    * @param {Function} fn
    * @return {Move} for chaining
    * @api public
    */

    Move.prototype.end = function (fn) {
        var self = this;

        // emit "start" event
        this.emit('start');

        // transforms
        if ( this._transforms.length ) {
            this.setProperty('transform', this._transforms.join(' '));
        }

        // transition properties
        this.setProperty('transition-properties', this._transitionProps.join(', '));
        this.applyProperties();

        // callback given
        if (fn) this.then(fn);

        // emit "end" when complete
        after.once(this.el, function () {
            self.clear();
            self.emit('end');
        });

        return this;
    };

    return Move;
});