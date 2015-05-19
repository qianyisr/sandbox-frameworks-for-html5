modules.config({
    base : ".",
    paths : {
    	"lib" 	  : "frameworks/lib",
    	"extend"  : "frameworks/extend"
    },
    vars: {
	},
    alias : {
    	"Config"			: "config/modules.js",		// 模块配置;
    	"Init"				: "lib/init.js",			// 预处理;
    	"Watch" 			: "lib/watch.js",			// watch 变量监听器;
    	"Device" 			: "lib/device.js",			// 设备信息;
    	"extend" 			: "lib/extend.js",			// 扩展;
		"Jquery" 			: "lib/jquery.js",			// Jquery;
		"Loader" 			: "lib/loader.js",			// loader;
		"Storage" 			: "lib/storage.js",			// localStorage api;
		"WebSql" 			: "lib/webSql.js",			// web sql 数据库api;
		"Hammer"			: "lib/hammer.js",			// touch 事件;
		"Scroll" 			: "lib/scroll.js",			// 滚动;
		"Async"				: "lib/async.js",			// 异步数据;
		"Compile"			: "lib/compile.js",			// 数据编译;
		"Render"			: "lib/render.js",			// render;
		"CSS"				: "lib/css.js",				// css to json;
		"Template"			: "lib/template.js",		// 模版页面组合;

		/* ------------------------ 框架辅助资源 ------------------------ */
		
		"Move"				: "extend/move.js",		    // Move;
		"PicLoader"			: "extend/PicLoader.js",	// 图片队列;
		"Html2canvas"		: "extend/html2canvas.js"	// 截图;
    }
}).use(["Init"]);