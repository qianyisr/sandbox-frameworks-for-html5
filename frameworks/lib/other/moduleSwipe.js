define(function (require, exports, module) {

  var $ = require('Jquery');
  var device = require('Device');
  var commonUtils = require("Utils");

  function Swipe (slides, options) {
    "use strict";

    // 检查浏览器功能
    var browser = {
      touch: device.feat.touch,
      feat : {
        transition: commonUtils._prefixStyle('transition'),
        transform: commonUtils._prefixStyle('transform')
      }
    }

    var width = document.body.offsetWidth;

    function slide (to, slideSpeed) {

      if ( index == to ) return;
      
      if ( browser.feat.transition ) {

        move(index, width * direction, slideSpeed || speed);
        move(to, 0, slideSpeed || speed);

      } else {

        animate(index * -width, to * -width, slideSpeed || speed);

      }

      index = to;

      offloadFn(options.callback && options.callback(index, slides[index]));

    }

    function move(index, dist, speed) {
      translate(slides[index].element, dist, speed);
      slidePos[index] = dist;
    }

    function translate(slide, dist, speed) {

      var style = slide && slide.style;

      if (!style) return;

      style[browser.feat.transition] = speed + 'ms';
      style[browser.feat.transform] = 'translate(' + dist + 'px, 0)' + 'translateZ(0)';

    }
  
  }

  return {
    swipe : function (slides, options) {
      return new Swipe(slides, options);
    }
  }

})
/*
define(function (require, exports, module) {
  function Swipe (options) {
    "use strict";

    var $ = require('Jquery');
    var device = require('Device');
    var commonUtils = require("Utils");

    // 公共
    var noop = function () {}; // 无操作空函数
    var offloadFn = function (fn) { setTimeout(fn || noop, 0) }; // 卸载一个函数的执行
    
    // 检查浏览器功能
    var browser = {
      touch: device.feat.touch,
      transitions: commonUtils._prefixStyle('transform')
    }

    // 如果没有根元素退出
    var element = document.getElementById('modules');
    var slides, 
        slidePos, 
        width;
    options = options || {};

    var index = parseInt(options.startSlide, 10) || 0;
    var speed = options.speed || 250;
    options.continuous = options.continuous ? options.continuous : true;

    function setup () {

      // 缓存幻灯片
      slides = element.children;

      // 创建一个数组来存储每张幻灯片的当前位置
      slidePos = new Array(slides.length);

      // 确定每张幻灯片的宽度
      width = element.offsetWidth;

      // 元素堆栈
      var pos = slides.length;
      while(pos--) {

        var slide = slides[pos];

        slide.style.width = width + 'px';
        slide.setAttribute('data-index', pos);

        if (browser.transitions) {
          //slide.style.left = (pos * -width) + 'px';
          move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
        }

      }

      //if (!browser.transitions) element.style.left = (index * -width) + 'px';

    }

    function prev() {

      if (index) slide(index-1);
      else if (options.continuous) slide(slides.length-1);

    }

    function next() {

      if (index < slides.length - 1) slide(index+1);
      else if (options.continuous) slide(0);

    }

    function slide(to, slideSpeed) {

      // 如果已经在要到达的幻灯片，什么都不做
      if (index == to) return;
      
      if (browser.transitions) {

        var diff = Math.abs(index-to) - 1;
        var direction = Math.abs(index-to) / (index-to); // 1:right -1:left

        while (diff--) move((to > index ? to : index) - diff - 1, width * direction, 0);

        move(index, width * direction, slideSpeed || speed);
        move(to, 0, slideSpeed || speed);

      } else {

        animate(index * -width, to * -width, slideSpeed || speed);

      }

      index = to;

      offloadFn(options.callback && options.callback(index, slides[index]));

    }

    function move(index, dist, speed) {
      translate(slides[index], dist, speed);
      slidePos[index] = dist;

    }

    function translate(slide, dist, speed) {

      var style = slide && slide.style;

      if (!style) return;

      style.webkitTransitionDuration = 
      style.MozTransitionDuration = 
      style.msTransitionDuration = 
      style.OTransitionDuration = 
      style.transitionDuration = speed + 'ms';

      style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
      style.msTransform = 
      style.MozTransform = 
      style.OTransform = 'translateX(' + dist + 'px)';

    }

    function animate(from, to, speed) {

      // 如果不是动画，只是重新定位
      if (!speed) {
        
        element.style.left = to + 'px';
        return;

      }
      
      var start = +new Date;
      
      var timer = setInterval(function() {

        var timeElap = +new Date - start;
        
        if (timeElap > speed) {

          element.style.left = to + 'px';

          if (delay) begin();

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

          clearInterval(timer);
          return;

        }

        element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

      }, 4);

    }

    // 设置自动幻灯片放映
    var delay = options.auto || 0;
    var interval;

    function begin() {

      interval = setTimeout(next, delay);

    }

    function stop() {

      delay = 0;
      clearTimeout(interval);

    }


    // 设置初始值
    var start = {};
    var delta = {};
    var isScrolling;      

    // 设置事件捕获
    var events = {

      handleEvent: function(event) {

        switch (event.type) {
          case 'touchstart': this.start(event); break;
          case 'touchmove': this.move(event); break;
          case 'touchend': offloadFn(this.end(event)); break;
          case 'webkitTransitionEnd':
          case 'msTransitionEnd':
          case 'oTransitionEnd':
          case 'otransitionend':
          case 'transitionend': offloadFn(this.transitionEnd(event)); break;
          case 'resize': offloadFn(setup.call()); break;
        }

        if (options.stopPropagation) event.stopPropagation();

      },
      start: function(event) {

        var touches = event.touches[0];

        // 测量起始值
        start = {

          // 获得初始触摸坐标
          x: touches.pageX,
          y: touches.pageY,

          // 记录时间来确定触摸持续时间
          time: +new Date

        };
        
        // 用于测试的第一个移动事件
        isScrolling = undefined;

        // 重置变动量和测量结束
        delta = {};

        // 关联 touchmove 和 touchend 事件
        element.addEventListener('touchmove', this, false);
        element.addEventListener('touchend', this, false);

      },
      move: function(event) {

        // 确保拖拽有效
        if ( event.touches.length > 1 || event.scale && event.scale !== 1) return;

        if (options.disableScroll) event.preventDefault();  //选项中是否组织触发滚动

        var touches = event.touches[0];

        // 测量改变x和y
        delta = {
          x: touches.pageX - start.x,
          y: touches.pageY - start.y
        }

        // 确定是否滚动运行
        if ( typeof isScrolling == 'undefined') {
          isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
        }

        // 是否是要垂直滚动
        if (!isScrolling) {

          // 防止原生滚动 
          event.preventDefault();

          // 停止幻灯片
          stop();

          // 增加阻力，如果第一个或最后一张幻灯片
          delta.x = 
            delta.x / 
              ( (!index && delta.x > 0               // 如果第一张幻灯片和滑动在左
                || index == slides.length - 1        // 或者如果最后一张幻灯片和滑动在右
                && delta.x < 0                       // 如果滑在所有
              ) ?                      
              ( Math.abs(delta.x) / width + 1 )      // 确定阻力级别
              : 1 );                                 // false，没有阻力
          
          // translate 1:1
          translate(slides[index-1], delta.x + slidePos[index-1], 0);
          translate(slides[index], delta.x + slidePos[index], 0);
          translate(slides[index+1], delta.x + slidePos[index+1], 0);

        }

      },
      end: function(event) {

        // 测量时间
        var duration = +new Date - start.time;

        // 确定幻灯片试图触发下一个/上一张幻灯片
        var isValidSlide = 
              Number(duration) < 250               // 如果幻灯片持续时间小于250毫秒
              && Math.abs(delta.x) > 20            // 并且幻灯片AMT大于20像素
              || Math.abs(delta.x) > width/2;      // 或者滑动AMT大于宽度的一半

        // 确定幻灯片的尝试是过去的起点和终点
        var isPastBounds = 
              !index && delta.x > 0                            // if first slide and slide amt is greater than 0
              || index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0
        
        // determine direction of swipe (true:right, false:left)
        var direction = delta.x < 0;

        // 如果没有垂直滚动
        if (!isScrolling) {

          if (isValidSlide && !isPastBounds) {

            if (direction) {

              move(index-1, -width, 0);
              move(index, slidePos[index]-width, speed);
              move(index+1, slidePos[index+1]-width, speed);
              index += 1;

            } else {

              move(index+1, width, 0);
              move(index, slidePos[index]+width, speed);
              move(index-1, slidePos[index-1]+width, speed);
              index += -1;

            }

            options.callback && options.callback(index, slides[index]);

          } else {

            move(index-1, -width, speed);
            move(index, 0, speed);
            move(index+1, width, speed);

          }

        }

        // 移除touchmove&touchend事件侦听器，直到再次调用touchstart
        element.removeEventListener('touchmove', events, false);
        element.removeEventListener('touchend', events, false);

      },
      transitionEnd: function(event) {

        if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
          
          if (delay) begin();

          options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

        }

      }

    }

    // 触发设置
    setup();

    // 开始自动幻灯片放映（如适用）
    if (delay) begin();


    // 添加事件侦听器
      
    // 对元素设置touchstart事件   
    if (browser.touch) element.addEventListener('touchstart', events, false);

    if (browser.transitions) {
      element.addEventListener('webkitTransitionEnd', events, false);
      element.addEventListener('msTransitionEnd', events, false);
      element.addEventListener('oTransitionEnd', events, false);
      element.addEventListener('otransitionend', events, false);
      element.addEventListener('transitionend', events, false);
    }

    // 设置窗口size改变事件
    window.addEventListener('resize', events, false);

    // 暴露给外部调用滑动的API
    return {
      setup: function() {

        setup();

      },
      slide: function(to, speed) {

        slide(to, speed);

      },
      prev: function() {

        // 取消幻灯播放
        stop();

        prev();

      },
      next: function() {

        stop();

        next();

      },
      getPos: function() {

        // 返回当前索引位置
        return index;

      },
      kill: function() {

        // 取消幻灯播放
        stop();

        // 重置dom对象
        element.style.width = 'auto';
        element.style.left = 0;

        // 重置幻灯片
        var pos = slides.length;
        while(pos--) {

          var slide = slides[pos];
          slide.style.width = '100%';
          slide.style.left = 0;

          if (browser.transitions) translate(slides[pos], 0, 0);

        }

        // 删除事件绑定

        // 删除当前dom的事件监听器
        element.removeEventListener('touchstart', events, false);
        element.removeEventListener('webkitTransitionEnd', events, false);
        element.removeEventListener('msTransitionEnd', events, false);
        element.removeEventListener('oTransitionEnd', events, false);
        element.removeEventListener('otransitionend', events, false);
        element.removeEventListener('transitionend', events, false);
        window.removeEventListener('resize', events, false);


      }
    }

  }

  return {
    swipe : function (options) {
      return new Swipe(options);
    }
  }

})
*/
