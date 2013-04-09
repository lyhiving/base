define(function (require, exports, module) {
  var $ = require('$'),
    Base = require('base'),
    IScroll = require('iscroll'),
    Path = require('../url/path'),
    Navigate = require('../url/navigation'),
    $win = $(window),
    page;

  var Page = Base.extend({
    init: function (routers) {
      this.routers = [];
      this._initPages();
      //this._initRouters(routers);
      this._initEvents();
      this.addRouter(Path.documentBase.hrefNoHash);

      //iscroll
      this.iscroll = new IScroll('.content', {
        scroller: this.pages[0].dom
      });

      //页面锚点对应链接
      var hashUrl = Path.parseUrl(Path.squash(Path.documentUrl.href));
      if (Path.documentUrl.hrefNoHash != hashUrl.hrefNoHash) {
        this.forward(hashUrl, true);
      }
    },
    _initPages: function () {
      var pages = this.pages = [];
      $.each($('.page'), function (i, page) {
        if (i === 0) {
          pages.push({
            url: Path.parseUrl(Path.documentUrl.hrefNoHash),
            dom: $(page)
          });
        } else {
          var url = $(page).data('url');
          if (url) {
            pages.push({
              url: Path.parseUrl(Path.makeUrlAbsolute(url)),
              dom: $(page)
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

        //检测路由列表
        if (that.routers.indexOf(href) < 0 || that.activePage.url.hrefNoHash === href) {
          return;
        }

        if (state.direction === 'forward' || that.getIndexByUrl(squashUrl) < 0) {
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
        that.backward(this.href);
      });
    },
    forward: function (href, data, post) {
      var url = $.type(href) === 'object' ? href : Path.parseUrl(Path.squash(Path.makeUrlAbsolute(href))), i;
      //添加到路由列表
      this.addRouter(url.hrefNoHash);

      if ((i = this.getIndexByUrl(url)) < 0) {
        this._createPage({url: url, data: data, post: post});
      } else {
        this.transition(this.pages[i], false);
      }
    },
    backward: function (href, data, post) {
      var url = $.type(href) === 'object' ? href : Path.parseUrl(Path.squash(Path.makeUrlAbsolute(href))), i;
      //添加到路由列表
      this.addRouter(url.hrefNoHash);

      if ((i = this.getIndexByUrl(url)) < 0) {
        this._createPage({url: url, data: data, post: post}, false);
      } else {
        this.transition(this.pages[i], true);
      }
    },
    addRouter: function (url) {
      var routers = this.routers;
      url = Path.makeUrlAbsolute(url);
      if (routers.indexOf(url) < 0) {
        routers.push(url);
      }
    },
    getIndexByUrl: function (url) {
      var pages = this.pages, i = 0, len = pages.length;
      for (; i < len; i++) {
        if (url.hrefNoHash === pages[i].url.hrefNoHash)
          return i;
      }
      return -1;
    },
    transition: function (nextPage, backward) {
      if (nextPage === this.activePage)
        return;

      var that = this,
        url = nextPage.url,
        nextDom = nextPage.dom,
        currentPage = this.activePage,
        currentDom = currentPage.dom,
        currentUrl = currentPage.url;

      nextDom.css('display', 'block');
      var nextMatrix = nextDom.css('transform').split(')')[0].split(', '),
        nextY = 0,
        currentMatrix = currentDom.css('transform').split(')')[0].split(', '),
        currentY = 0;

      if (nextMatrix != 'none') {
        nextY = +(nextMatrix[13] || nextMatrix[5]);
      }
      if (currentMatrix != 'none') {
        currentY = +(currentMatrix[13] || currentMatrix[5]);
      }
      nextDom.css('transform', 'translate(' + (backward ? '-' : '') + '100%,' + nextY + 'px)');
      nextDom.animate({
        translate: 0 + ',' + nextY + 'px'
      }, {
        duration: 250,
        complete: function () {
          that.activePage = nextPage;
          that.iscroll.reset({
            scroller: $(this),
            startY: nextY
          });
          that.trigger('transition', nextPage);
        }
      });
      currentDom.animate({
        translate: (backward ? '' : '-') + '100%,' + currentY + 'px'
      }, {
        duration: 250,
        complete: function () {
          if (currentDom.data('cache') === false) {
            that.pages.splice(that.getIndexByUrl(currentUrl), 1);
            $(this).remove();
          } else {
            $(this).hide();
          }
        }
      });
      if (Path.documentBase.hrefNoHash === url.href) {
        Navigate('#', null, true);
      } else {
        Navigate(url.href, null, true);
      }

    },
    _createPage: function (o, backward) {
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
          this.activePage.dom.after(dom.hide());
          page = {
            url: o.url,
            dom: dom
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
        }
      });
    }
  });

  page = new Page();

  return page;
});