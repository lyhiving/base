define(function (require, exports, module) {
  var Detect = require('./base');
  require('./ua');
  require('./support');
  return Detect;
});