define(function (require, exports, module) {
  var $ = require('$');
  //IOS 是否是Web App模式
  var standalone = navigator.standalone;

  if (!standalone) {
    var Detect = require('./detect'), support = Detect.support;
    //windows phone 8 比较给力，不用做任何操作
    if (!Detect.os.wp) {
      var win = window;
      var touchstart = (support.touch && 'touchstart')
        || (support.pointer && 'mspointerdown')
        || 'mousedown';

      var bodyStyle = document.body.style;
      var orientationevent = 'onorientationchange' in win ? 'orientationchange' : 'resize';
      var fullscreen = fullscreenAdapt();

      //阻止页面默认滚动效果
      if ('ontouchmove' in win) {
        $(win).on('touchmove', function (e) {
          e.preventDefault();
        });
      }

      $(win).on(orientationevent, fullscreen)
        .on(touchstart, fullscreen);
      //页面加载完毕，隐藏地址栏
      $(fullscreen);

      function fullscreenAdapt() {
        if (Detect.os.iphone && !Detect.browser.safari) {
          return function () {
            bodyStyle.minHeight = document.documentElement.clientHeight + 60 + 'px';
            win.scrollTo(0, 0);
          }
        } else if (Detect.os.android) {
          return function () {
            //bodyStyle.minHeight = win.outerHeight / win.devicePixelRatio + 'px';
            win.scrollTo(0, 1); //Android 2.x 需要scrollTo(0, 1)
          }
        } else {
          return function () {
            //win.scrollTo(0, 0);
          }

        }
      }
    }
  }
});