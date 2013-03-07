define(function (require, exports, module) {

  var ua = navigator.userAgent, os = {}, browser = {}, support = {},
    iphone = ua.match(/iPhone\sOS\s([\d_]+)/),
    ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
    android = ua.match(/Android\s+([\d.]+)/),
    windowsphone = ua.match(/Windows\sPhone(?:\sOS)?\s([\d.]+)/),
    ie = ua.match(/IEMobile\/([\d.]+)/),
    touch = "ontouchend" in document;

  iphone && (os.ios = true, os.version = iphone[1].replace(/_/g, '.'));
  ipad && (os.ios = true, os.version = ipad[1].replace(/_/g, '.'));
  android && (os.android = true, os.version = android[1]);
  windowsphone && (os.windowsphone = true, os.version = windowsphone[1]);
  //browser
  ie && (browser.ie = true, browser.version = ie[1]);
  //support
  touch && (support.touch = true);
  return {os: os, browser: browser, support: support};
});