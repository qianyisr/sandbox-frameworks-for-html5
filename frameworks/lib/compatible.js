"use strict";
var compatible = (function () {
    // viewport;
    var isHighDpi = window.devicePixelRatio > 2;
    var targetDensitydpi = isHighDpi ? "" : ", target-densitydpi=device-dpi";
    var scale = 1 / window.devicePixelRatio;

    window.document.write('<meta name="viewport" content="user-scalable=no, initial-scale=' + scale + ', width=device-width' + targetDensitydpi + '" />');

    var userAgent = navigator.userAgent;

    var os = {};
        os.webkit = userAgent.match(/WebKit\/([\d.]+)/) ? true : false;
        os.fennec = userAgent.match(/fennec/i) ? true : userAgent.match(/Firefox/) ? true : false;
        os.ie = userAgent.match(/MSIE 10.0/i) ? true : false;
        os.opera = userAgent.match(/Opera/) ? true : false;

    var Prefix = os.webkit ? "Webkit" : os.fennec ? "Moz" : os.ie ? "ms" : os.opera ? "O" : "";
    var cat = Prefix.length;

    var vendorX = new RegExp("^" + Prefix, "ig");
    var sizeX = /\b(\d*\.?\d+)+(px|dp|vm|vw|vh)\b/ig;

    // define unit;
    window.Unit = {
        px : 1,
        dp : window.devicePixelRatio || 1,
        vw : window.innerWidth / 100,
        vh : window.innerHeight / 100,
        vm : Math.min(window.innerWidth, window.innerHeight) / 100
    };

    window.SandboxFunction = (function () {
        var sandbox = document.createElement('iframe');
            sandbox.style.display = 'none';

        document.documentElement.appendChild(sandbox);

        var sandboxWindow = sandbox.contentWindow.window,
            sandboxFunction = sandboxWindow.Function;

        document.documentElement.removeChild(sandbox);

        return sandboxFunction;
    })();

    return function (window) {
        var top = window.top == window.self;

        // 修正开发商前缀为W3C API
        for ( var key in window ) {
            var vendor = vendorX.exec(key);

            if ( vendor ) {
                var start = key.charAt(cat);
                var rekey = key.substr(cat);

                if ( start > 'A' || start < 'Z' ) {
                    window[rekey] = window[rekey] || window[key];
                }
            }
        }

        /* time */
        if ( !window.Date.now ) {
            window.Date.now = function () {
                return new Date().getTime();
            };
        }

        /* requestAnimationFrame & cancelAnimationFrame */
        if ( !window.requestAnimationFrame || !window.cancelAnimationFrame ) {
            var lastTime = 0;
            window.requestAnimationFrame = function(callback) {
                var now = Date.now();
                var nextTime = Math.max(lastTime + 16, now);
                return setTimeout(function () { callback(lastTime = nextTime); }, nextTime - now);
            };
            window.cancelAnimationFrame = window.clearTimeout;
        }

        // MutationObserver;
        window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

        // AudioContext;
        window.AudioContext = window.AudioContext || window.WebKitAudioContext || window.MozAudioContext;

        // sandbox;
        window.SandboxFunction = window.SandboxFunction || window.top.SandboxFunction;

        // safe eval;
        window.seval = function (code) {
            //安全闭包;
            return new SandboxFunction(' try { return ' + code + ' } catch (e) { console.log("safe-eval error!" + e) };')();
        };

        // style.set;
        window.CSSStyleDeclaration.prototype.set = function (propertyName, value) {

            var vendors = [Prefix + propertyName, propertyName];

            value = value.replaceAll(sizeX, function (size, length, unit) { 
                return length * Unit[unit] + 'px';
            });

            for (var i = vendors.length - 1; i >= 0; i--) {
                var propertyName = vendors[i];

                if ( this.propertyIsEnumerable(propertyName) ) {
                    this.setProperty(propertyName, value)
                }
            };
        };

        // style.remove;
        window.CSSStyleDeclaration.prototype.remove = function (propertyName) {
            var vendors = [Prefix + propertyName, propertyName];

            for (var i = vendors.length - 1; i >= 0; i--) {
                var propertyName = vendors[i];

                if ( this.propertyIsEnumerable(propertyName) ) {
                    this.removeProperty(propertyName)
                }
            };
        };


        // String functions
        if ( !''.trim ) {
            window.String.prototype.trim = function () {
                return this.replace(/^\s+|\s+$/g, '');
            };
        }

        window.String.prototype.removeQuotes = function () {
            return this.replace(/\"|\'/g, '');
        };

        window.String.prototype.repeat = function (n) {
            return new Array(1 + n).join(this);
        };

        window.String.prototype.replaceAll = function(reallyDo, replaceWith, ignoreCase) {  
            if ( !RegExp.prototype.isPrototypeOf(reallyDo) ) {  
                return this.replace(new RegExp(reallyDo, (ignoreCase ? "gi": "g")), replaceWith);  
            } else {  
                return this.replace(reallyDo, replaceWith);  
            }  
        };

        (function(DOMParser) {
          var
            DOMParser_proto = DOMParser.prototype,
            real_parseFromString = DOMParser_proto.parseFromString;

          // Firefox/Opera/IE throw errors on unsupported types
          try {
            // WebKit returns null on unsupported types
            if ((new DOMParser).parseFromString("", "text/html")) {
              // text/html parsing is natively supported
              return;
            }
          } catch (ex) {}

          DOMParser_proto.parseFromString = function(markup, type) {
            if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
              var
                doc = document.implementation.createHTMLDocument("")
                ;
              if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                doc.documentElement.innerHTML = markup;
              }
              else {
                doc.body.innerHTML = markup;
              }
              return doc;
            } else {
              return real_parseFromString.apply(this, arguments);
            }
          };

        })(window.DOMParser);

    }
    
})();

compatible(window);