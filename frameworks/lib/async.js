define(function (require, exports, module) {
    "use strict";

    var $ = require('Jquery');

    function AsyncData (options) { 
        this.sids = {};
        this.cache = {}; // 缓存数据队列
        /* 待执行队列 */
        this.options = options;
        this.queue = options.source.length;

        /*循环队列，载入include数据*/
        for ( var i = this.queue - 1; i >= 0; i-- ) {
            var id,
                cache,
                space;

            id = options.source[i];
            space = options.space(id);
            cache = options.update ? null : options.cache.get(id, this.success);            // 自定义数据取得或取得缓存，成功后回调基本操作

            if ( cache ) {
                this.success(id, space.id, cache);
                return;
            }

            if ( space === undefined ) return this._debug("Data Error! : " + id);

            switch (space.type) {
                case 'object':
                    this.success(id, space.id, space.data); 
                    break;
                case 'function':
                    this.callback(id, space.id, space.data);
                    break;
                case 'sql':
                    this.query(id, space.id, space.data); 
                    break;
                case 'url':
                    this.ajax(id, space.id, space.data);
                    break;
                default:
                    this._debug("DataType Error!");
                    break;
            }

        }

    }

    AsyncData.prototype = {
        success : function (id, sid, data) {
            this.options.check(data);
            this.sids[id] = sid;
            this.cache[id] = data;                                                              // 保存缓存集合
            this.queue--;                                                                       // 列队递减
            this.complete();                                                                    // 列队是否完毕
        },

        complete : function () {                                                                // 队列是否完毕
            if ( this.queue === 0 ) {
                this.options.callback(this.sids, this.cache);
            }
        },

        query : function (id, sid, sql) {
            var that = this;
            window.db.query(sql, function(data) {
                that.success(id, sid, data);
            });
        },

        ajax : function (id, sid, space) {
            var that = this;

            window.__XMLHttpRequest__ = $.ajax({
                type : this.options.type,
                dataType : this.options.dataType,
                data : this.options.data,
                url : space + this.options.extensions,                                           // url组合方式，路径结构＋后缀
                success : function (data) {
                    that.options.cache.set(id, data);
                    that.success(id, sid, data); 
                },
                error : function (XMLHttpRequest, textStatus, errorThrown) {
                    that.options.error(id, textStatus);                                          //除了得到null之外，还可能是"timeout", "error", "notmodified" 和 "parsererror"。
                }
            });
        },

        callback : function (id, sid, fn) {
            var that = this,
                data,
                callback = function (data) {
                    that.success(id, sid, data);
                }
            ;

            data = fn(callback);
            
            // 如果function返回的方式是异步则需要callback;
            data && callback (data);
            
        },

        _debug : function (e) {
            console.log(e);
        }
    }

    var get = function (options) {
        return new AsyncData(options);
    }

    return {
        get : get
    };
})