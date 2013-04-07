define(function (require, exports, module) {
  var $ = require('$'), Path = require('./path');

  var defaults = {
    // Automatically load and show pages based on location.hash
    hashListeningEnabled: true,
    pushStateEnabled: true
  }, $win = $(window), History, Navigator, navigate;

  $.extend($.support, {
    // Note, Chrome for iOS has an extremely quirky implementation of popstate.
    // We've chosen to take the shortest path to a bug fix here for issue #5426
    // See the following link for information about the regex chosen
    // https://developers.google.com/chrome/mobile/docs/user-agent#chrome_for_ios_user-agent
    pushState: "pushState" in history &&
      "replaceState" in history &&
      (window.navigator.userAgent.search(/CriOS/) === -1)
  });

  //扩展浏览器事件 navigate beforenavigate
  (function (undefined) {
    var self, history;

    $.event.special.navigate = self = {
      bound: false,

      pushStateEnabled: true,

      originalEventName: undefined,

      // If pushstate support is present and push state support is defined to
      // be true on the mobile namespace.
      isPushStateEnabled: function () {
        return $.support.pushState &&
          defaults.pushStateEnabled === true &&
          this.isHashChangeEnabled();
      },

      // !! assumes mobile namespace is present
      isHashChangeEnabled: function () {
        return defaults.hashListeningEnabled === true;
      },

      // TODO a lot of duplication between popstate and hashchange
      popstate: function (event) {
        var newEvent = new $.Event("navigate"),
          beforeNavigate = new $.Event("beforenavigate"),
          state = event.originalEvent.state || {},
          href = location.href;

        $win.trigger(beforeNavigate);

        if (beforeNavigate.isDefaultPrevented()) {
          return;
        }

        if (event.historyState) {
          $.extend(state, event.historyState);
        }

        // Make sure the original event is tracked for the end
        // user to inspect incase they want to do something special
        newEvent.originalEvent = event;

        // NOTE we let the current stack unwind because any assignment to
        //      location.hash will stop the world and run this event handler. By
        //      doing this we create a similar behavior to hashchange on hash
        //      assignment
        setTimeout(function () {
          $win.trigger(newEvent, {
            state: state
          });
        }, 0);
      },

      hashchange: function (event, data) {
        var newEvent = new $.Event("navigate"),
          beforeNavigate = new $.Event("beforenavigate");

        $win.trigger(beforeNavigate);

        if (beforeNavigate.isDefaultPrevented()) {
          return;
        }

        // Make sure the original event is tracked for the end
        // user to inspect incase they want to do something special
        newEvent.originalEvent = event;

        // Trigger the hashchange with state provided by the user
        // that altered the hash
        $win.trigger(newEvent, {
          // Users that want to fully normalize the two events
          // will need to do history management down the stack and
          // add the state to the event before this binding is fired
          // TODO consider allowing for the explicit addition of callbacks
          //      to be fired before this value is set to avoid event timing issues
          state: event.hashchangeState || {}
        });
      },

      // TODO We really only want to set this up once
      //      but I'm not clear if there's a beter way to achieve
      //      this with the jQuery special event structure
      setup: function (data, namespaces) {
        if (self.bound) {
          return;
        }

        self.bound = true;

        if (self.isPushStateEnabled()) {
          self.originalEventName = "popstate";
          $win.on("popstate.navigate", self.popstate);
        } else if (self.isHashChangeEnabled()) {
          self.originalEventName = "hashchange";
          $win.on("hashchange.navigate", self.hashchange);
        }
      }
    };
  })();

  (function (undefined) {
    History = function (stack, index) {
      this.stack = stack || [];
      this.activeIndex = index || 0;
    };

    $.extend(History.prototype, {
      getActive: function () {
        return this.stack[ this.activeIndex ];
      },

      getLast: function () {
        return this.stack[ this.previousIndex ];
      },

      getNext: function () {
        return this.stack[ this.activeIndex + 1 ];
      },

      getPrev: function () {
        return this.stack[ this.activeIndex - 1 ];
      },

      // addNew is used whenever a new page is added
      add: function (url, data) {
        data = data || {};

        //if there's forward history, wipe it
        if (this.getNext()) {
          this.clearForward();
        }

        // if the hash is included in the data make sure the shape
        // is consistent for comparison
        if (data.hash && data.hash.indexOf("#") === -1) {
          data.hash = "#" + data.hash;
        }

        data.url = url;
        this.stack.push(data);
        this.activeIndex = this.stack.length - 1;
      },

      //wipe urls ahead of active index
      clearForward: function () {
        this.stack = this.stack.slice(0, this.activeIndex + 1);
      },

      find: function (url, stack, earlyReturn) {
        stack = stack || this.stack;

        var entry, i, length = stack.length, index;

        for (i = 0; i < length; i++) {
          entry = stack[i];

          if (decodeURIComponent(url) === decodeURIComponent(entry.url) ||
            decodeURIComponent(url) === decodeURIComponent(entry.hash)) {
            index = i;

            if (earlyReturn) {
              return index;
            }
          }
        }

        return index;
      },

      closest: function (url) {
        var closest, a = this.activeIndex;

        // First, take the slice of the history stack before the current index and search
        // for a url match. If one is found, we'll avoid avoid looking through forward history
        // NOTE the preference for backward history movement is driven by the fact that
        //      most mobile browsers only have a dedicated back button, and users rarely use
        //      the forward button in desktop browser anyhow
        closest = this.find(url, this.stack.slice(0, a));

        // If nothing was found in backward history check forward. The `true`
        // value passed as the third parameter causes the find method to break
        // on the first match in the forward history slice. The starting index
        // of the slice must then be added to the result to get the element index
        // in the original history stack :( :(
        //
        // TODO this is hyper confusing and should be cleaned up (ugh so bad)
        if (closest === undefined) {
          closest = this.find(url, this.stack.slice(a), true);
          closest = closest === undefined ? closest : closest + a;
        }

        return closest;
      },

      direct: function (opts) {
        var newActiveIndex = this.closest(opts.url), a = this.activeIndex;

        // save new page index, null check to prevent falsey 0 result
        // record the previous index for reference
        if (newActiveIndex !== undefined) {
          this.activeIndex = newActiveIndex;
          this.previousIndex = a;
        }

        // invoke callbacks where appropriate
        //
        // TODO this is also convoluted and confusing
        if (newActiveIndex < a) {
          ( opts.present || opts.back || $.noop )(this.getActive(), 'back');
        } else if (newActiveIndex > a) {
          ( opts.present || opts.forward || $.noop )(this.getActive(), 'forward');
        } else if (newActiveIndex === undefined && opts.missing) {
          opts.missing(this.getActive());
        }
      }
    });
  })();

  (function (undefined) {

    Navigator = function (history) {
      this.history = history;
      this.ignoreInitialHashChange = true;

      // This ensures that browsers which don't fire the initial popstate
      // like opera don't have further hash assignment popstates blocked
      setTimeout($.proxy(function () {
        this.ignoreInitialHashChange = false;
      }, this), 200);

      $win.on({
        "popstate.history": $.proxy(this.popstate, this),
        "hashchange.history": $.proxy(this.hashchange, this)
      });
    };

    $.extend(Navigator.prototype, {
      squash: function (url, data) {
        var state, href, hash = Path.isPath(url) ? Path.stripHash(url) : url;

        href = Path.squash(url);

        // make sure to provide this information when it isn't explicitly set in the
        // data object that was passed to the squash method
        state = $.extend({
          hash: hash,
          url: href
        }, data);

        // replace the current url with the new href and store the state
        // Note that in some cases we might be replacing an url with the
        // same url. We do this anyways because we need to make sure that
        // all of our history entries have a state object associated with
        // them. This allows us to work around the case where $.mobile.back()
        // is called to transition from an external page to an embedded page.
        // In that particular case, a hashchange event is *NOT* generated by the browser.
        // Ensuring each history entry has a state object means that onPopState()
        // will always trigger our hashchange callback even when a hashchange event
        // is not fired.
        window.history.replaceState(state, state.title || document.title, href);

        return state;
      },

      hash: function (url, href) {
        var parsed, loc, hash;

        // Grab the hash for recording. If the passed url is a path
        // we used the parsed version of the squashed url to reconstruct,
        // otherwise we assume it's a hash and store it directly
        parsed = Path.parseUrl(url);
        loc = Path.parseLocation();

        if (loc.pathname + loc.search === parsed.pathname + parsed.search) {
          // If the pathname and search of the passed url is identical to the current loc
          // then we must use the hash. Otherwise there will be no event
          // eg, url = "/foo/bar?baz#bang", location.href = "http://example.com/foo/bar?baz"
          hash = parsed.hash ? parsed.hash : parsed.pathname + parsed.search;
        } else if (Path.isPath(url)) {
          var resolved = Path.parseUrl(href);
          // If the passed url is a path, make it domain relative and remove any trailing hash
          hash = resolved.pathname + resolved.search + (Path.isPreservableHash(resolved.hash) ? resolved.hash.replace("#", "") : "");
        } else {
          hash = url;
        }

        return hash;
      },

      // TODO reconsider name
      go: function (url, data, noEvents) {
        var state, href, hash, popstateEvent,
          isPopStateEvent = $.event.special.navigate.isPushStateEnabled();

        // Get the url as it would look squashed on to the current resolution url
        href = Path.squash(url);

        // sort out what the hash sould be from the url
        hash = this.hash(url, href);

        // Here we prevent the next hash change or popstate event from doing any
        // history management. In the case of hashchange we don't swallow it
        // if there will be no hashchange fired (since that won't reset the value)
        // and will swallow the following hashchange
        if (noEvents && hash !== Path.stripHash(Path.parseLocation().hash)) {
          this.preventNextHashChange = noEvents;
        }

        // IMPORTANT in the case where popstate is supported the event will be triggered
        //      directly, stopping further execution - ie, interupting the flow of this
        //      method call to fire bindings at this expression. Below the navigate method
        //      there is a binding to catch this event and stop its propagation.
        //
        //      We then trigger a new popstate event on the window with a null state
        //      so that the navigate events can conclude their work properly
        //
        // if the url is a path we want to preserve the query params that are available on
        // the current url.
        this.preventHashAssignPopState = true;
        window.location.hash = hash;

        // If popstate is enabled and the browser triggers `popstate` events when the hash
        // is set (this often happens immediately in browsers like Chrome), then the
        // this flag will be set to false already. If it's a browser that does not trigger
        // a `popstate` on hash assignement or `replaceState` then we need avoid the branch
        // that swallows the event created by the popstate generated by the hash assignment
        // At the time of this writing this happens with Opera 12 and some version of IE
        this.preventHashAssignPopState = false;

        state = $.extend({
          url: href,
          hash: hash,
          title: document.title
        }, data);

        if (isPopStateEvent) {
          popstateEvent = new $.Event("popstate");
          popstateEvent.originalEvent = {
            type: "popstate",
            state: null
          };

          this.squash(url, state);

          // Trigger a new faux popstate event to replace the one that we
          // caught that was triggered by the hash setting above.
          if (!noEvents) {
            this.ignorePopState = true;
            $win.trigger(popstateEvent);
          }
        }

        // record the history entry so that the information can be included
        // in hashchange event driven navigate events in a similar fashion to
        // the state that's provided by popstate
        this.history.add(state.url, state);
      },

      // This binding is intended to catch the popstate events that are fired
      // when execution of the `$.navigate` method stops at window.location.hash = url;
      // and completely prevent them from propagating. The popstate event will then be
      // retriggered after execution resumes
      //
      // TODO grab the original event here and use it for the synthetic event in the
      //      second half of the navigate execution that will follow this binding
      popstate: function (event) {
        var active, hash, state, closestIndex;

        // Partly to support our test suite which manually alters the support
        // value to test hashchange. Partly to prevent all around weirdness
        if (!$.event.special.navigate.isPushStateEnabled()) {
          return;
        }

        // If this is the popstate triggered by the actual alteration of the hash
        // prevent it completely. History is tracked manually
        if (this.preventHashAssignPopState) {
          this.preventHashAssignPopState = false;
          event.stopImmediatePropagation();
          return;
        }

        // if this is the popstate triggered after the `replaceState` call in the go
        // method, then simply ignore it. The history entry has already been captured
        if (this.ignorePopState) {
          this.ignorePopState = false;
          return;
        }

        // If there is no state, and the history stack length is one were
        // probably getting the page load popstate fired by browsers like chrome
        // avoid it and set the one time flag to false
        if (!event.originalEvent.state &&
          this.history.stack.length === 1 &&
          this.ignoreInitialHashChange) {
          this.ignoreInitialHashChange = false;

          return;
        }

        // account for direct manipulation of the hash. That is, we will receive a popstate
        // when the hash is changed by assignment, and it won't have a state associated. We
        // then need to squash the hash. See below for handling of hash assignment that
        // matches an existing history entry
        // TODO it might be better to only add to the history stack
        //      when the hash is adjacent to the active history entry
        hash = Path.parseLocation().hash;
        if (!event.originalEvent.state && hash) {
          // squash the hash that's been assigned on the URL with replaceState
          // also grab the resulting state object for storage
          state = this.squash(hash);

          // record the new hash as an additional history entry
          // to match the browser's treatment of hash assignment
          this.history.add(state.url, state);

          // pass the newly created state information
          // along with the event
          event.historyState = state;

          // do not alter history, we've added a new history entry
          // so we know where we are
          return;
        }

        // If all else fails this is a popstate that comes from the back or forward buttons
        // make sure to set the state of our history stack properly, and record the directionality
        this.history.direct({
          url: (event.originalEvent.state || {}).url || hash,

          // When the url is either forward or backward in history include the entry
          // as data on the event object for merging as data in the navigate event
          present: function (historyEntry, direction) {
            // make sure to create a new object to pass down as the navigate event data
            event.historyState = $.extend({}, historyEntry);
            event.historyState.direction = direction;
          }
        });
      },

      // NOTE must bind before `navigate` special event hashchange binding otherwise the
      //      navigation data won't be attached to the hashchange event in time for those
      //      bindings to attach it to the `navigate` special event
      // TODO add a check here that `hashchange.navigate` is bound already otherwise it's
      //      broken (exception?)
      hashchange: function (event) {
        var history, hash;

        // If hashchange listening is explicitly disabled or pushstate is supported
        // avoid making use of the hashchange handler.
        if (!$.event.special.navigate.isHashChangeEnabled() ||
          $.event.special.navigate.isPushStateEnabled()) {
          return;
        }

        // On occasion explicitly want to prevent the next hash from propogating because we only
        // with to alter the url to represent the new state do so here
        if (this.preventNextHashChange) {
          this.preventNextHashChange = false;
          event.stopImmediatePropagation();
          return;
        }

        history = this.history;
        hash = Path.parseLocation().hash;

        // If this is a hashchange caused by the back or forward button
        // make sure to set the state of our history stack properly
        this.history.direct({
          url: hash,

          // When the url is either forward or backward in history include the entry
          // as data on the event object for merging as data in the navigate event
          present: function (historyEntry, direction) {
            // make sure to create a new object to pass down as the navigate event data
            event.hashchangeState = $.extend({}, historyEntry);
            event.hashchangeState.direction = direction;
          },

          // When we don't find a hash in our history clearly we're aiming to go there
          // record the entry as new for future traversal
          //
          // NOTE it's not entirely clear that this is the right thing to do given that we
          //      can't know the users intention. It might be better to explicitly _not_
          //      support location.hash assignment in preference to $.navigate calls
          // TODO first arg to add should be the href, but it causes issues in identifying
          //      embeded pages
          missing: function () {
            history.add(hash, {
              hash: hash,
              title: document.title
            });
          }
        });
      }
    });
  })();

  (function (undefined) {
    // TODO consider queueing navigation activity until previous activities have completed
    //      so that end users don't have to think about it. Punting for now
    // TODO !! move the event bindings into callbacks on the navigate event
    navigate = function (url, data, noEvents) {
      navigate.navigator.go(url, data, noEvents);
    };

    // expose the history on the navigate method in anticipation of full integration with
    // existing navigation functionalty that is tightly coupled to the history information
    navigate.history = new History();

    // instantiate an instance of the navigator for use within the $.navigate method
    navigate.navigator = new Navigator(navigate.history);

    var loc = Path.parseLocation();
    navigate.history.add(loc.href, {hash: loc.hash});
  })();

  return navigate;
});
