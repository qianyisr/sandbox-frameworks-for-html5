define(function (require, exports, module) {
	'use strict';

	var $ = require('Jquery'),
		config = require('Config'),
		device = require('Device'),
		css = require("CSS"),
		compile = require('Compile'),
		template = require('Template')
	;

	window.application = {
		config 		: config,
		device 		: device
	};

	$(document).ready(function () {
		var modules	= {},
			fragments = {},
			includes = [];

		for ( var i = 0, l = config.modules.length; i < l; i++ ) {
			includes.push("modules/" + config.modules[i] + "/config.js");
		}
		// load module config;
		require.async(includes, function () {
			for ( var i = includes.length - 1; i >= 0; i-- ) {
				var id = config.modules[i];
				var module = arguments[i];
				if ( module.fragments ) {
					for ( var name in module.fragments ) {
						fragments[name] = module.fragments[name];
						fragments[name].path = id;
					}
				}
				module.id = id;
				modules[id] = module;
				require.delete(includes[i]);
			}

			application.modules = modules;
			application.fragments = fragments;

			// start App;
			application.modules["frameworks"].elements = {
				container : document.body
			}

			application.transform = template.transform();
			application.template = template.template();
			application.css = css();
			application.compile = compile();

			// 创建框架主视图;
			application.template.include(window.application.complexViewport, "frameworks", function () {
				var index = window.application.config.index,
					hash = document.location.hash.replace("#","").split("$"),
					id = hash[0],
					param = hash[1]
				;

				/* 外部路由, 把首页推入历史纪录 */
				if ( id && application.modules[id] ) {
					document.location.hash = index;
					application.transform.to([id, param]);

					return;
				}

				application.transform.to(index);

			})
		})

		document.addEventListener('touchstart', function (e) { e.preventDefault(); }, false);
	})
})