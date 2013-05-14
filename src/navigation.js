define(function (require, exports, module) {
  var $ = require('$'),
    Path = require('./path'),
    History = require('./history'),
    $win = $(window),
    isInit;

  var Navigation = {
    currentHref: Path.documentBase.hrefNoHash,
    go: function (newPath, backward) {
      var index = History.find(newPath.hrefNoHash);

      //回到baseURL
      if (Path.documentBase.hrefNoHash === newPath.hrefNoHash) {
        Path.set('#');
      } else {
        Path.set('#' + newPath.pathname);
      }

      if (index < 0) {
        //如果是forward，则需要把current对应的数据之后的清除
        backward || History.clearForward(this.currentHref);
        History.add(newPath.hrefNoHash, backward);
      }
      this.currentHref = newPath.hrefNoHash;
    }
  };

  $win.on('hashchange', function (e) {
    /*
     * 获取hashchange之后hash部分对应的页面地址，ex:
     * http://127.0.0.1/dev/handyjs/base/examples/flex.html#/dev/handyjs/base/examples/page1.html
     * 得到的newURL = "http://127.0.0.1/dev/handyjs/base/examples/page1.html"
     */
    var newHref = Path.parseUrl(Path.squash(location.href)).hrefNoHash;
    //判断页面是否跳转
    if (newHref === Navigation.currentHref) {
      //页面首次加载
      if (isInit) {
        return;
      } else {
        History.add(newHref);
      }
    } else {
      //原页面对应的History索引，这个是肯定能找到的
      var oldIndex = History.find(Navigation.currentHref);
      //新页面对应History索引，如果没找到(-1)那就是首次访问
      var newIndex = History.find(newHref);
      //触发自定义事件
      $(this).trigger('navigate', {
        state: {
          //如果在History中能获取到index，并且是在老页面索引之前，那就是“后退”了。否则，判定为前进！
          direction: ( -1 < newIndex && newIndex < oldIndex) ? 'backward' : 'forward'
        }
      });
    }
  });

  return Navigation;
});
