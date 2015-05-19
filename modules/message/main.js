define(function (require, exports, module) {
	var Scroll = require('Scroll');
	var $ = require('Jquery');


		function loaded () {

				//$(".scroller").clone().appendTo("#header");
				// var frameContainer = document.createElement('iframe');

	   //              // set sandbox;
	   //              $(frameContainer).attr({
	   //                  "name"      : "clone", 
	   //                  "src"       : "about:blank",
	   //                  "seamless"  : "seamless",
	   //                  "style"		: "position: absolute; z-index: 9999; width: 110%; height: 110%; border: 0px; top: 100px; bottom: 0px; overflow: hidden; "
	   //              });

	   //              var html = document.documentElement.innerHTML;

	   //              $(window.parent.document).find("#header")[0].appendChild(frameContainer);

	   //              // frame : document and window;
		  //           var frameDoc = frameContainer.contentDocument;
		  //           var frameWindow = frameContainer.contentWindow.window;

		  //           frameDoc.open();
		  //           frameDoc.write(html);
		  //           frameDoc.close();




		  //   $(frameWindow.document).ready(function () {

		  //   	$(frameWindow.document.body).css({"-webkit-filter": "blur(10px)"});




		    	// var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
       //          var observer = new MutationObserver(function(mutations) {
       //              console.log(mutations)
       //              mutations.forEach(function(record) {
       //                  if(record.attributeName == "value"){
       //                      console.log(record.target)
       //                      console.log(record.oldValue)
       //                  }
       //              });
       //          });

                // var list = $('.scroller')[0];
                // observer.observe(list, {
                //     attributes: true,
                //     childList: true,
                //     characterData: true,
                //     attributeOldValue :true,
                //     attributeFilter:["style"]//只监听value属性,提高性能
                // });













		    	// var cloneScroll = $(frameWindow.document).find("#wrapper")[0];

				



       //          $('.scroller').observer({
       //              attributes: true,
       //              attributeFilter:["style", "class", "id"]//只监听value属性,提高性能
       //          }, function (mutations) {
       //          	console.log(mutations)
       //          	cloneScroll.style.cssText = mutations[0].target.attributes.style.value;
       //          })

				// var swipeBanner = new Scroll(cloneScroll)

				// myScroll.on("scroll", function () {
				// 	swipeBanner.scrollTo(0, this.y, 0, null)
				// })

				// $('.scroller')[0].addEventListener("DOMAttrModified", function (event) {
				// 	console.log(event)
				// 	//$(this).clone().appendTo("#header");
				// }, false)

			// })

				// console.log($("#wrapper")[0])
				// $("#wrapper")[0].addEventListener("DOMNodeRemoved", function (event) {
				// 	console.log(event)
				// 	//$(this).clone().appendTo("#header");
				// }, false)
				// $("#wrapper")[0].addEventListener("DOMAttrModified", function (event) {
				// 	console.log(event)
				// 	//$(this).clone().appendTo("#header");
				// }, false)

				// var myScroll = new Scroll('#wrapper', {
				// 	scrollbars: false,
				// 	mouseWheel: true,
				// 	interactiveScrollbars: true,
				// 	probeType: 3,
				// 	deceleration: 0.003,
				// 	preventDefault: false
				// });
				
			document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
			
		}


		return {
			start: loaded
		}

})