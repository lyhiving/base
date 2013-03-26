define(function (require, exports, module) {
  var Detect = require('./base');
  var support = {};
  var doc = document;

  var dummyStyle = doc.createElement('div').style,
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
    touch = "ontouchend" in doc,
    pointer = navigator.msPointerEnabled,
    transform = prefixStyle('transform') in dummyStyle,
    trans3d = prefixStyle('perspective') in dummyStyle,
    transition = prefixStyle('transition') in dummyStyle;

  function prefixStyle(style) {
    if (prefix === '')
      return style;
    return prefix + style.charAt(0).toUpperCase() + style.substr(1);
  }

  //support
  support.prefix = prefix;
  touch && (support.touch = true);
  pointer && (support.pointer = true);
  transform && (support.transform = true);
  trans3d && (support.trans3d = true);
  transition && (support.transition = true);

  Detect.support = support;
  return support;
});