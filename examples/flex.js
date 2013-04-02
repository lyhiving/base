define(function (require, exports, module) {
  var $ = require('$');
  var IScroll = require('../src/js/plugin/iscroll-debug');
  console.log($.support)
  require('flex');
  $('#user-agent').val(navigator.userAgent);
  $('header').on('tap',function (e) {
    console.log('tap', e);
  }).on('singleTap',function (e) {
      console.log('singleTap', e);
    }).on('longTap',function (e) {
      console.log('longTap', e);
    }).on('doubleTap',function (e) {
      console.log('doubleTap', e)
    }).on('swipe',function (e) {
      console.log('swipe', e)
    }).on('swipeUp',function (e) {
      console.log('swipeUp', e)
    }).on('swipeDown',function (e) {
      console.log('swipeDown', e)
    }).on('swipeLeft',function (e) {
      console.log('swipeLeft', e)
    }).on('swipeRight', function (e) {
      console.log('swipeRight', e)
    });

  new IScroll('.content', {
    scroller: '.page'
  });
});

