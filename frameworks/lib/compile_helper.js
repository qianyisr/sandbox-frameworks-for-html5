//console.log 调试
template.helper('consoleLog', function (message) {
    console.log(message);
});

//eval执行
template.helper('eval', function (code) {
    eval(code);
});

//数组倒叙
template.helper('reverse', function (arr) {
	return arr.reverse();
});

//字符裁剪
template.helper('substring', function (str, start, end) {
	return str.substring(start, end);
});

template.helper('session', function (id, data) {
    var script = '<script>window.sessionStorage["' + id + '"]="' + String(data) + '"</script>';
    return script;
});

/**
 * worker 模式 ==================================================================
 */
// 输出字符
template.helper('script', function (code) {
    var script = '<script>' + code + '</script>';
    return script;
});

template.helper('session', function (id, data) {
    var script = '<script>window.sessionStorage["' + id + '"]="' + String(data) + '"</script>';
    return script;
});

template.helper('cache', function (id, data) {
    var script = '<script>window._cache_["' + id + '"]="' + String(data) + '"</script>';
    return script;
});
