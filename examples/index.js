define(function (require, exports, module) {
  require('../src/js/viewport');
  var Scroll = require('../src/js/scroll');
  new Scroll('#wrapper');
});

