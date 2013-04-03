define(function (require, exports, module) {
  var $ = require('$');
  var IScroll = require('../src/js/plugin/iscroll-debug');
  var History = require('../src/js/url/history.js');
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

  History.Adapter.bind(window, 'statechange', function () { // Note: We are using statechange instead of popstate
    var State = History.getState(); // Note: We are using History.getState() instead of event.state
    console.info(State.data, State.title, State.url);
  });

  $('#anchor1').on('click', function () {
    History.pushState({state: 1, rand: Math.random()}, "State 1", "aaa.html");
    return false;
  });
  $('#anchor2').on('click', function () {
    History.pushState({state: 2, rand: Math.random()}, "State 2", "bbb.html");
    return false;
  });
  $('#anchor3').on('click', function () {
    History.back();
    return false;
  });
});

