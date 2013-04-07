define(function (require, exports, module) {
  var $ = require('$');
  var IScroll = require('iscroll');
  //var History = require('history');
  var Navigate = require('navigate');
  require('flex');

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

  //iscroll
  new IScroll('.content', {
    scroller: '.page'
  });

  //jquery navigation widget
  $(window).on("beforenavigate", function (e) {
    console.log(arguments);
  });
  $(window).on("navigate", function (e, data) {
    console.log(arguments);
  });
  $('#anchor1').on('click', function (e) {
    e.preventDefault();
    $('.page').animate({
      translateX: '-100%'
    });
  });
  $('#anchor2').on('click', function (e) {
    e.preventDefault();
    Navigate($(this).attr("href"), {
      foo: '2'
    });
  });
  $('#anchor3').on('click', function (e) {
    e.preventDefault();
    window.history.back();
  });
});

