define(function (require, exports, module) {
  document.getElementById('console').value = navigator.userAgent;

  require('../src/js/layout/flex');
  var Scroll = require('../src/js/plugin/scroll');
  new Scroll('.content');
});

