var template;
function define (fn) {
    fn();
}
importScripts("./compile_helper.js");

/* ------------ helper 注册点 ----------- */


importScripts("./compile_helper.js");


/* ------------ worker onmessage ----------- */


onmessage = function (evt) { 
    var stats = evt.data;
    if (stats.id) {

        template.clearCache(); //按模块清除编译缓存

        _source = stats.source;
        
        var html = template.render(stats.id, stats.data);
        postMessage(html);//将获取到的数据发送会主线程
    }
}