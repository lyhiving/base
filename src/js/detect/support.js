define(function (require, exports, module) {
  var $ = require('$');
  $.support || ($.support = {});

  var dummy = doc.createElement('div'),
    dummyStyle = dummy.style,
    vendor = '',
    prefix = (function () {
      var vendors = {'-o-': 'O', '-moz-': 'Moz', '-ms-': 'ms', '-webkit-': 'webkit'}, key;

      for (key in vendors) {
        var v = vendors[key];
        if ((v + 'Transform') in dummyStyle) {
          vendor = v;
          return key;
        }
      }

      return '';
    })(),
    touch = "ontouchend" in doc,
    pointer = navigator.msPointerEnabled,
    transform = prefixStyle('Transform') in dummyStyle,
    trans3d = prefixStyle('Perspective') in dummyStyle,
    transition = prefixStyle('Transition') in dummyStyle;

  function prefixStyle(style) {
    return prefix ? (prefix + style) : style.toLowerCase();
  }

  $.extend($.support, {
    vendor: vendor,
    prefix: prefix,
    touch: touch,
    pointer: pointer,
    transform: transform,
    trans3d: trans3d,
    transition: transition
  });
});