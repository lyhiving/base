define(function (require, exports, module) {
  var $ = require('$'),
    Base = require('base'),
    Path = require('./path'),
    Navigation = require('./navigation'),
    $win = $(window),
    page;

  var Page = Base.extend({
    attrs: {
      easeout: 'page-slideoutleft',
      easein: 'page-slideinright',
      easeoutreverse: 'page-slideoutright',
      easeinreverse: 'page-slideinleft'
    },
    init: function () {
      this._initPages();
      this._initEvents();
    },
    _initPages: function () {

      var pages = this.pages = [];
      //遍历所有.page，缓存
      $.each($('.page'), function (i, page) {
        if (i === 0) {
          pages.push({
            url: Path.parseUrl(Path.documentUrl.hrefNoHash),
            dom: $(page),
            title: document.title
          });
        } else {
          var url = $(page).data('url');
          if (url) {
            pages.push({
              url: Path.parseUrl(Path.makeUrlAbsolute(url)),
              dom: $(page),
              title: $(page).data('title')
            });
          }
        }
      });
      this.activePage = this.pages[0];
    },
    _initEvents: function () {
      var that = this;
      //jquery navigation widget
      $win.on("navigate", function (e, data) {
        var state = data.state,
          squashUrl = Path.parseUrl(Path.squash(location.href)),
          href = squashUrl.hrefNoHash;

        if (state.direction === 'forward') {
          that.forward(squashUrl);
        } else {
          that.backward(squashUrl);
        }
      });
      $(document).on('click', '[data-transition]', function (e) {
        e.preventDefault();
        that.forward(this.href);
      });
      $(document).on('click', '[data-rel=back]', function (e) {
        e.preventDefault();
        window.history.back();
      });
      //页面载入触发一次hashchange，跳转到hash对应的页面。
      $win.trigger('hashchange');
    },
    /**
     * 前进
     * @param href
     * @param data
     * @param post
     */
    forward: function (href, data, post) {
      if (this.transiting)
        return;
      if (href) {
        this.transiting = true;
        var url = $.type(href) === 'object' ? href : Path.parseUrl(Path.squash(Path.makeUrlAbsolute(href))), i;

        if ((i = this._getIndexByUrl(url)) < 0) {
          this._createPage({url: url, data: data, post: post});
        } else {
          this.transition(this.pages[i]);
        }
      }
    },
    /**
     * 后退
     * @param href
     * @param data
     * @param post
     */
    backward: function (href, data, post) {
      if (this.transiting)
        return;
      if (href) {
        this.transiting = true;
        var url = $.type(href) === 'object' ? href : Path.parseUrl(Path.squash(Path.makeUrlAbsolute(href))), i;

        if ((i = this._getIndexByUrl(url)) < 0) {
          this._createPage({url: url, data: data, post: post}, true);
        } else {
          this.transition(this.pages[i], true);
        }
      } else {
        window.history.back();
      }
    },
    /**
     * 转场动画函数
     * @param nextPage
     * @param backward
     */
    transition: function (nextPage, backward) {
      if (nextPage === this.activePage)
        return;

      var that = this,
        url = nextPage.url,
        nextDom = nextPage.dom,
        currentPage = this.activePage,
        currentDom = currentPage.dom,
        currentUrl = currentPage.url,
        slideto = backward ? this.get('easeoutreverse') : this.get('easeout'),
        slidefrom = backward ? this.get('easeinreverse') : this.get('easein');

      that.trigger('transiting');

      nextPage.title && (document.title = nextPage.title);
      currentDom.on('animationend webkitAnimationEnd',function (arguments) {
        currentDom.removeClass('page-active ' + slideto).off('animationend webkitAnimationEnd', arguments.callee);
        if (currentDom.data('cache') === false) {
          that.pages.splice(that._getIndexByUrl(currentUrl), 1);
          currentDom.remove();
        }
      }).addClass(slideto);
      nextDom.on('animationend webkitAnimationEnd',function (arguments) {
        nextDom.removeClass(slidefrom).off('animationend webkitAnimationEnd', arguments.callee);
        that.activePage = nextPage;
        that.transiting = false;
        that.trigger('transition', nextPage);
        window.scrollTo(0, 0);
      }).addClass('page-active ' + slidefrom);

      Navigation.go(url, backward);
    },
    /**
     * 获取page的Index
     * @param url
     * @returns {number}
     * @private
     */
    _getIndexByUrl: function (url) {
      var pages = this.pages, i = 0, len = pages.length;
      for (; i < len; i++) {
        if (url.hrefNoHash === pages[i].url.hrefNoHash)
          return i;
      }
      return -1;
    },
    /**
     * 异步页面载入
     * @param o
     * @param backward
     * @private
     */
    _createPage: function (o, backward) {
      this.trigger('loading');
      $.ajax(o.url.href, {
        type: o.post ? 'post' : 'get',
        data: o.data,
        context: this,
        success: function (data) {
          var html = $("<div></div>"), pages = this.pages, title, body, dom, page;

          title = data.match(/<title[^>]*>([^<]*)/) && RegExp.$1;
          body = data.match(/<body[^>]*>([\s\S]*)<\/body>/img) && RegExp.$1;

          html.get(0).innerHTML = body;
          dom = html.find('[data-role=page]').eq(0);
          if (o.post) {
            dom.data('cache', false);
          }
          this.activePage.dom.after(dom);
          page = {
            url: o.url,
            dom: dom,
            title: title
          };
          this.trigger('load', page);
          if (backward) {
            pages.unshift(page);
            this.transition(page, true);
          } else {
            pages.push(page);
            this.transition(page);
          }
        },
        error: function () {
          this.trigger('error', o);
          this.transiting = false;
        }
      });
    }
  });

  page = new Page();

  return page;
});