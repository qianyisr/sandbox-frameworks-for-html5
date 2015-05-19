define(function (require, exports, module) {
	var $ = require('Jquery'),
		Scroll = require('Scroll');

		function loaded () {

			var phone_btn = $("#phone_btn");
			var phone_content_bg = $("#phone_content_bg");
			var phone_content_box = $("#phone_content_box");

			phone_btn.bind('tap', function (e) {
				phone_content_bg.addClass('show_login_bg');
				phone_content_box.addClass('show_login_box');
			})

			document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

		}

		return {
			start: loaded
		}

})