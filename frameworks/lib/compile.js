define(function (require, exports, module) {
    'use strict';

    var Template = function () {
        if ( !(this instanceof Template) ) {
            return new Template();
        }

        this.init();
    };

    Template.prototype = {
        init : function () {
            var that = this;

            this.config = {
               openTag      : '{{',
               closeTag     : '}}',
               isEscape     : true,
               isCompress   : false,
               parser       : null
            };

            this.__cache__ = {};
            this.__sources__ = {};

            this.__helpers__ = {

                __render__ : function (id, data) {
                    return that.render(id, data)
                },

                __escape__ : function (content) {
                    return typeof content === 'string'
                    ? content.replace(/&(?![\w#]+;)|[<>"']/g, function (s) {
                        return {
                            "<": "&#60;",
                            ">": "&#62;",
                            '"': "&#34;",
                            "'": "&#39;",
                            "&": "&#38;"
                        }[s];
                    })
                    : content;
                },

                __string__ : function (value) {
                    if ( typeof value === 'string' || typeof value === 'number' ) {
                        return value;
                    } else if ( typeof value === 'function' ) {
                        return value();
                    } else {
                        return '';
                    }
                },

                __each__ : function (data, callback) {
                    var i, len;

                    if ( data instanceof Array ) {
                        for (i = 0, len = data.length; i < len; i++) {
                            callback.call(data, data[i], i, data);
                        }
                    } else {
                        for (i in data) {
                            callback.call(data, data[i], i);
                        }
                    }
                },

                __react__ : function (id, callback) {
                    console.log(id, callback)

                    setTimeout(function () {
                        console.log(callback);

                    }, 3000)

                    callback();
                },

                react : function (value, map) {
                    console.log(value, map)
                    return '<react id=data:' + map + '>' + value + '</react>';
                }
            };

            var modules = application.config.modules;
            for ( var i = 0, l = modules.length; i < l; i++ ) {
                // set template cache;
                this.__cache__[modules[i]] = {};
            }
        },

        setup : function (id, sids, sources) {
            this.id = id;
            this.__sids__ = sids;
            this.__sources__[id] = sources;
        },

        config : function (propertyName, value) {
            this.config[propertyName] = value;
        },

        render : function (id, data) {

            var cache = this._getCache(id);
            
            if (cache === undefined) {

                return _debug({
                    id: id,
                    name: 'Render Error',
                    message: 'No Template'
                });
                
            }
          
            return cache(data);
        },

        compile : function (id, source) {
            var that = this;
            
            var params = arguments;
            var isDebug = params[2];
            var anonymous = 'anonymous';
            
            if (typeof source !== 'string') {
                isDebug = params[1];
                source = params[0];
                id = anonymous;
            }

            
            try {
                
                var Render = _compile.call(this, source, isDebug, this.config);
                
            } catch (e) {
            
                e.id = id || source;
                e.name = 'Syntax Error';

                return this._debug(e);
                
            }
            
            
            function render (data) {
                
                try {
                    
                    return new Render(data) + '';
                    
                } catch (e) {
                    
                    if (!isDebug) {
                        return that.compile(id, source, true)(data);
                    }

                    e.id = id || source;
                    e.name = 'Render Error';
                    e.source = source;
                    
                    return that._debug(e);
                    
                }
                
            }
            

            render.prototype = Render.prototype;
            render.toString = function () {
                return Render.toString();
            };
            
            
            if ( id !== anonymous ) {
                var origin = this.__sids__[id];
                this.__cache__[origin][id] = render;
            }
            
            return render;

        },

        helper : function (name, helper) {
            this.__helpers__[name] = helper;
        },

        _getCache : function (id, sources) {
            var origin = this.__sids__[id];
            return this.__cache__[origin].hasOwnProperty(id) ? this.__cache__[origin][id] : this.compile(id, this.__sources__[this.id][id].replace(/^\s*|\s*$/g, ''));
        },

        onerror : function (e) {
            var content = '[template]:\n'
                + e.id
                + '\n\n[name]:\n'
                + e.name;

            if (e.message) {
                content += '\n\n[message]:\n'
                + e.message;
            }
            
            if (e.line) {
                content += '\n\n[line]:\n'
                + e.line;
                content += '\n\n[source]:\n'
                + e.source.split(/\n/)[e.line - 1].replace(/^[\s\t]+/, '');
            }
            
            if (e.temp) {
                content += '\n\n[temp]:\n'
                + e.temp;
            }
            
            if (global.console) {
                console.error(content);
            }
        },

        _debug : function (e) {
            console.log(e)

            this.onerror(e);
            
            function error () {
                return error + '';
            }
            
            error.toString = function () {
                console.log('{Template Error}');
                return '';
            };
            
            return error;
        }

    };


    // 模板编译器
    var _compile = (function () {

        var arrayforEach = Array.prototype.forEach || function (block, thisObject) {
            var len = this.length >>> 0;
            
            for (var i = 0; i < len; i++) {
                if (i in this) {
                    block.call(thisObject, this[i], i, this);
                }
            }
            
        };

        // 数组迭代
        var forEach = function (array, callback) {
            arrayforEach.call(array, callback);
        };

        // 静态分析模板变量
        var KEYWORDS =
            // 关键字
            'break,case,catch,continue,debugger,default,delete,do,else,false'
            + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
            + ',throw,true,try,typeof,var,void,while,with'
            
            // 保留字
            + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
            + ',final,float,goto,implements,import,int,interface,long,native'
            + ',package,private,protected,public,short,static,super,synchronized'
            + ',throws,transient,volatile'
            
            // ECMA 5 - use strict
            + ',arguments,let,yield'

            + ',undefined';
        var REMOVE_RE = /\/\*(?:.|\n)*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|'[^']*'|"[^"]*"|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g;
        var SPLIT_RE = /[^\w$]+/g;
        var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
        var NUMBER_RE = /\b\d[^,]*/g;
        var BOUNDARY_RE = /^,+|,+$/g;
        var getVariable = function (code) {

            code = code
            .replace(REMOVE_RE, '')
            .replace(SPLIT_RE, ',')
            .replace(KEYWORDS_RE, '')
            .replace(NUMBER_RE, '')
            .replace(BOUNDARY_RE, '');

            code = code ? code.split(/,+/) : [];

            return code;
        };

        var filtered = function (js, filter) {
            var parts = filter.split(':');
            var name = parts.shift();
            var map = ', "' + js + '"';
            var args = parts.join(':') || '';

            if (args) {
                args = ', ' + args;
            }

            

            return '$helpers.' + name + '(' + js + map + args + ')';
        };

        var translation = function (code) {

            code = code.replace(/^\s/, '');

            var split = code.split(' ');
            var key = split.shift();
            var args = split.join(' ');

            switch (key) {

                case 'if':
                    code = 'if(' + args + '){';
                    break;

                case 'else':
                    if (split.shift() === 'if') {
                        split = ' if(' + split.join(' ') + ')';
                    } else {
                        split = '';
                    }

                    code = '}else' + split + '{';
                    break;

                case '/if':
                    code = '}';
                    break;

                case 'each':
                    var object = split[0] || '$data';
                    var as     = split[1] || 'as';
                    var value  = split[2] || '$value';
                    var index  = split[3] || '$index';
                    
                    var param   = value + ',' + index;
                    
                    if (as !== 'as') {
                        object = '[]';
                    }
                    
                    code = '__each__(' + object + ',function(' + param + '){';
                    break;

                case '/each':
                    code = '});';
                    break;

                case 'react':
                    var id = split[0];
                    var openTag = '<react id="' + id + '">';
                    var closeTag = '</react>';

                    code = '$out+= ' + openTag + '"__react__("' + id + '",function(){';
                    break;

                case '/react':
                    code = '});';
                    break;

                case 'echo':
                    code = 'print(' + args + ');';
                    break;

                case 'print':
                case 'include':
                    code = key + '(' + split.join(',') + ');';
                    break;

                default:

                    if ( code.indexOf('%') === 0 ) {
                        code = code.substr(1);
                        break;
                    }

                    if ( /^\s*\|\s*[\w\$]/.test(args) ) {

                        var isEscape = true;

                        // {{#value | link}}
                        if ( code.indexOf('#') === 0 ) {
                            code = code.substr(1);
                            isEscape = false;
                        }

                        var i = 0;
                        var array = code.split('|');
                        var len = array.length;
                        var val = array[i++];
                        var helper;

                        for (; i < len; i ++) {
                            helper = array[i].trim();

                            switch (helper) {
                                case 'react' :
                                    isEscape = false;
                                    break;
                            }

                            val = filtered(val, helper);
                        }

                        code = (isEscape ? '' : '#') + val;

                    }
                    
                    code = '=' + code;

                    break;
            }

            return code;
        };


        return function (source, isDebug, config) {
            
            var openTag = config.openTag;
            var closeTag = config.closeTag;
            var parser = config.parser;

            
            var code = source;
            var tempCode = '';
            var line = 1;
            var uniq = {$data:true,$helpers:true,$out:true,$line:true};
            var helpers = this.__helpers__;

            var prototype = {};

            
            var variables = "var $helpers=this,"
            + (isDebug ? "$line=0," : "");

            var isNewEngine = ''.trim;// '__proto__' in {}
            var replaces = isNewEngine
            ? ["$out='';", "$out+=", ";", "$out"]
            : ["$out=[];", "$out.push(", ");", "$out.join('')"];

            var concat = isNewEngine
                ? "if(content!==undefined){$out+=content;return content}"
                : "$out.push(content);";
                  
            var print = "function(content){" + concat + "}";

            var include = "function(id,data){"
            +     "if(data===undefined){data=$data}"
            +     "var content=$helpers.__render__(id,data);"
            +     concat
            + "}";
            
            
            // html与逻辑语法分离
            forEach(code.split(openTag), function (code, i) {
                code = code.split(closeTag);
                
                var $0 = code[0];
                var $1 = code[1];
                
                // code: [html]
                if (code.length === 1) {
                    
                    tempCode += html($0);
                 
                // code: [logic, html]
                } else {
                    
                    tempCode += logic($0);
                    
                    if ($1) {
                        tempCode += html($1);
                    }

                }
                

            });
            
            
            
            code = tempCode;
            
            
            // 调试语句
            if (isDebug) {
                code = 'try{' + code + '}catch(e){'
                +       'e.line=$line;'
                +       'throw e'
                + '}';
            }
            
            
            code = "'use strict';"
            + variables + replaces[0] + code
            + 'return new String(' + replaces[3] + ')';
            
            try {
                
                var Render = new SandboxFunction('$data', code);
                Render.prototype = helpers;

                return Render;
                
            } catch (e) {
                e.temp = 'function anonymous($data) {' + code + '}';
                throw e;
            }
            
            // 处理 HTML 语句
            function html (code) {
                
                // 记录行号
                line += code.split(/\n/).length - 1;

                if (exports.isCompress) {
                    code = code.replace(/[\n\r\t\s]+/g, ' ');
                }
                
                code = code
                // 单引号与反斜杠转义(因为编译后的函数默认使用单引号，因此双引号无需转义)
                .replace(/('|\\)/g, '\\$1')
                // 换行符转义(windows + linux)
                .replace(/\r/g, '\\r')
                .replace(/\n/g, '\\n');
                
                code = replaces[1] + "'" + code + "'" + replaces[2];
                
                return code + '\n';
            }
            
            
            // 处理逻辑语句
            function logic (code) {

                var thisLine = line;
               
                if (parser) {
                    // 语法转换插件钩子
                    code = parser(code);
                } else if (isDebug) {
                    // 记录行号
                    code = code.replace(/\n/g, function () {
                        line ++;
                        return '\n$line=' + line +  ';';
                    });   
                }

                code = translation(code); 
                
                // 输出语句. 转义: <%=value%> 不转义:<%==value%>
                if ( code.indexOf('=') === 0 ) {

                    var escapeSyntax = config.isEscape && !/^=[=#]/.test(code);

                    code = code.replace(/^=[=#]?|[\s;]*$/g, '');

                    // 对内容编码
                    if ( escapeSyntax ) {

                        var name = code.replace(/\s*\([^\)]+\)/, '');

                        if ( !helpers.hasOwnProperty(name) && !/^(include|print)$/.test(name) ) {
                            code = "__escape__(__string__(" + code + "))";
                        }

                    } else {
                        code = "__string__(" + code + ")";
                    }
                    

                    code = replaces[1] + code + replaces[2];

                }
                
                if (isDebug) {
                    code = '$line=' + thisLine + ';' + code;
                }
                
                getKey(code);
                
                return code + '\n';
            }
            
            
            // 提取模板中的变量名
            function getKey (code) {
                
                code = getVariable(code);
                
                // 分词
                forEach(code, function (name) {
                 
                    // 除重
                    if (!uniq.hasOwnProperty(name)) {
                        setValue(name);
                        uniq[name] = true;
                    }
                    
                });
                
            }
            
            
            // 声明模板变量
            // 赋值优先级:
            // 内置特权方法(include, print) > 私有模板辅助方法 > 数据 > 公用模板辅助方法
            function setValue (name) {

                var value;

                if (name === 'print') {

                    value = print;

                } else if (name === 'include') {
                    
                    value = include;

                } else if (helpers[name]) {

                    value = "$helpers." + name;
                    
                } else {

                    value = '$data.' + name;

                    if (helpers.hasOwnProperty(name)) {

                        if (name.indexOf('$') === 0) {
                            value = '$helpers.' + name;
                        } else {
                            value = value
                            + '===undefined?$helpers.' + name + ':' + value;
                        }
                    }
                    
                }
                
                variables += name + '=' + value + ',';
            }
            
        };
    })();

    return Template;
});