define(function (require, exports, module) {
  require('flex');
  var $ = require('$');
  //var History = require('history');
  var Page = require('page');
  var $win = $(window);

  $('#user-agent').val(navigator.userAgent);

  //zepto touch events
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

  Page.on('load',function () {
    console.info('load', arguments);
  }).on('transition',function () {
      console.info('transition', arguments);
    }).init(['flex.html', 'page1.html']);
});

