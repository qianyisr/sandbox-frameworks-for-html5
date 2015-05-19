define(function (require, exports, module) {
    "use strict";

    var device = require("Device");
    
    // Helpers
    var browser = {
            prefixStyle : device.feat.prefixStyle,
            keyframesPrefix : device.feat.keyframesPrefix
        };

    var selX = /([^\s\;\{\}][^\;\{\}]*)\{/g;
    var endX = /\}/g;
    var lineX = /([^\;\{\}]*)\;/g;
    var commentX = /\/\*[\s\S]*?\*\//g;
    var lineAttrX = /([^\:]+):([^\;]*);/;

    /*
     * 语法解释 提取
     * var, unit, url(), Math(), @section ()
    */
    var varX = /\+?\$(\w+\-?\w?)\+?/;
    var sizeX = /\b(\d*\.?\d+)+(px|dp|vm|vw|vh)\b/ig;
    var ifContentX = /\((.*)?\)/g;
    var urlContentX = /\burl\(['"](.*)?['"]\)/ig;
    var mathContentX = /\bMath\((.*)?\)/ig;
    var sectionContentX = /\(([.#]?\w+\-?\w?)\)/g;

    // capture.
    var altX = /(\/\*[\s\S]*?\*\/)|([^\s\;\{\}][^\;\{\}]*(?=\{))|(\})|([^\;\{\}]+\;(?!\s*\*\/))/gmi;

    // Capture groups
    var capComment = 1;
    var capSelector = 2;
    var capEnd = 3;
    var capAttr = 4;

    var isEmpty = function (x) {
        return typeof x == 'undefined' || x.length == 0 || x == null;
    };

    var CSS = function (config) {
        if ( !(this instanceof CSS) ) {
            return new CSS(config);
        }

        this.init();

        config && this.setup(config);
    }

    CSS.prototype = {
        init : function () {
            // 定义全局变量；
            this.global = {};
        },

        setup : function (config) {
            this.config = config || {
                root  : "modules/",
                uri   : "modules/"
            };

            // 更新模块css配置，同时清空模块css的变量;
            this.variable = {
                attributes : {},
                children : {}
            };
        },

        clear : function () {
            // 清楚应用全局css变量;
            this.global = {};
            // 清楚当前模块css变量;
            this.variable = {
                attributes : {},
                children : {}
            };
        },

        compile : function (sids, sources, module) {
            this.module = module ? module : '';

            var css = '';
            for (var i in sources) {
                this.id = sids[i];
                css += this.toCSS(this.data = this.toJSON(sources[i]));
            }

            return css;
        },

        toJSON : function (cssString, args) {
            var node = {
                children: {},
                attributes: {}
            };
            var match = null;
            var count = 0;

            if ( typeof args == 'undefined' ) {
                var args = {
                    ordered: false,
                    comments: false,
                    stripComments: false,
                    split: false
                };
            }
            if ( args.stripComments ) {
                args.comments = false;
                cssString = cssString.replace(commentX, '');
            }

            while ( (match = altX.exec(cssString)) != null ) {
                if ( !isEmpty(match[capComment]) && args.comments ) {
                    // Comment
                    var add = match[capComment].trim();
                    node[count++] = add;
                } else if ( !isEmpty(match[capSelector]) ) {
                    // New node, we recurse
                    var name = match[capSelector].trim();
                    // This will return when we encounter a closing brace
                    var newNode = this.toJSON(cssString, args);
                    if ( args.ordered ) {
                        var obj = {};
                        obj['name'] = name;
                        obj['value'] = newNode;
                        // Since we must use key as index to keep order and not
                        // name, this will differentiate between a Rule Node and an
                        // Attribute, since both contain a name and value pair.
                        obj['type'] = 'rule';
                        node[count++] = obj;
                    } else {
                        if ( args.split ) {
                            var bits = name.split(',');
                        } else {
                            var bits = [name];
                        }
                        for (var i in bits) {
                            var sel = bits[i].trim();
                            if ( sel in node.children ) {
                                for (var att in newNode.attributes) {
                                    node.children[sel].attributes[att] = newNode.attributes[att];
                                }
                            } else {
                                node.children[sel] = newNode;
                            }
                        }
                    }
                } else if ( !isEmpty(match[capEnd]) ) {
                    // Node has finished
                    return node;
                } else if ( !isEmpty(match[capAttr]) ) {
                    var line = match[capAttr].trim();
                    var attr = lineAttrX.exec(line);
                    if (attr) {
                        // Attribute
                        var name = attr[1].trim();
                        var value = attr[2].trim();
                        if ( args.ordered ) {
                            var obj = {};
                            obj['name'] = name;
                            obj['value'] = value;
                            obj['type'] = 'attr';
                            node[count++] = obj;
                        } else {
                            if ( name in node.attributes ) {
                                var currVal = node.attributes[name];
                                if ( !(currVal instanceof Array) ) {
                                    node.attributes[name] = [currVal];
                                }
                                node.attributes[name].push(value);
                            } else {
                                node.attributes[name] = value;
                            }
                        }
                    } else {
                        // Semicolon terminated line
                        node[count++] = line;
                    }
                }
            }

            return node;
        },

        toCSS : function (node, depth, scope, breaks) {
            var cssString = '';
            if ( typeof depth == 'undefined' ) {
                depth = 0;
            }
            if ( typeof scope == 'undefined' ) {
                scope = false;
            }
            if ( typeof breaks == 'undefined' ) {
                breaks = false;
            }
            if ( node.attributes ) {
                for (i in node.attributes) {
                    var att = node.attributes[i];
                    if ( att instanceof Array ) {
                        for (var j = 0; j < att.length; j++) {
                            cssString += this._setAttr(i, att[j], depth, scope);
                        }
                    } else {
                        cssString += this._setAttr(i, att, depth, scope);
                    }
                }
            }
            if ( node.children ) {
                var first = true;
                for (var i in node.children) {
                    if (breaks && !first) {
                        cssString += '\n';
                    } else {
                        first = false;
                    }
                    
                    cssString += this._setNode(i, node.children[i], depth, scope);
                }
            }

            return cssString;
        },

        // $
        _getVariable : function (value, scope) {
            var config = this.config;
            var global = this.global;
            var variable = this.variable;
            // 解析变量;
            return value.replace(varX, function (map, key) { 
                if ( scope ) {
                    return variable.children[scope] && variable.children[scope][key] || variable.attributes[key] || global[key] || config.data[key];
                } else {
                    return variable.attributes[key] || global[key] || config.data[key];
                }
            });
        },

        // Helpers
        _setAttr : function (name, value, depth, scope) {
            var that = this;

            var id = this.id;
            var config = this.config;

            // 解析变量;
            value = this._getVariable(value, scope);

            // url 相对路径转换;
            switch (name) {
                case 'background-image':
                case 'border-image':
                case 'background':
                case 'content':
                case 'src':
                    value = value.indexOf('url(') != -1 ? value.replace(urlContentX, function (val, url) { 
                        var uri;

                        if ( url.indexOf('http://') == 0 ) {
                            uri = '';
                        } else if ( url.indexOf('/') == 0 ) {
                            uri = config.root;
                            url = url.substr(1);
                        } else if ( url.indexOf('./') == 0 ) {
                            uri = config.root + id + '/';
                            url = url.substr(2);
                        } else if ( url.indexOf('-/') == 0 ) {
                            uri = config.root + config.module + '/';
                            url = url.substr(2);
                        } else {
                            uri = config.root + id + '/';
                        }

                        return "url('" + uri + url + "')";
                    }) : value;
                    break;
                case '@extend':
                    var data = this.data.children;
                    var extend = scope ? (data['@section (' + scope + ')'] || data['@section(' + scope + ')']).children[value] || data[value] : data[value];

                    if ( extend ) {
                        var cssString = '',
                            att = extend.attributes
                        ;
                        for (name in att) {
                            cssString += '\t'.repeat(depth) + name + ': ' + att[name] + ';\n';
                        }
                        return cssString;
                    }

                    break;
            }

            // 处理前缀;
            name = browser.prefixStyle(name, true);
            // 转换单位;
            value = (value.indexOf('Math(') != -1 ? value.replace(mathContentX, function (val, count) { 
                count = seval(count.replace(sizeX, function (size, length, unit) { 
                    return length * Unit[unit];
                }));
                return typeof count == 'number' ? count + 'px' : '0px';
            }) : value).replace(sizeX, function (size, length, unit) { 
                return length * Unit[unit] + 'px';
            });

            return '\t'.repeat(depth) + name + ': ' + value + ';\n';
        },

        _setNode : function (name, value, depth, scope) {
            var cssString = '',
                module = this.module,
                names,
                scope,
                range,
                section,
                attributes
            ;

            // 预置大括号语法;
            /*
             * @section 定义模块作用域;
             * @global 定义全局变量;
             * @var 定义变量;
            */
            if ( depth == 0 && name.indexOf('@section') == 0 ) {
                scope = sectionContentX.exec(name)[1];
            } else 
            if ( depth == 0 && name.indexOf('@global') == 0 ) {
                attributes = value.attributes;
                for (var key in attributes) {
                    this.global[key] = attributes[key];
                }
            } else 
            if ( (depth == 0 || scope) && name.indexOf('@var') == 0 ) {
                attributes = value.attributes;
                for (var key in attributes) {
                    if ( scope ) {
                        if ( !this.variable.children[scope] ) this.variable.children[scope] = {};
                        this.variable.children[scope][key] = attributes[key];
                    } else {
                        this.variable.attributes[key] = attributes[key];
                    }
                }
            } else 
            if ( (depth == 0 || scope) && name.indexOf('@if') == 0 ) {
                if ( !seval(this._getVariable(ifContentX.exec(name)[1], scope)) ) {
                    delete value.children;
                }
            }

            // ”@“ 语法;
            // 修正css基本命名适配部分; ”@“ 语法不包含 “&” 并列逻辑，因此不影响下面的并列类 @ : @keyframes;
            if ( name.indexOf('@') == 0 ) {
                module = '';                    // ”@“ 语法作用域失效
                names = name.split(' ');
                switch (names[0]) {
                    case '@keyframes':
                        name = '@' + browser.keyframesPrefix + 'keyframes ' + names[1];
                    break;
                }
            }

            if ( scope ) {
                range = depth > 0;
                section = depth == 0;

                names = name.split(',');
                name = '';

                for (var i = 0, l = names.length; i < l; i++) {
                    name += module + scope + ' ' + names[i] + (i == l-1 ? '' : ', ');
                }
            } else {
                name = module + name;
            }

            cssString += section ? '' : (range ? '' : '\t'.repeat(depth)) + name + ' {\n';
            cssString += this.toCSS(value, depth + 1, scope);
            cssString += section ? '' : (range ? '' : '\t'.repeat(depth)) + '}\n';

            return cssString;
        }

    }

    return CSS;
})