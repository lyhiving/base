define(function (require, exports, module) {
  require('../detect/ua');

  var $ = require('$');

  //IOS 是否是Web App模式
  if (!navigator.standalone) {
    var os = $.os, browser = $.browser, support = $.support;

    if (!os.wp) {
      var win = window, doc = document;

      var bodyStyle = doc.body.style;
      var orientationevent = 'onorientationchange' in win ? 'orientationchange' : 'resize';
      var fullscreen = (function () {
        if (browser.safari) {
          if (os.iphone) {
            return function () {
              bodyStyle.minHeight = doc.documentElement.clientHeight + 60 + 'px';
              win.scrollTo(0, 0);
            }
          } else if (os.android) {
            return function () {
              bodyStyle.minHeight = win.outerHeight / win.devicePixelRatio + 'px';
              win.scrollTo(0, 1); //Android 2.x 需要scrollTo(0, 1)
            }
          }
        } else {
          return function () {
            win.scrollTo(0, 0);
          }

        }
      })();

      //阻止页面默认滚动效果 wp可以通过css -ms-touch-action:none; 实现
      if ('ontouchmove' in win) {
        $(win).on('touchmove', function (e) {
          e.preventDefault();
        });
      }

      $(win).on(orientationevent, fullscreen);
      //页面加载完毕，隐藏地址栏
      $(fullscreen);
    }
  }
});