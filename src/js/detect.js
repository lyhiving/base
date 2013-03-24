define(function (require, exports, module) {

  var navigator = window.navigator,
    ua = navigator.userAgent,
    dummyStyle = document.createElement('div').style,
    vendor = (function () {
      var vendors = ['t', 'webkitT', 'MozT', 'msT'],
        transform,
        i = 0,
        l = vendors.length;

      for (; i < l; i++) {
        transform = vendors[i] + 'ransform';
        if (transform in dummyStyle) return vendors[i].substr(0, vendors[i].length - 1);
      }

      return false;
    })(),
    os = {}, browser = {}, support = {},
    iphone = ua.match(/iPhone\sOS\s([\d_]+)/),
    ipod = ua.match(/iPod\sOS\s([\d_]+)/),
    ipad = ua.match(/iPad.*OS\s([\d_]+)/),
    android = ua.match(/Android\s+([\d.]+)/),
    wp = ua.match(/Windows\sPhone(?:\sOS)?\s([\d.]+)/),
    safari = ua.match(/Safari\/([\d.]+)/),
    ie = ua.match(/IEMobile\/([\d.]+)/),
    touch = "ontouchend" in document,
  //WP 10 的touch事件
    pointer = navigator.msPointerEnabled,
    transform = prefixStyle('transform'),
    trans3d = prefixStyle('perspective') in dummyStyle,
    transition = prefixStyle('transition') in dummyStyle;

  function prefixStyle(style) {
    if (vendor === false) return false;
    if (vendor === '') return style;
    return vendor + style.charAt(0).toUpperCase() + style.substr(1);
  }

  iphone && (os.ios = os.iphone = true, os.version = iphone[1].replace(/_/g, '.'));
  ipod && (os.ios = os.ipod = true, os.version = ipod[1].replace(/_/g, '.'));
  ipad && (os.ios = os.ipad = true, os.version = ipad[1].replace(/_/g, '.'));
  android && (os.android = true, os.version = android[1]);
  wp && (os.wp = true, os.version = wp[1]);
  //browser
  safari && (browser.safari = true, browser.version = safari[1]);
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
    prefix: vendor
  };
});