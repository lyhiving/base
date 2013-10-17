define(function (require, exports, module) {
  var $ = require('$'), undefined = window.undefined;

  function History() {
    this._stack = [];
  }

  $.extend(History.prototype, {
    /**
     * 新增url到历史
     * @param url
     * @param backward
     */
    add: function (url, backward) {
      this._stack[backward ? 'unshift' : 'push'](url);
    },

    /**
     * 删除当前页之后的History数据
     * @param url
     */
    clearForward: function (url) {
      this._stack = this._stack.slice(0, this.find(url) + 1);
    },
    /**
     * 查找url对应的历史索引
     * @param url
     * @returns {*}
     */
    find: function (url) {
      return this._stack.indexOf(url);
    }
  });

  return new History();
});
