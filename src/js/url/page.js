define(function (require, exports, module) {
  var $ = require('$'),
    Base = require('base'),
    IScroll = require('../plugin/iscroll'),
    Path = require('./path'),
    Navigate = require('./navigation'),
    $win = $(window),
    page;

  var Page = Base.extend({
    init: function (routers) {
      var dom = $('.page').eq(0), baseUrl = Path.parseUrl(Path.documentUrl.hrefNoHash), hashUrl = Path.parseUrl(Path.squash(Path.documentUrl.href));
      this.pages = [
        {
          url: baseUrl,
          dom: dom
        }
      ];
      this.activeIndex = 0;

      this._initRouters(routers);
      //iscroll
      this.iscroll = new IScroll('.content', {
        scroller: dom
      });

      if (baseUrl.hrefNoHash != hashUrl.hrefNoHash) {
        this.forward(hashUrl, true);
      }

      this._initEvents();
    },
    _initRouters: function (urls) {
      var routers = this.routers = [];
      urls = $.makeArray(urls);
      $.each(urls, function (i, url) {
        routers.push(Path.makeUrlAbsolute(url));
      });
    },
    _initEvents: function () {
      var that = this;
      //jquery navigation widget
      $win.on("navigate", function (e, data) {
        console.log(data.state);
        var squashUrl = Path.parseUrl(Path.squash(location.href)),
          href = squashUrl.hrefNoHash;

        //检测路由列表
        if (that.routers.indexOf(href) < 0 || that.pages[that.activeIndex].url.hrefNoHash === href) {
          return;
        }

        if (that.getIndexByUrl(squashUrl) < 0) {
          that.forward(squashUrl);
        } else {
          that.backward(squashUrl);
        }

        //        var state = data.state;
        //        if (state.url) {
        //          if (state.direction === 'back') {
        //            that.backward(state.url);
        //          } else {
        //            that.forward(state.url, true);
        //          }
        //        } else {
        //          var baseHref = that.pages[0].url.hrefNoHash,
        //            locationHref = Path.parseLocation().hrefNoHash;
        //          if (locationHref == baseHref) {
        //            page.backward(baseHref);
        //          } else {
        //            page.forward(Path.squash(locationHref));
        //          }
        //        }
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
    forward: function (href) {
      var url = $.type(href) === 'object' ? href : Path.parseUrl(Path.squash(Path.makeUrlAbsolute(href))), i;
      //添加到路由列表
      this.addRouter(url.hrefNoHash);

      if ((i = this.getIndexByUrl(url)) < 0) {
        this._createPage(url);
      } else {
        this.transition(i, false);
      }
    },
    backward: function (href) {
      var url = $.type(href) === 'object' ? href : Path.parseUrl(Path.squash(Path.makeUrlAbsolute(href))), i;
      //添加到路由列表
      this.addRouter(url.hrefNoHash);

      if ((i = this.getIndexByUrl(url)) < 0) {
        this._createPage(url, false, true);
      } else {
        this.transition(i, true);
      }
    },
    addRouter: function (url) {
      var routers = this.routers;
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
    transition: function (nextIndex, backward) {
      if (nextIndex === this.activeIndex)
        return;

      var that = this,
        url = this.pages[nextIndex].url,
        nextDom = this.pages[nextIndex].dom,
        currentDom = this.pages[this.activeIndex].dom;

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
          that.activeIndex = nextIndex;
          that.iscroll.reset({
            scroller: $(this),
            startY: nextY
          });
        }
      });
      currentDom.animate({
        translate: (backward ? '' : '-') + '100%,' + currentY + 'px'
      }, {
        duration: 250,
        complete: function () {
          $(this).hide();
        }
      });
      if (Path.documentBase.hrefNoHash === url.href) {
        Navigate('', null, true);
      } else {
        Navigate(url.href, null, true);
      }

    },
    _createPage: function (url, backward) {
      $.ajax(url.href, {
        context: this,
        success: function (data) {

          var html = $("<div></div>"), pages = this.pages, title, body, dom, o;

          title = data.match(/<title[^>]*>([^<]*)/) && RegExp.$1;
          body = data.match(/<body[^>]*>([\s\S]*)<\/body>/img) && RegExp.$1;

          html.get(0).innerHTML = body;
          dom = html.find('[data-role=page]').eq(0);
          pages[this.activeIndex].dom.after(dom.hide());

          o = {
            url: url,
            dom: dom
          };
          if (backward) {
            pages.unshift(o);
            this.transition(0, true);
          } else {
            pages.push(o);
            this.transition(pages.length - 1);
          }
        },
        error: function () {

        }
      });
    }
  });

  page = new Page();

  return page;
});