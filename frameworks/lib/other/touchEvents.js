(function($) {

    $.fn.addTouchEventListener = function(){
        
        var window = this[0];

        var touch = {}, touchTimeout;

        function parentIfText(node) {
            return 'tagName' in node ? node : node.parentNode;
        }

        function swipeDirection(x1, x2, y1, y2) {

            var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2);
            if (xDelta >= yDelta) {
                return (x1 - x2 > 0 ? 'Left' : 'Right');
            } else {
                return (y1 - y2 > 0 ? 'Up' : 'Down');
            }

        }

        var longTapDelay = 750;

        function longTap() {
            if (touch.last && (Date.now() - touch.last >= longTapDelay)) {
                touch.el.trigger('longTap', touch);
                touch = {};
            }
        }
        
        var longTapTimer;
        $(window.document).ready(function() {
            var prevEl;
            $(window.document).bind('touchstart', function(e) {

                if(e.originalEvent)
                    e=e.originalEvent;
                if(!e.touches||e.touches.length===0) return;
                var now = Date.now(), delta = now - (touch.last || now);
                if(!e.touches||e.touches.length===0) return;
                touch.el = $(parentIfText(e.touches[0].target));
                touchTimeout && clearTimeout(touchTimeout);
                touch.x1 = e.touches[0].pageX;
                touch.y1 = e.touches[0].pageY;
                touch.x2 = touch.y2 = 0;
                if (delta > 0 && delta <= 250)
                    touch.isDoubleTap = true;

                /*touchBorder*/
                if(touch.x1 < 30 || touch.x1 > window.document.body.clientWidth - 30 || touch.y1 < 30 || touch.y1 > window.document.body.clientHeight - 30) {
                    touch.isTouchBorder = true;
                    touch.el.trigger('touchBorder', touch);
                }

                touch.last = now;
                longTapTimer = setTimeout(longTap, longTapDelay);
               
                if (!touch.el.data("ignore-pressed"))
                    touch.el.addClass("pressed");
                if(prevEl && !prevEl.data("ignore-pressed")&&prevEl[0]!=touch.el[0])
                    prevEl.removeClass("pressed");
                
                prevEl=touch.el;

            }).bind('touchmove', function(e) {

                if(e.originalEvent)
                    e=e.originalEvent;
                touch.x2 = e.touches[0].pageX;
                touch.y2 = e.touches[0].pageY;
                clearTimeout(longTapTimer);
                if (touch.isTouchBorder) {
                    e.preventDefault();
                    touch.el.trigger('swipeBorderMove', touch) &&
                    touch.el.trigger('swipeBorderMove' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)), touch);
                }

            }).bind('touchend', function(e) {

                if(e.originalEvent)
                    e=e.originalEvent;
                if (!touch.el)
                    return;
                if (!touch.el.data("ignore-pressed"))
                    touch.el.removeClass("pressed");
                if (touch.isDoubleTap) {
                    touch.el.trigger('doubleTap', touch);
                    touch = {};  
                } else if (touch.x2 > 0 || touch.y2 > 0) {
                    var eventName = 'swipe';
                    if (touch.isTouchBorder) eventName = 'swipe swipeBorder';
                    (Math.abs(touch.x1 - touch.x2) > 30 || Math.abs(touch.y1 - touch.y2) > 30) &&
                    touch.el.trigger(eventName, touch) &&
                    touch.el.trigger(eventName + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)), touch);
                    touch.x1 = touch.x2 = touch.y1 = touch.y2 = touch.last = 0;
                } else if ('last' in touch) {
                    touch.el.trigger('tap', touch);
                    touchTimeout = setTimeout(function() {
                        touchTimeout = null;
                        if (touch.el)
                            touch.el.trigger('singleTap', touch);
                        touch = {};
                    }, 250);
                }

            }).bind('touchcancel', function() {
           
                if(touch.el && !touch.el.data("ignore-pressed"))
                    touch.el.removeClass("pressed");

                touch = {};
                clearTimeout(longTapTimer);

            });
        });

        ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown', 'swipeBorderMove', 'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(m) {
            $.fn[m] = function(callback) {
                return this.bind(m, callback);
            };
        });
    }

})(af)
