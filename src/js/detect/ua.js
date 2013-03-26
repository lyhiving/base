define(function (require, exports, module) {
  var Detect = require('./base');
  var browser = {};
  var os = {};

  var navigator = window.navigator,
    ua = navigator.userAgent,
    android = ua.match(/Android\s+([\d.]+)/),
    wp = ua.match(/Windows\sPhone(?:\sOS)?\s([\d.]+)/),
    iphone = ua.match(/iPhone\sOS\s([\d_]+)/),
    ipad = !iphone && ua.match(/iPad.*OS\s([\d_]+)/),
    webkit = ua.match(/WebKit\/([\d.]+)/),
    chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
    safari = ua.match(/AppleWebKit.+Version\/([\d.]+)/),
    ie = ua.match(/IEMobile\/([\d.]+)/);

  iphone && (os.ios = os.iphone = true, os.version = iphone[1].replace(/_/g, '.'));
  ipad && (os.ios = os.ipad = true, os.version = ipad[1].replace(/_/g, '.'));
  android && (os.android = true, os.version = android[1]);
  wp && (os.wp = true, os.version = wp[1]);
  //browser
  webkit && (browser.webkit = true, browser.version = webkit[1]);
  safari && (browser.safari = true, browser.version = safari[1]);
  chrome && (browser.chrome = true, browser.version = chrome[1]);
  ie && (browser.ie = true, browser.version = ie[1]);

  Detect.browser = browser;
  Detect.os = os;

  return Detect;
});