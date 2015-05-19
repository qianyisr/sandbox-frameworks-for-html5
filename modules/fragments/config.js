define(function (require, exports, module) {
  return {
    config : {
    	hidden : true
    },
    resources : {
      script: {
      },
      source: {
        "feed_list": "source/feed-list"
      },
      layout: {
      	"feed_list": "css/feed-list"
      }
    },
    fragments: {
      feedList: {
        source : ["feed_list"],
        layout : ["feed_list"]
      }
    },
    plugins : {
      animation: function (event) {
        var move = require("Move");
        var device = require("Device");

        var width = device.ui.width;
        var height = device.ui.height;

        var view = event.view;
        var reverse = event.reverse;

        if ( reverse ) {
          //console.log(reverse)
          move(view[0]).duration(0).to(-width/3, 0).end();
          setTimeout(function () {

            move(view[0]).duration('.3s').set('filter', 'brightness(1)').to(0, 0).end();
            move(view[1]).duration('.3s').to(width, 0).end(function () {
              event.callback();
            });

          }, 10);
        } else {
          move(view[0]).perspective(1000).set('height', height + 'px').duration(0).to(width, 0).set("transform-origin", "right").rotateY(30).end();
          move(view[1]).set("transform-origin", "left").set('height', height + 'px').duration(0).rotateY(0).end();

          setTimeout(function () {

            move(view[1]).duration('.6s').set('filter', 'brightness(.3)').rotateY(10).to(-width/3, 0).end();
            move(view[0]).duration('.6s').rotateY(0).to(0, 0).end(function () {
              event.callback();
            });

          }, 50);
        }

        

        



          // move(view[0]).duration('.3s').to(50, 50).end(function () {
          //     move(view[0])
          //     .to(0, 0)
          //     .then()
          //       .duration('.5s')
          //       .end(function () {
          //         event.callback();
          //       });
          // })
        
      }
    }
  }
})