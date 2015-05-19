define(function(require, exports, module) {
    'use strict';

    var $ = require("Jquery"),
        device = require('Device'),
        async = require("Async"),
        storage = require("Storage")
    ;

    var browser = {
          isBadTransition : device.feat.isBadTransition,
          isBadGPU        : device.feat.isBadAndroid,
          hasObserver     : device.feat.observer,
          prefixStyle     : {
                                transform : device.feat.prefixStyle('transform'),
                                translateZ : device.feat.prefixStyle('perspective') ? ' translateZ(0)' : ''
                            }
        };

    // Trans to this module;
    function Transform () {
        'use strict';

        if ( !(this instanceof Transform) ) {
            return new Transform();
        }

        this.default = {
            visible : "translate(0, 0)" + browser.prefixStyle.translateZ,
            hidden  : "translate(200%, 200%)" + browser.prefixStyle.translateZ
        }

        this.init();
    }

    Transform.prototype = {
        init : function () {
            var that = this;

            this._events = {};

            // go to history;
            $(window).bind('hashchange', function (event) {
                if ( that.module.level == 0 ) return;

                var id = location.hash.replace("#","").split("$")[0];

                if ( id ) {
                    application.transform.to(id, -1);
                }
            })

            // reset viewport;
            /* use preserve-3d */
            document.documentElement.style.height = document.body.style.height = "100%";
            document.body.style.overflow = "hidden";

            // creat viewport;
            application.complexViewport = document.createElement('div');
            application.complexViewport.id = "complex-viewport";
            application.complexViewport.style.position = "fixed";
            application.complexViewport.style.width = application.complexViewport.style.height = "100%";
            application.complexViewport.style.overflow = "hidden";
            document.body.appendChild(application.complexViewport);

            application.absoluteViewport = document.createElement('div');
            application.absoluteViewport.id = "absolute-viewport";
            application.absoluteViewport.style.position = "fixed";
            application.absoluteViewport.style.width = application.absoluteViewport.style.height = "100%";
            application.absoluteViewport.style.overflow = "hidden";
            document.body.appendChild(application.absoluteViewport);
        },

        to : function (id, history) {
            var that = this,
                od,
                ids,
                param,
                module,
                modules;

            // 增强语法，id=[id,param];
            if ( typeof id == "object" ) {
                param = id[1],
                id = id[0];

                application.template.setParam(id, param);
            }

            history = history || 1;

            od = this.od;

            this.id = id;
            this.ids = ids = od ? [id, od] : [id];

            // activity page = this page ? return;
            if ( od && id == od ) return;

            // modules;
            this.module = module = application.modules[id];
            this.modules = modules = [module, application.modules[od]];

            // this module is undefined ? return;
            if ( module == undefined ) return this._debug({id : id, note: "this module is not defined!"});

            // module is infinite or module Ele ? creat new elements;
            if ( module.elements == undefined ) {
                this.container(id);
            } else {
                // mirroring is infinite, reset mirroring;
                if ( this.module.config.mirroring && this.module.config.mirroring.infinite ) {
                    application.template.mirroring(id);
                }
            }

            if ( module.update == true ) {
                // clear old page;
                module.elements.container.innerHTML = null;
                // open loading;
                this.loading(id, 1);
                // update page;
                application.template.include(module.elements.container, id, function (data) {
                    that.loading(id, 0);
                })
            }

            this.transformStart();

            // is first ?;
            if ( od ) {
                var modeChange = modules[0].config.complex != modules[1].config.complex ? true : false,
                    animation = (history === 1 ? modules[0].config.animation : modules[1].config.animation) || function (event) { event.callback(); }
                ;

                animation({
                    "browser" : browser,
                    "reverse" : history == 1 ? false : true,
                    "viewport": [application.complexViewport, application.absoluteViewport],
                    "view"    : modeChange ? [modules[0].config.complex === true ? application.complexViewport : application.absoluteViewport, modules[1].config.complex === true ? application.complexViewport : application.absoluteViewport] : [modules[0].elements.container, modules[1].elements.container],
                    "modules" : modules,
                    "callback": function () {
                                    if ( modeChange ) {
                                        that.changeViewport();
                                    }
                                    that.transformEnd();
                                }
                })
            } else {
                that.changeViewport();
                that.transformEnd();
            }


            // history;
            if ( history > 0 ) {
                document.location.hash = id + (param ? "$" + param : "");
            }

            this.od = application.activity = id;
        },

        on : function (type, fn) {
            var types = type.split(' ');

            for ( var i = 0, l = types.length; i < l; i++ ) {

                var type = types[i];

                if ( !this._events[type] ) {
                    this._events[type] = [];
                }

                this._events[type].push(fn);
            }
        },

        off : function (type, fn) {
            var types = type.split(' ');

            for ( var i = 0, l = types.length; i < l; i++ ) {

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

        _execEvent : function (type) {
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

        loading : function (id, display) {
            var module = application.modules[id];
            switch (display) {
                case 0:
                    loader = module.elements.loader;
                    if ( loader === 'undefined' ) return;
                    module.elements.loader.cont.style.display = "none";
                    loader.hide();

                    this._execEvent("loadingEnd", id, module.elements.loader);

                    break;
                case 1:
                    var Loader = require('Loader');
                    var size = 30 * device.ui.scale;
                    var opts = {
                        shape: "roundRect",
                        diameter: size * device.ui.scale,
                        density: 12,
                        speed: 1,
                        FPS: 12,
                        range: 0.95,
                        color: "#999999"
                    };

                    if ( module.config.loader ) {
                        $.extend(opts, module.config.loader);
                    }

                    var container = application.modules[id].elements.container;

                    var loader = new Loader(container, {id: 'loader-' + id, safeVML: true});
                        loader.setShape(opts.shape);
                        loader.setDiameter(opts.diameter);
                        loader.setDensity(opts.density);
                        loader.setSpeed(opts.speed);
                        loader.setFPS(opts.FPS);
                        loader.setRange(opts.range);
                        loader.setColor(opts.color);
                        loader.show();

                        loader.cont.style.position = "absolute";
                        loader.cont.style.zIndex = 999;
                        loader.cont.style.top = loader.cont.style.left = "50%";
                        loader.cont.style.marginTop = loader.cont.style.marginLeft = size * -0.5 + "px";
                        loader.cont.style.width = loader.cont.style.height = size + "px";

                    var canvas = loader.cont.children;
                    for (var i = canvas.length - 1; i >= 0; i--) {
                        canvas[i].style.width = canvas[i].style.height = size + "px";
                    }; 

                    application.modules[id].elements.loader = loader;

                    this._execEvent("loadingStart", id, module.elements.loader);

                    break;
            }

        },

        reset : function (id) {
            var container = application.modules[id].elements.container,
                style = container.style
            ;

            style.cssText = "";
            style.position = "fixed";
            style.top = style.right = style.bottom = style.left = 0;
            style.width = style.height = "100%";
            style[browser.prefixStyle.transform] = "translate(0, 0) translateZ(0) scale(1, 1)";
        },

        refresh : function (id) {
            var that = this;

            var container = application.modules[id].elements.container;

            if ( !container ) return console.log("refresh : container is not defined in this module");

            // open loading;
            this.loading(id, 1);
            
            // include module page;
            application.template.include(container, id, function (data) {
                // close loading;
                that.loading(id, 0);
            })
        },

        container : function (id) {
            var that = this;
            var target = this.module.config.complex === true ? application.complexViewport : application.absoluteViewport;

            var container = document.createElement('section');
                container.id = "module-" + id;

            application.modules[id].elements = {
                "container" : container
            };

            this.reset(id);

            // preload on event;
            if ( typeof this.module.preload === "function" ) {
                this.module.preload(container);
            }

            target.appendChild(container);

            // if this module need network;
            if ( application.modules[id].network ) {
                if ( navigator.onLine === false ) {
                    window.addEventListener("online", function () {
                        that.refresh(id);
                    }, false);

                    return this._execEvent("offline", id, this.module);
                }
            }

            // open loading;
            this.loading(id, 1);

            // include module page;
            application.template.include(container, id, function (data) {
                // close loading;
                that.loading(id, 0);
            })

        },

        transformStart : function () {
            // infinite ? revert cache;
            if ( this.modules[0].config.infinite && this.modules[0].cached === true ) {
                application.template.revert(this.id);
            }

            this.modules[0].elements.container.style[browser.prefixStyle.transform] = this.default.visible;

            this._execEvent("transformStart", this.ids, this.modules);
        },

        transformEnd : function () {
            if ( !this.modules[1] ) return;

            // infinite ? remove this module html, caching to storage
            if ( this.modules[1].config.infinite ) {
                application.template.remove(this.od);
            }

            this.reset(this.id);
            this.modules[1].elements.container.style[browser.prefixStyle.transform] = this.default.hidden;

            this._execEvent("transformEnd", this.ids, this.modules);
        },

        changeViewport: function () {
            if ( this.module.config.complex === true ) {
                application.absoluteViewport.style[browser.prefixStyle.transform] = this.default.hidden;
                application.complexViewport.style[browser.prefixStyle.transform] = this.default.visible;
            } else {
                application.complexViewport.style[browser.prefixStyle.transform] = this.default.hidden;
                application.absoluteViewport.style[browser.prefixStyle.transform] = this.default.visible;
            }
        },

        _debug : function (e) {
            console.log("Transform Error: [id]: " + e.id + ", [message]: " + e.note);
        }
    }

    /* =========================================================================== transform end ====================== */


    // Template: async load and creat page;
    function Template () {
        'use strict';

        if ( !(this instanceof Template) ) {
            return new Template();
        }

        this.setup();
    }

    Template.prototype = {
        setup : function () {
            this._events = {};
        },

        on : function (type, fn) {
            var types = type.split(' ');

            for (var i = 0, l = types.length; i < l; i++) {

                var type = types[i];

                if ( !this._events[type] ) {
                    this._events[type] = [];
                }

                this._events[type].push(fn);
            }
        },

        off : function (type, fn) {
            var types = type.split(' ');

            for (var i = 0, length = types.length; i < length; i++) {

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

        _execEvent : function (type) {
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

        setData : function (id, data, update) {
            if ( update == 'append' ) {
                $.extend(data, getData(id));
            }

            storage.localStorage.set(id, data);
        },

        getData : function (id) {
            return storage.localStorage.get(id);
        },

        removeData : function (id) {
            storage.localStorage.remove(id);
        },

        setCache : function (id, data) {
            storage.sessionStorage.set(id, data);
        },

        getCache : function (id) {
            return storage.sessionStorage.get(id);
        },

        removeCache : function (id) {
            storage.sessionStorage.remove(id);
        },

        getUri : function (id, name, type) {
            var uri,
                module = application.modules[id]
            ;

            // get uri;
            try {

                uri = module.resources[type][name];

            } catch (e) {
                e.id = name;
                e.type = type;
                e.message = type + " uri error";
                return this._debug(e);
            }

            if ( typeof uri === "string" ) {
                // 映射;
                if ( uri.indexOf('::') > 0 ) {
                    uri = uri.split(/\:\:/);

                    if ( uri.length === 2 ) return this.getUri(uri[0], uri[1], type);
                }

                if ( uri.indexOf('!SQL:') === 0 ) {
                    uri = uri.split(/\:/)[1];
                    
                    return { 
                        id   : id,
                        data : uri, 
                        type : 'sql' 
                    };
                } else if ( uri.indexOf('http://') === 0 ) {
                    application.modules[id].network = true;
                } else if ( uri.indexOf('/') === 0 ) {
                    uri = 'modules/' + '/' + uri.substr(1);
                } else if ( uri.indexOf('./') === 0 ) {
                    uri = 'modules/' + id + '/' + uri.substr(2);
                } else {
                    uri = 'modules/' + id + '/' + uri;
                }

                // helpher;
                if ( uri.indexOf("|") > -1 ) {
                    uri = uri.split(/\|/);

                    var url = uri[0],
                        helpher = uri[1];

                    switch (helpher) {
                        case 'param':
                            if ( module.param ) {
                                var param = '';
                                for ( var key in module.param ) {
                                    if ( key != '_string') {
                                        param += '&' + key + '=' + module.param[key];
                                    }
                                }

                                uri = url + (url.indexOf('?') > -1 ? param : '?' + param.substr(1));
                            }
                            break;
                    }
                }

                return { 
                    id   : id,
                    data : uri, 
                    type : 'url' 
                };
            }

            if ( typeof uri === "object" ) {
                return { 
                    id   : id,
                    data : uri, 
                    type : "object" 
                };
            }

            if ( typeof uri === "function" ) {
                return { 
                    id   : id,
                    data : function (callback) {
                        return uri(module.param, callback);
                    }, 
                    type : "function" 
                };
            }
        },

        // set module fragments config;
        setFragments : function (names) {
            var name;
            var fragments;
            var fragmentsGroup = application.fragments;
            var types = ["source", "data", "layout", "script"];
            for ( var i = names.length - 1; i >= 0; i-- ) {
                name = names[i];
                try {
                    fragments = fragmentsGroup[name];
                } catch (e) {
                    e.id = name;
                    e.type = "fragments";
                    e.message = "fragments uri error";
                    return this._debug(e);
                }

                for ( var o = types.length - 1; o >= 0; o-- ) {
                    var type = types[o];
                    var value = fragments[type];

                    if ( value ) {
                        if ( !this.module.config[type] ) this.module.config[type] = {};
                        if ( !this.module.resources[type] ) this.module.resources[type] = {};

                        for (var n = value.length - 1; n >= 0; n--) {
                            name = value[n];
                            this.module.config[type].push(name);
                            this.module.resources[type][name] = fragments.path + "::" + name;
                        }
                    }
                }
            }
        },

        // set module param;
        setParam : function (id, paramStr) {
            var module = application.modules[id];
            var paramCache = {
                    _string : paramStr
                };
            var paramArr = paramStr && typeof paramStr === "string" ? paramStr.split(/\,/) : [];

            for (var i = paramArr.length - 1; i >= 0; i--) {
                var _param = paramArr[i].split(/\:/);
                paramCache[_param[0]] = _param[1];
            }

            // if this module cache param != param ? updata = ture;
            application.modules[id].update = module.param && module.param._string != paramStr ? true : false;
            application.modules[id].param = paramCache;
        },

        include: function (target, id, callback) {

            if ( !id ) return;

            var that = this;

        // INSERT POINT: OPTIONS

            this.id             = id;
            this.target         = target;
            this.callback       = callback;

            this.sids           = {};
            this.cache          = {};
            this.queue          = 0;

            this.modules = application.modules;
            this.module = application.modules[id];

            /*
             * 设置fragments，分解fragments配置给模块
             */
            var fragments = this.module.config.fragments;
            
            if ( fragments ) {
                this.setFragments(fragments);
            }

            var modules = this.modules;
            var module = this.module;

            this._filter(id);

        // INSERT POINT: OPTIONS

            if ( window.__XMLHttpRequest__ ) window.__XMLHttpRequest__.abort();

            if ( module.config.source.length ) {
                this.queue++;
                async.get({
                    type : "GET",
                    dataType : "text",
                    extensions : ".html",
                    source : module.config.source,
                    param : null,
                    cache : {
                        set : function () {
                            return;
                        },
                        get : function () {
                            return false;
                        }
                    },
                    space : function (name) {
                        return that.getUri(id, name, 'source');
                    },
                    check : function () {
                    },
                    error : function () {
                    },
                    callback : function (sids, data) {
                        that.bundle(sids, data, "source");
                    }
                })
            }

            if ( module.config.data.length ) {
                this.queue++;
                async.get({
                    type : "GET",
                    dataType : "json",
                    extensions: "",
                    source : module.config.data,
                    param : module.param,
                    cache : {
                        set : function () {
                            return;
                        },
                        get : function (id, callback) {
                            var uuid = that.id + ':' + id;
                            return that.getData(uuid);
                        }
                    },
                    space : function (name) {
                        return that.getUri(id, name, 'data');
                    },
                    check : function () {
                    },
                    error : function () {
                    },
                    callback : function (sids, data) {
                        that.bundle(sids, data, "data");
                    }
                })
            }

            if ( module.config.layout.length ) {
                this.queue++;
                async.get({
                    type : "GET",
                    dataType : "text",
                    extensions : ".css",
                    source : module.config.layout,
                    param : null,
                    cache : {
                        set : function () {
                            return;
                        },
                        get : function () {
                            return false;
                        }
                    },
                    space : function (name) {
                        return that.getUri(id, name, 'layout');
                    },
                    check : function () {
                    },
                    error : function () {
                    },
                    callback : function (sids, data) {
                        that.bundle(sids, data, "layout");
                    }
                })
            }
        },

        // data bundle;
        bundle : function (sids, data, type) {
            var that = this;

            this.queue--;
            this.sids[type] = sids;
            this.cache[type] = data;

            if ( this.queue === 0 ) {
                this.compile(this.id);
            }
        },

        remove : function (id) {
            var module = application.modules[id],
                container = this.module.elements.container,
                content = module.config.sandbox ? module.elements.sandbox.document.documentElement : container;

            this.setCache(id, content.innerHTML);
            container.innerHTML = null;

            application.modules[id].cached = true;
        },

        revert : function (id) {
            this.write(null, this.getCache(id));
            this.removeCache(id);
        },

        mirroring : function (id, options) {
            var module = application.modules[id];
            var options = options || module.config.mirroring;

            var fromContainer = module.elements.sandbox.container;
            var fromDocument = module.elements.sandbox.document;
            var fromDocumentElement = fromDocument.documentElement;
            var frameContainer = document.createElement('iframe');

            // set sandbox;
            $(frameContainer).attr({
                "name"      : "mirroring-" + id, 
                "src"       : "about:blank",
                "seamless"  : "seamless",
                "style"     : "position: absolute; z-index: 0; width: " + fromContainer.offsetWidth + "px; height: " + fromContainer.offsetHeight + "px; border: 0px; overflow: hidden;",
                "sandbox"   : "allow-same-origin"
            });

            var html = fromDocumentElement.innerHTML;

            $(options.target).append(frameContainer);

            // frame : document and window;
            var frameDoc = frameContainer.contentDocument;
            var frameWindow = frameContainer.contentWindow.window;

            // set application;
            application.modules[id].elements.mirroring = {
                container   : frameContainer,
                window      : frameWindow,
                document    : frameDoc
            };

            frameDoc.open();
            frameDoc.write(html);
            frameDoc.close();

            $(frameWindow.document).ready(function () {
                var config = $.extend({
                        attributes : true,
                        childList : true,
                        subtree : false,
                        characterData : true,
                        attributeFilter : ["style", "class", "id", "src"]
                    }, options.config);

                // Synchronous update node;
                for (var i = options.nodes.length - 1; i >= 0; i--) {
                    var elements = $(fromDocumentElement).find(options.nodes[i]);
                    var mirroringElements = $(frameWindow.document).find(options.nodes[i]);

                    elements.each(function (o) {
                        var element = $(this);
                        var mirroringElement = $(mirroringElements[o]);

                        element.observer(config, function (records) {
                            var record = records[records.length - 1];
                            
                            switch (record.type) {
                                case "attributes":
                                    mirroringElement.attr(record.attributeName, record.target.attributes[record.attributeName].value);
                                    break;
                                case "childList":
                                    mirroringElement.html(element.html());
                                    break;
                            }
                            
                        })
                    })
                }
            })
        },

        iframe : function (layout, html) {

            return '<!DOCTYPE html>'
                + '<html>'
                + '<head>'
                + '<style>' + layout + '</style>'
                + '</head>'
                + '<body>'
                + html
                + '</body>'
                + '</html>';
        },

        sandbox : function (html) {
            var that = this;
            var id = this.id;
            var module = this.module;

            var frameContainer = document.createElement('iframe');
                frameContainer.style.position = "absolute";
                frameContainer.style.width = "100%";
                frameContainer.style.height = "100%";
                frameContainer.style.border = 0;

                // set sandbox;
                $(frameContainer).attr({
                    "name"      : id, 
                    "src"       : "about:blank",
                    "seamless"  : "seamless",
                    "sandbox"   : typeof module.sandbox == "string" ? module.sandbox : "allow-scripts allow-top-navigation allow-same-origin"
                });
            
            this.target.appendChild(frameContainer);

            // frame : document and window;
            var frameDoc = frameContainer.contentDocument;
            var frameWindow = frameContainer.contentWindow.window;

            // set application;
            application.modules[id].elements.sandbox = {
                container   : frameContainer,
                window      : frameWindow,
                document    : frameDoc
            }

            // set sandbox;
            frameWindow.application = application;
            frameWindow.module = module;
            frameWindow._window = window;
            frameWindow._document = document;

            // compatible window;
            compatible(frameWindow);

            frameDoc.open();
            frameDoc.write(html);
            frameDoc.close();

            $(frameWindow.document).ready(function () {
                // setup moderation;
                moderation(frameWindow);

                // setup require;
                that._require(1, function () {
                    var mirroring = module.config.mirroring;
                    if ( mirroring ) that.mirroring(id, mirroring);

                    // default event;
                    that.bind(frameWindow.document.body);

                    // event trigger;
                    that._execEvent("complete", {
                        type   : "sandbox",
                        id     : id,
                        module : module
                    });
                })
            })

            // loaded event;
            $(frameWindow).load(function () {
                // event trigger;
                that._execEvent("moduleLoaded", {
                    type   : "sandbox",
                    id     : id,
                    module : module
                });
            })
        },

        // free module;
        embed : function (layout, html) {
            var that = this;

            if ( layout ) {
                var style = this.module.elements.style;
                if ( style ) {
                    style.html(layout)
                } else {
                    style = document.createElement('style');
                    style.id = this.id;
                    style.innerHTML = layout;
                    $('head').append(style);
                }
            }

            $(this.target).append(html);

            // setup require;
            this._require(0, function () {
                // default event;
                that.bind(that.target);
                // event trigger;
                that._execEvent("complete", {
                    type   : "embed",
                    id     : that.id,
                    module : that.module
                });
            });
            
        },

        compile : function (id) {
            // push template DATA;
            this.cache.data.module = {
                id    : id,
                dids  : this.sids.data,
                sids  : this.sids.source,
                uri   : "modules/" + id + "/",
                param : this.module.param || []
            };

            application.compile.setup(id, this.sids.source, this.cache.source);

            application.css.setup({
                module     : id,
                root       : "modules/",
                data       : {
                    module : id,
                    dpi    : device.ui.dpi,
                    width  : device.ui.width,
                    height : device.ui.height,
                    os     : device.os,
                    feat   : device.feat,
                    vendors: device.feat.cssPrefixText
                }
            });


            this.write(application.css.compile(this.sids.layout, this.cache.layout, this.module.config.sandbox ? null : id != 'frameworks' ? id : null), application.compile.render(this.module.config.source[0], this.cache.data));
        },

        write : function (layout, html) {
            this.module.config.sandbox ? this.sandbox(this.iframe(layout, html)) : this.embed(layout, html);
        },

        _require : function (type, callback) {
            var requires = this.module.config.require || false;

            if ( !requires ) return callback && callback();

            var alias = {};
            var script = this.module.config.script;

            if ( script.length ) {
                for (var i = script.length - 1; i >= 0; i--) {
                    var uri;
                    uri = this.module.resources.script[script[i]];
                    if ( uri.indexOf('http://') === 0 ) {
                        alias[script[i]] = uri + ".js";
                        return;
                    }
                    uri = uri.split(/\:\:/);
                    uri = uri.length === 1 ? this.id + '/' + uri[0] : uri[0] + '/' + modules[uri[0]].resources.source[uri[1]];
                    alias[script[i]] = "modules/" + uri + ".js";
                }
            }

            // define config;
            requires.config = $.extend({
                vars  : modules.data.vars || {},
                paths : modules.data.paths || {}
            }, requires.config || {});
            // set alias;
            // setup require : Embedded module requires as a public resource;
            // Note : Do not have the same name! 
            requires.config.alias = $.extend(alias, requires.config.alias || {}, modules.data.alias);

            switch (type) {
                case 0:
                    modules.config(requires.config)
                    require.async(requires.use.load, function () {
                        requires.use.callback.apply(this, arguments)
                        callback && callback()
                    })
                    break;
                case 1:
                    this.module.elements.sandbox.window.modules.config(requires.config).use(requires.use.load, function () {
                        requires.use.callback.apply(this, arguments)
                        callback && callback()
                    })
                    break;
                default:
                    callback && callback()
            }
        },

        bind : function (element) {
            var moduleWindow = this.module.config.sandbox ? this.module.elements.sandbox : window;

            var hammer = require('Hammer');
            var touchArea = new hammer(element);

            touchArea.on("swipe pan panstart panmove panend pancancel multipan press pressup pinch rotate tap doubletap", function (event) {
                $(event.target).trigger(event.type, event);
                return false;
            });

            // transform module event;
            $(element).on('tap', '[transform]', function (touch) {
                if ( event ) {
                    event.preventDefault();
                    event.stopPropagation();
                }

                var id = this.getAttribute('transform');
                var param = this.getAttribute('param');

                // is number ? go to history;
                if ( !isNaN(id) ) return window.history.go(parseInt(id));
                if ( !application.modules[id] ) return;

                application.transform.to([id, param]);
                return false;
            })

            // module set scroll;
            moduleWindow.window.modules.use('Scroll', function (scroll) {
                moduleWindow.window.scroll = {};

                $(element).find('[data-scroll]').each(function (x) {
                    var config = {
                            id: x, 
                            mouseWheel: true,
                            scrollbars: true,
                            interactiveScrollbars: true,
                            probeType: 3,
                            deceleration: 0.003,
                            preventDefault: false
                        };

                    for ( var i = 0, configs = $(this).data('scroll').split(','), l = configs.length; i < l; i++ ) {
                        var value = configs[i].split(':');
                        config[value[0]] = value[1] == "true" ? true : value[1] == "false" ? false : value[1];
                    };

                    moduleWindow.window.scroll[config.id] = new scroll(this, config);
                })
            })
            
            this.callback && this.callback();
        },

        // config filter;
        _filter : function (id) {
            // if is Bad GPU exit;
            if ( browser.isBadGPU || !browser.hasObserver ) {
                application.modules[id].config.mirroring = undefined;
            }

            if ( browser.isBadTransition ) {
                application.modules[id].config.animation = undefined;
            }
        },

        _debug : function (e) {
            console.log("Template Error: [type]: " + e.type + ", [id]: " + e.id + ", [message]: " + e.des, e);
        }

    }


    return {
        template    : Template,
        transform   : Transform
    }
})