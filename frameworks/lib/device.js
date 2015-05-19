define(function (require, exports, module) {
    "use strict";

    // 设备属性检测;
    // Detect;
    var detect = (function (userAgent) {
        var os = {};
        os.webkit = userAgent.match(/WebKit\/([\d.]+)/) ? true : false;
        os.android = userAgent.match(/(Android)\s+([\d.]+)/) || userAgent.match(/Silk-Accelerated/) ? true : false;
        os.androidICS = os.android && userAgent.match(/(Android)\s4/) ? true : false;
        os.ipad = userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false;
        os.iphone = !os.ipad && userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false;
        os.webos = userAgent.match(/(webOS|hpwOS)[\s\/]([\d.]+)/) ? true : false;
        os.touchpad = os.webos && userAgent.match(/TouchPad/) ? true : false;
        os.ios = os.ipad || os.iphone;
        os.playbook = userAgent.match(/PlayBook/) ? true : false;
        os.blackberry10 = userAgent.match(/BB10/) ? true : false;
        os.blackberry = os.playbook || os.blackberry10|| userAgent.match(/BlackBerry/) ? true : false;
        os.chrome = userAgent.match(/Chrome/) ? true : false;
        os.opera = userAgent.match(/Opera/) ? true : false;
        os.fennec = userAgent.match(/fennec/i) ? true : userAgent.match(/Firefox/) ? true : false;
        os.ie = userAgent.match(/MSIE 10.0/i) ? true : false;
        os.ieTouch = os.ie && userAgent.toLowerCase().match(/touch/i) ? true : false;
        os.supportsTouch = ((window.DocumentTouch && document instanceof window.DocumentTouch) || 'ontouchstart' in window);

        if (os.ios)
            os.iosVersion = parseFloat(userAgent.slice(userAgent.indexOf("Version/")+8));
        if (os.android && !os.webkit)
            os.android = false;
        if (os.android) 
            os.androidVersion = parseFloat(userAgent.slice(userAgent.indexOf("Android")+8));

        // features
        var feat = {};
        var head = document.documentElement.getElementsByTagName("head")[0];
        feat.touch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
        feat.nativeTouchScroll = typeof(head.style["-webkit-overflow-scrolling"]) !== "undefined";
        feat.cssPrefix = os.webkit ? "Webkit" : os.fennec ? "Moz" : os.ie ? "ms" : os.opera ? "O" : "";
        feat.cssPrefixText = os.webkit ? "-webkit-" : os.fennec ? "-moz-" : os.ie ? "-ms-" : os.opera ? "-O-" : "";
        feat.cssTransformStart = !os.opera ? "3d(" : "(";
        feat.cssTransformEnd = !os.opera ? ",0)" : ")";

        // This should find all Android browsers lower than build 535.19 (both stock browser and webview)
        feat.isBadTransition = os.android && os.androidVersion < 4.4 && !os.chrome;
        feat.isBadAndroid = window.devicePixelRatio < 2 && screen.width < 640 && os.androidVersion < 4.1;

        // 是否支持observer；
        feat.observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver || false;

        // 是否支持贞动画；
        feat.keyframes = window.CSSRule.WEBKIT_KEYFRAMES_RULE || window.CSSRule.MOZ_KEYFRAMES_RULE || window.CSSRule.MS_KEYFRAMES_RULE || window.CSSRule.O_KEYFRAMES_RULE;
        feat.keyframesPrefix = window.CSSRule.WEBKIT_KEYFRAMES_RULE ? '-webkit-' : false || window.CSSRule.MOZ_KEYFRAMES_RULE ? '-moz-' : false || window.CSSRule.MS_KEYFRAMES_RULE ? '-ms-' : false || window.CSSRule.O_KEYFRAMES_RULE ? '-o-' : false || '';

        //判断浏览器是否支持DOM树结构改变
        feat.mutations = (function (document) {
            var type = [
                    "DOMSubtreeModified",
                    "DOMNodeInserted",
                    "DOMNodeRemoved",
                    "DOMNodeRemovedFromDocument",
                    "DOMNodeInsertedIntoDocument",
                    "DOMAttrModified",
                    "DOMCharacterDataModified"
                ],
                documentElement = document.documentElement,
                method = "EventListener",
                data = "deleteData",
                p = document.createElement("p"),
                mutations = {},
                i
            ;
            function check(addOrRemove) {
                for (i = type.length; i--;) {
                    p[addOrRemove](type[i], cb, false);
                    documentElement[addOrRemove](type[i], cb, false);
                }
            }
            function cb(e) {
                mutations[e.type] = true;
            }
            check("add" + method);
            documentElement.insertBefore(
                p,
                documentElement.lastChild
            );
            p.setAttribute("i", i);
            p = p.appendChild(document.createTextNode(i));
            data in p && p[data](0, 1);
            documentElement.removeChild(p = p.parentNode);
            check("remove" + method);
            return (p = mutations);
        }(document));
        
        var _JSPROPMAPS = {},
            _CSSPROPMAPS = {},
            _ELEMENT = document.createElement('div'),
            _STYLE   = _ELEMENT.style,
            VENDORS  = ['webkit', 'Moz', 'ms', 'O'],
            PREFIXS  = ['-webkit-', '-moz-', '-ms-', '-O-']
        ;

        feat.prefixStyle = function (prop, css) {
            var api;

            if ( css && prop in _CSSPROPMAPS ) {
                return _CSSPROPMAPS[prop];
            } else if ( !css && prop in _JSPROPMAPS ) {
                return _JSPROPMAPS[prop];
            }
            
            for ( var i = 0, l = VENDORS.length; i < l; i++ ) {

                api = VENDORS[i] + ('-' + prop).replace(/-(\w)/g,function () { return arguments[1].toUpperCase(); });

                if ( api in _STYLE ) return css ? _CSSPROPMAPS[prop] = PREFIXS[i] + prop : _JSPROPMAPS[prop] = api;
            }

            if ( prop in _STYLE ) return css ? _CSSPROPMAPS[prop] = prop : _JSPROPMAPS[prop] = prop;

            return css ? _CSSPROPMAPS[prop] = prop : _JSPROPMAPS[prop] = false;
        };

        return {
            os : os,
            feat : feat
        }
    })(navigator.userAgent);

    var ui,
        dpi,
        width,
        height;

    dpi = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    ui = {
        "dpi"    : dpi,
        "scale"  : dpi,
        "width"  : width,
        "height" : height,
        "os"     : detect.os
    };

    return {
        ui   : ui,
        os   : detect.os,
        feat : detect.feat
    }

})