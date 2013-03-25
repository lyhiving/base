define(function (require, exports, module) {

  var navigator = window.navigator,
    ua = navigator.userAgent,
    dummyStyle = document.createElement('div').style,
    prefix = (function () {
      var vendors = ['t', 'webkitT', 'MozT', 'msT'],
        transform,
        i = 0,
        l = vendors.length;

      for (; i < l; i++) {
        transform = vendors[i] + 'ransform';
        if (transform in dummyStyle)
          return vendors[i].substr(0, vendors[i].length - 1);
      }

      return '';
    })(),
    os = {}, browser = {}, support = {},
    iphone = ua.match(/iPhone\sOS\s([\d_]+)/),
    ipad = !iphone && ua.match(/iPad.*OS\s([\d_]+)/),
    android = ua.match(/Android\s+([\d.]+)/),
    wp = ua.match(/Windows\sPhone(?:\sOS)?\s([\d.]+)/),
    webkit = ua.match(/WebKit\/([\d.]+)/),
    chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
    ie = ua.match(/IEMobile\/([\d.]+)/),
    touch = "ontouchend" in document,
    pointer = navigator.msPointerEnabled,
    transform = prefixStyle('transform') in dummyStyle,
    trans3d = prefixStyle('perspective') in dummyStyle,
    transition = prefixStyle('transition') in dummyStyle;

  function prefixStyle(style) {
    if (prefix === '') return style;
    return prefix + style.charAt(0).toUpperCase() + style.substr(1);
  }

  iphone && (os.ios = os.iphone = true, os.version = iphone[1].replace(/_/g, '.'));
  ipad && (os.ios = os.ipad = true, os.version = ipad[1].replace(/_/g, '.'));
  android && (os.android = true, os.version = android[1]);
  wp && (os.wp = true, os.version = wp[1]);
  //browser
  webkit && (browser.webkit = true, browser.version = webkit[1]);
  chrome && (browser.chrome = true, browser.version = chrome[1]);
  ie && (browser.ie = true, browser.version = ie[1]);
  //support
  touch && (support.touch = true);
  pointer && (support.pointer = true);
  transform && (support.transform = true);
  trans3d && (support.trans3d = true);
  transition && (support.transition = true);
  return {
    os: os,
    browser: browser,
    support: support,
    prefix: prefix
  };
});