define(function (require, exports, module) {

  var Detect = require('./detect'),
    support = Detect.support,
    prefix = Detect.prefix,
    isIphoneorTouch = (Detect.os.iPhone || Detect.os.iTouch),
    IScroll;

  /*!
   * iScroll v5.0.0 pre-alpha-use-it-and-kittens-die ~ Copyright (c) 2013 Matteo Spinelli, http://cubiq.org
   * Released under MIT license, http://cubiq.org/license
   */
  (function (window, document, Math) {
    var dummyStyle = document.createElement('div').style;

    var getTime = (function () {
      //IE9.0+ FF18+ Chrome24+ Android4.0+ window.performance
      return (window.performance && performance.now && performance.now.bind(performance)) ||
        Date.now ||
        function () {
          return new Date().getTime();
        };
    })();

    var rAF = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function (callback) {
        window.setTimeout(callback, 1000 / 60);
      };

    function prefixStyle(style) {
      if (prefix === false) return false;
      if (prefix === '') return style;
      return prefix + style.charAt(0).toUpperCase() + style.substr(1);
    }

    var TRANSFORM = prefixStyle('transform');
    var TRANSITION_TIMING_FUNCTION = prefixStyle('transitionTimingFunction');
    var TRANSITION_DURATION = prefixStyle('transitionDuration');

    var hasTransform = support.transform;
    var has3d = support.trans3d;
    var hasTouch = support.touch;
    var hasPointer = support.pointer;
    var hasTransition = support.transition;

    var TRANSLATE_Z = has3d ? ' translateZ(0)' : '';

    function addEvent(el, type, fn, capture) {
      el.addEventListener(type, fn, !!capture);
    }

    function removeEvent(el, type, fn, capture) {
      el.removeEventListener(type, fn, !!capture);
    }

    function getComputedPosition(el, useTransform) {
      var matrix = getComputedStyle(el, null),
        x, y;

      if (useTransform) {
        matrix = matrix[TRANSFORM].split(')')[0].split(', ');
        x = +(matrix[12] || matrix[4]);
        y = +(matrix[13] || matrix[5]);
      } else {
        x = +matrix.left.replace(/[^-\d]/g, '');
        y = +matrix.top.replace(/[^-\d]/g, '');
      }

      return { x: x, y: y };
    }

    function momentum(current, start, time, lowerMargin, maxOvershot) {
      var distance = current - start,
        speed = Math.abs(distance) / time,
        destination,
        duration,
        deceleration = 0.0009;

      destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 );
      duration = speed / deceleration;

      if (destination < lowerMargin) {
        destination = maxOvershot ? lowerMargin - ( maxOvershot / 2 * ( speed / 10 ) ) : lowerMargin;
        distance = Math.abs(destination - current);
        duration = distance / speed;
      } else if (destination > 0) {
        destination = maxOvershot ? maxOvershot / 2 * ( speed / 10 ) : 0;
        distance = Math.abs(current) + destination;
        duration = distance / speed;
      }

      return {
        destination: Math.round(destination),
        duration: duration
      };
    }

    IScroll = function (el, options) {
      this.wrapper = typeof el == 'string' ? document.querySelector(el) : el;
      this.scroller = this.wrapper.children[0];
      this.scrollerStyle = this.scroller.style;		// cache style for better performance

      this.options = {
        startX: 0,
        startY: 0,
        scrollX: true,
        scrollY: true,
        lockDirection: true,
        overshoot: true,
        momentum: true,
        //eventPassthrough: false,	TODO: preserve native vertical scroll on horizontal JS scroll (and vice versa)

        HWCompositing: true,		// set to false to skip the hardware compositing
        useTransition: true,
        useTransform: true,

        scrollbars: true,
        interactiveScrollbars: false,
        //hideScrollbars: true,		TODO: hide scrollbars when not scrolling
        //shrinkScrollbars: false,	TODO: shrink scrollbars when dragging over the limits
      };

      for (var i in options) {
        this.options[i] = options[i];
      }

      // Normalize options
      if (!this.options.HWCompositing) {
        TRANSLATE_Z = '';
      }

      this.options.useTransition = hasTransition && this.options.useTransition;
      this.options.useTransform = hasTransform && this.options.useTransform;

      // default easing
      if (this.options.useTransition) {
        this.scroller.style[TRANSITION_TIMING_FUNCTION] = 'cubic-bezier(0.33,0.66,0.66,1)';
      }

      this.refresh();
      this.scrollTo(this.options.startX, this.options.startY, 0);
      this.enabled = true;

      addEvent(window, 'orientationchange', this);
      addEvent(window, 'resize', this);

      if (hasTouch) {
        addEvent(this.wrapper, 'touchstart', this);
      } else if (hasPointer) {
        addEvent(this.wrapper, 'MSPointerDown', this);
      } else {
        addEvent(this.wrapper, 'mousedown', this);
      }

      addEvent(this.scroller, 'transitionend', this);
      addEvent(this.scroller, 'webkitTransitionEnd', this);
      addEvent(this.scroller, 'oTransitionEnd', this);
      addEvent(this.scroller, 'MSTransitionEnd', this);
    }

    IScroll.prototype.handleEvent = function (e) {
      switch (e.type) {
        case 'touchstart':
        case 'MSPointerDown':
        case 'mousedown':
          this._start(e);
          break;
        case 'touchmove':
        case 'MSPointerMove':
        case 'mousemove':
          this._move(e);
          break;
        case 'touchend':
        case 'MSPointerUp':
        case 'mouseup':
          this._end(e);
          break;
        case 'touchcancel':
        case 'MSPointerCancel':
        case 'mousecancel':
          this._end(e);
          break;
        case 'orientationchange':
        case 'resize':
          this._resize();
          break;
        case 'transitionend':
        case 'webkitTransitionEnd':
        case 'oTransitionEnd':
        case 'MSTransitionEnd':
          this._transitionEnd(e);
          break;
      }
    };

    IScroll.prototype._animate = function (destX, destY, duration) {
      var that = this,
        startX = this.x,
        startY = this.y,
        startTime = getTime(),
        destTime = startTime + duration;

      function step() {
        var now = getTime(),
          newX,
          newY,
          easing;

        if (now >= destTime) {
          this.isAnimating = false;
          that._translate(destX, destY);
          that.resetPosition(435);
          return;
        }

        now = ( now - startTime ) / duration - 1;
        easing = Math.sqrt(1 - now * now);
        newX = ( destX - startX ) * easing + startX;
        newY = ( destY - startY ) * easing + startY;
        that._translate(newX, newY);

        if (that.isAnimating) rAF(step);
      }

      this.isAnimating = true;
      step();
    };

    IScroll.prototype.destroy = function () {
      removeEvent(window, 'orientationchange', this);
      removeEvent(window, 'resize', this);

      if (hasTouch) {
        removeEvent(this.wrapper, 'touchstart', this);
        removeEvent(window, 'touchmove', this);
        removeEvent(window, 'touchcancel', this);
        removeEvent(window, 'touchend', this);
      } else if (hasPointer) {
        removeEvent(this.wrapper, 'MSPointerDown', this);
        removeEvent(window, 'MSPointerMove', this);
        removeEvent(window, 'MSPointerCancel', this);
        removeEvent(window, 'MSPointerUp', this);
      } else {
        removeEvent(this.wrapper, 'mousedown', this);
        removeEvent(window, 'mousemove', this);
        removeEvent(window, 'mousecancel', this);
        removeEvent(window, 'mouseup', this);
      }

      removeEvent(this.scroller, 'transitionend', this);
      removeEvent(this.scroller, 'webkitTransitionEnd', this);
      removeEvent(this.scroller, 'oTransitionEnd', this);
      removeEvent(this.scroller, 'MSTransitionEnd', this);
    }

    IScroll.prototype._translate = function (x, y) {
      if (this.options.useTransform) {
        this.scrollerStyle[TRANSFORM] = 'translate(' + x + 'px,' + y + 'px)' + TRANSLATE_Z;
      } else {
        x = Math.round(x);
        y = Math.round(y);
        this.scrollerStyle.left = x + 'px';
        this.scrollerStyle.top = y + 'px';
      }

      this.x = x;
      this.y = y;
    };

    IScroll.prototype._transitionEnd = function (e) {
      if (e.target != this.scroller) {
        return;
      }

      this._transitionTime(0);
      this.resetPosition(435);
    };

    IScroll.prototype._transitionTime = function (time) {
      time = time || 0;
      this.scrollerStyle[TRANSITION_DURATION] = time + 'ms';
    };

    IScroll.prototype._start = function (e) {
      //e.returnValue = false;
      if (!this.enabled) {
        return;
      }

      // stick with one event type (touches only or mouse only)
      if (this.initiated && e.type != this.initiated) {
        return;
      }

      var point = e.touches ? e.touches[0] : e,
        pos;

      this.initiated = e.type;
      this.moved = false;
      this.distX = 0;
      this.distY = 0;
      this.directionLocked = 0;

      this.refresh();
      this._transitionTime();

      this.isAnimating = false;

      if (this.options.momentum) {
        pos = getComputedPosition(this.scroller, this.options.useTransform);

        if (pos.x != this.x || pos.y != this.y) {
          this._translate(pos.x, pos.y);
        }
      }

      this.startX = this.x;
      this.startY = this.y;
      this.pointX = point.pageX;
      this.pointY = point.pageY;

      this.startTime = getTime();

      if (hasTouch) {
        addEvent(window, 'touchmove', this);
        addEvent(window, 'touchcancel', this);
        addEvent(window, 'touchend', this);
      } else if (hasPointer) {
        addEvent(window, 'MSPointerMove', this);
        addEvent(window, 'MSPointerCancel', this);
        addEvent(window, 'MSPointerUp', this);
      } else {
        addEvent(window, 'mousemove', this);
        addEvent(window, 'mousecancel', this);
        addEvent(window, 'mouseup', this);
      }
    };

    IScroll.prototype._move = function (e) {
      if (!this.enabled || !this.initiated) {
        return;
      }

      var point = e.touches ? e.touches[0] : e,
        deltaX = this.hasHorizontalScroll ? point.pageX - this.pointX : 0,
        deltaY = this.hasVerticalScroll ? point.pageY - this.pointY : 0,
        timestamp = getTime(),
        newX, newY,
        absDistX, absDistY;

      this.pointX = point.pageX;
      this.pointY = point.pageY;

      this.distX += deltaX;
      this.distY += deltaY;
      absDistX = Math.abs(this.distX);
      absDistY = Math.abs(this.distY);

      // We need to move at least 10 pixels for the scrolling to initiate
      if (absDistX < 10 && absDistY < 10) {
        return;
      }

      // If you are scrolling in one direction lock the other
      if (!this.directionLocked && this.options.lockDirection) {
        if (absDistX > absDistY + 5) {
          this.directionLocked = 'h';		// lock horizontally
        } else if (absDistY > absDistX + 5) {
          this.directionLocked = 'v';		// lock vertically
        } else {
          this.directionLocked = 'n';		// no lock
        }
      }

      if (this.directionLocked == 'h') {
        deltaY = 0;
      } else if (this.directionLocked == 'v') {
        deltaX = 0;
      }

      newX = this.x + deltaX;
      newY = this.y + deltaY;

      // Slow down if outside of the boundaries
      if (newX > 0 || newX < this.maxScrollX) {
        newX = this.options.overshoot ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
      }
      if (newY > 0 || newY < this.maxScrollY) {
        newY = this.options.overshoot ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
      }

      this.moved = true;

      if (timestamp - this.startTime > 300) {
        this.startTime = timestamp;
        this.startX = this.x;
        this.startY = this.y;
      }

      this._translate(newX, newY);
    };

    IScroll.prototype._end = function (e) {
      if (!this.enabled || !this.initiated) {
        return;
      }

      if (hasTouch) {
        removeEvent(window, 'touchmove', this);
        removeEvent(window, 'touchcancel', this);
        removeEvent(window, 'touchend', this);
      } else if (hasPointer) {
        removeEvent(window, 'MSPointerMove', this);
        removeEvent(window, 'MSPointerCancel', this);
        removeEvent(window, 'MSPointerUp', this);
      } else {
        removeEvent(window, 'mousemove', this);
        removeEvent(window, 'mousecancel', this);
        removeEvent(window, 'mouseup', this);
      }

      var point = e.changedTouches ? e.changedTouches[0] : e,
        momentumX,
        momentumY,
        duration = getTime() - this.startTime,
        newX = Math.round(this.x),
        newY = Math.round(this.y),
        time,
        snap,
        lastScale;

      this.initiated = false;
      if (this.resetPosition(300)) {
        return;
      }

      // we scrolled less than 10 pixels
      if (!this.moved) {
        return;
      }

      // start momentum animation if needed
      if (this.options.momentum && duration < 300) {
        momentumX = this.hasHorizontalScroll ? momentum(this.x, this.startX, duration, this.maxScrollX, this.options.overshoot ? this.wrapperWidth : 0) : { destination: newX, duration: 0 };
        momentumY = this.hasVerticalScroll ? momentum(this.y, this.startY, duration, this.maxScrollY, this.options.overshoot ? this.wrapperHeight : 0) : { destination: newY, duration: 0 };
        newX = momentumX.destination;
        newY = momentumY.destination;
        time = Math.max(momentumX.duration, momentumY.duration);
      }

      if (newX != this.x || newY != this.y) {
        this.scrollTo(newX, newY, time);
      }
    };

    IScroll.prototype.resetPosition = function (time) {
      if (this.x <= 0 && this.x >= this.maxScrollX && this.y <= 0 && this.y >= this.maxScrollY) {
        return false;
      }

      var x = this.x,
        y = this.y;

      time = time || 0;

      if (!this.hasHorizontalScroll || this.x > 0) {
        x = 0;
      } else if (this.x < this.maxScrollX) {
        x = this.maxScrollX;
      }

      if (!this.hasVerticalScroll || this.y > 0) {
        y = 0;
      } else if (this.y < this.maxScrollY) {
        y = this.maxScrollY;
      }

      this.scrollTo(x, y, time);

      return true;
    };

    IScroll.prototype.disable = function () {
      this.enabled = false;
    };

    IScroll.prototype.enable = function () {
      this.enabled = true;
    };

    IScroll.prototype.refresh = function () {
      this.wrapper.offsetHeight;	// Force refresh (linters hate this)

      this.wrapperWidth = this.wrapper.clientWidth;
      this.wrapperHeight = this.wrapper.clientHeight;

      this.scrollerWidth = Math.round(this.scroller.offsetWidth);
      this.scrollerHeight = Math.round(this.scroller.offsetHeight);

      this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
      this.maxScrollY = this.wrapperHeight - this.scrollerHeight;

      this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0;
      this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0;
    };

    IScroll.prototype._resize = function () {
      this.refresh();
      this.resetPosition();
    };

    IScroll.prototype.scrollBy = function (x, y, time) {
      x = this.x + x;
      y = this.y + y;
      time = time || 0;

      this.scrollTo(x, y, time);
    };

    IScroll.prototype.scrollTo = function (x, y, time) {
      if (!time || this.options.useTransition) {
        this._transitionTime(time);
        this._translate(x, y);
      } else {
        this._animate(x, y, time);
      }
    };

  })(window, document, Math);
  return IScroll;
});