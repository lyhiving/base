/*!
 * iScroll v5.0.0 pre-alpha-use-it-and-kittens-die ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
 * Released under MIT license, http://cubiq.org/license
 */
define("handy/iscroll/1.0.0/iscroll-debug", [ "$-debug" ], function(require, exports, module) {
    var $ = require("$-debug"), support = $.support;
    var IScroll = function(el, options) {
        var utils = IScroll.utils;
        this.wrapper = $(el).get(0);
        this.enabled = true;
        utils.addEvent(window, "orientationchange", this);
        utils.addEvent(window, "resize", this);
        utils.addEvent(this.wrapper, utils.events.START, this);
        this.reset(options);
    };
    IScroll.utils = function() {
        //var _dummyStyle = document.createElement('div').style;
        var getTime = Date.now;
        //|| function () { return new Date().getTime(); };
        //var rAF = window.requestAnimationFrame  ||
        //  window.webkitRequestAnimationFrame  ||
        //  window.mozRequestAnimationFrame   ||
        //  window.oRequestAnimationFrame   ||
        //  window.msRequestAnimationFrame    ||
        //  function (callback) { window.setTimeout(callback, 1000 / 60); };
        //var _vendor = (function () {
        //  var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
        //    transform,
        //    i = 0,
        //    l = vendors.length;
        //
        //  for ( ; i < l; i++ ) {
        //    transform = vendors[i] + 'ransform';
        //    if ( transform in _dummyStyle ) return vendors[i].substr(0, vendors[i].length-1);
        //  }
        //
        //  return false;
        //})();
        var vendor = support.vendor;
        function _prefixStyle(style) {
            if (vendor === "") return style.toLowerCase();
            return vendor + style;
        }
        function addEvent(el, type, fn, capture) {
            el.addEventListener(type, fn, !!capture);
        }
        function removeEvent(el, type, fn, capture) {
            el.removeEventListener(type, fn, !!capture);
        }
        function getComputedPosition(el, useTransform) {
            var matrix = getComputedStyle(el, null), x, y;
            //if ( useTransform ) {
            matrix = matrix[style.transform].split(")")[0].split(", ");
            x = +(matrix[12] || matrix[4]);
            y = +(matrix[13] || matrix[5]);
            //} else {
            //  x = +matrix.left.replace(/[^-\d]/g, '');
            //  y = +matrix.top.replace(/[^-\d]/g, '');
            //}
            return {
                x: x,
                y: y
            };
        }
        function momentum(current, start, time, lowerMargin, maxOvershot) {
            var distance = current - start, speed = Math.abs(distance) / time, destination, duration, deceleration = 9e-4;
            destination = current + speed * speed / (2 * deceleration) * (distance < 0 ? -1 : 1);
            duration = speed / deceleration;
            if (destination < lowerMargin) {
                destination = maxOvershot ? lowerMargin - maxOvershot / 2 * (speed / 10) : lowerMargin;
                distance = Math.abs(destination - current);
                duration = distance / speed;
            } else if (destination > 0) {
                destination = maxOvershot ? maxOvershot / 2 * (speed / 10) : 0;
                distance = Math.abs(current) + destination;
                duration = distance / speed;
            }
            return {
                destination: Math.round(destination),
                duration: duration
            };
        }
        var _transform = _prefixStyle("Transform");
        var has = {
            transform: support.transform,
            trans3d: support.trans3d,
            touch: support.touch,
            pointer: support.pointer,
            transition: support.transition
        };
        var style = {
            transform: _transform,
            transitionTimingFunction: _prefixStyle("TransitionTimingFunction"),
            transitionDuration: _prefixStyle("TransitionDuration"),
            translateZ: has.trans3d ? " translateZ(0)" : ""
        };
        var options = {
            startX: 0,
            startY: 0,
            scrollX: true,
            scrollY: true,
            lockDirection: true,
            overshoot: true,
            momentum: true,
            //eventPassthrough: false,	TODO: preserve native vertical scroll on horizontal JS scroll (and vice versa)
            HWCompositing: true,
            // set to false to skip the hardware compositing
            useTransition: true,
            useTransform: true
        };
        var events = {};
        if (has.touch) {
            events = {
                START: "touchstart",
                MOVE: "touchmove",
                END: "touchend",
                CANCEL: "touchcancel"
            };
        } else if (has.pointer) {
            events = {
                START: "MSPointerDown",
                MOVE: "MSPointerMove",
                END: "MSPointerUp",
                CANCEL: "MSPointerCancel"
            };
        } else {
            events = {
                START: "mousedown",
                MOVE: "mousemove",
                END: "mouseup",
                CANCEL: "mousecancel"
            };
        }
        events.TRANSITIONEND = function() {
            switch (vendor) {
              case "webkit":
                return "webkitTransitionEnd";

              case "O":
                return "oTransitionEnd";

              default:
                return "transitionend";
            }
        }();
        return {
            events: events,
            options: options,
            getTime: getTime,
            //rAF: rAF,
            has: has,
            style: style,
            addEvent: addEvent,
            removeEvent: removeEvent,
            getComputedPosition: getComputedPosition,
            momentum: momentum
        };
    }();
    IScroll.prototype.handleEvent = function(e) {
        var events = IScroll.utils.events;
        switch (e.type) {
          case events.START:
            this._start(e);
            break;

          case events.MOVE:
            this._move(e);
            break;

          case events.END:
          case events.CANCEL:
            this._end(e);
            break;

          case "orientationchange":
          case "resize":
            this._resize();
            break;

          case events.TRANSITIONEND:
            this._transitionEnd(e);
            break;
        }
    };
    IScroll.prototype.reset = function(options) {
        var utils = IScroll.utils, events = utils.events;
        if (this.scroller) {
            utils.removeEvent(this.scroller, events.TRANSITIONEND, this);
        }
        this.options = $.extend({}, utils.options, options);
        this.scroller = $(this.options.scroller, this.wrapper).get(0);
        this.scrollerStyle = this.scroller.style;
        // cache style for better performance
        // Normalize options
        if (!this.options.HWCompositing) {
            utils.style.translateZ = "";
        }
        // default easing
        if (support.transition) {
            this.scrollerStyle[utils.style.transitionTimingFunction] = "cubic-bezier(0.33,0.66,0.66,1)";
        }
        this.refresh();
        this.scrollTo(this.options.startX, this.options.startY, 0);
        utils.addEvent(this.scroller, events.TRANSITIONEND, this);
    };
    IScroll.prototype.refresh = function() {
        // Force refresh (fake assignment to x for linters)
        var x = this.wrapper.offsetHeight;
        this.wrapperWidth = this.wrapper.clientWidth;
        this.wrapperHeight = this.wrapper.clientHeight;
        this.scrollerWidth = Math.round(this.scroller.offsetWidth);
        this.scrollerHeight = Math.round(this.scroller.offsetHeight);
        this.maxScrollX = this.wrapperWidth - this.scrollerWidth;
        this.maxScrollY = this.wrapperHeight - this.scrollerHeight;
        this.hasHorizontalScroll = this.options.scrollX && this.maxScrollX < 0;
        this.hasVerticalScroll = this.options.scrollY && this.maxScrollY < 0;
    };
    IScroll.prototype.resetPosition = function(time) {
        if (this.x <= 0 && this.x >= this.maxScrollX && this.y <= 0 && this.y >= this.maxScrollY) {
            return false;
        }
        var x = this.x, y = this.y;
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
    IScroll.prototype.scrollBy = function(x, y, time) {
        x = this.x + x;
        y = this.y + y;
        time = time || 0;
        this.scrollTo(x, y, time);
    };
    IScroll.prototype.scrollTo = function(x, y, time) {
        //	if ( !time || this.options.useTransition ) {
        this._transitionTime(time);
        this._translate(x, y);
    };
    // IScroll.prototype.delete = function () {
    IScroll.prototype.destory = function() {
        var utils = IScroll.utils, events = utils.events;
        utils.removeEvent(window, "orientationchange", this);
        utils.removeEvent(window, "resize", this);
        utils.removeEvent(this.wrapper, events.START, this);
        utils.removeEvent(window, events.MOVE, this);
        utils.removeEvent(window, events.END, this);
        utils.removeEvent(window, events.CANCEL, this);
        utils.removeEvent(this.scroller, events.TRANSITIONEND, this);
    };
    IScroll.prototype.enable = function() {
        this.enabled = true;
    };
    IScroll.prototype.disable = function() {
        this.enabled = false;
    };
    IScroll.prototype._resize = function() {
        this.refresh();
        this.resetPosition();
    };
    IScroll.prototype._start = function(e) {
        //e.returnValue = false;
        if (!this.enabled) {
            return;
        }
        // stick with one event type (touches only or mouse only)
        if (this.initiated && e.type != this.initiated) {
            return;
        }
        var utils = IScroll.utils, events = utils.events, point = e.touches ? e.touches[0] : e, pos;
        this.initiated = e.type;
        this.moved = false;
        this.distX = 0;
        this.distY = 0;
        this.directionLocked = 0;
        this._transitionTime();
        this.isAnimating = false;
        if (this.options.momentum) {
            pos = IScroll.utils.getComputedPosition(this.scroller, this.options.useTransform);
            if (pos.x != this.x || pos.y != this.y) {
                this._translate(pos.x, pos.y);
            }
        }
        this.startX = this.x;
        this.startY = this.y;
        this.pointX = point.pageX;
        this.pointY = point.pageY;
        this.startTime = utils.getTime();
        utils.addEvent(window, events.MOVE, this);
        utils.addEvent(window, events.END, this);
        utils.addEvent(window, events.CANCEL, this);
    };
    IScroll.prototype._move = function(e) {
        if (!this.enabled || !this.initiated) {
            return;
        }
        var point = e.touches ? e.touches[0] : e, deltaX = this.hasHorizontalScroll ? point.pageX - this.pointX : 0, deltaY = this.hasVerticalScroll ? point.pageY - this.pointY : 0, timestamp = IScroll.utils.getTime(), newX, newY, absDistX, absDistY;
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
                this.directionLocked = "h";
            } else if (absDistY > absDistX + 5) {
                this.directionLocked = "v";
            } else {
                this.directionLocked = "n";
            }
        }
        if (this.directionLocked == "h") {
            deltaY = 0;
        } else if (this.directionLocked == "v") {
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
    IScroll.prototype._end = function(e) {
        if (!this.enabled || !this.initiated) {
            return;
        }
        var utils = IScroll.utils, events = utils.events, point = e.changedTouches ? e.changedTouches[0] : e, momentumX, momentumY, duration = utils.getTime() - this.startTime, newX = Math.round(this.x), newY = Math.round(this.y), time;
        this.initiated = false;
        utils.removeEvent(window, events.MOVE, this);
        utils.removeEvent(window, events.END, this);
        utils.removeEvent(window, events.CANCEL, this);
        // reset if we are outside of the boundaries
        if (this.resetPosition(300)) {
            return;
        }
        // we scrolled less than 10 pixels
        if (!this.moved) {
            return;
        }
        // start momentum animation if needed
        if (this.options.momentum && duration < 300) {
            momentumX = this.hasHorizontalScroll ? IScroll.utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.overshoot ? this.wrapperWidth : 0) : {
                destination: newX,
                duration: 0
            };
            momentumY = this.hasVerticalScroll ? IScroll.utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.overshoot ? this.wrapperHeight : 0) : {
                destination: newY,
                duration: 0
            };
            newX = momentumX.destination;
            newY = momentumY.destination;
            time = Math.max(momentumX.duration, momentumY.duration);
        }
        if (newX != this.x || newY != this.y) {
            this.scrollTo(newX, newY, time);
        }
    };
    IScroll.prototype._translate = function(x, y) {
        //	if ( this.options.useTransform ) {
        this.scrollerStyle[IScroll.utils.style.transform] = "translate(" + x + "px," + y + "px)" + IScroll.utils.style.translateZ;
        //	} else {
        //		x = Math.round(x);
        //		y = Math.round(y);
        //		this.scrollerStyle.left = x + 'px';
        //		this.scrollerStyle.top = y + 'px';
        //	}
        this.x = x;
        this.y = y;
    };
    IScroll.prototype._transitionEnd = function(e) {
        if (e.target != this.scroller) {
            return;
        }
        this._transitionTime(0);
        this.resetPosition(435);
    };
    IScroll.prototype._transitionTime = function(time) {
        time = time || 0;
        this.scrollerStyle[IScroll.utils.style.transitionDuration] = time + "ms";
    };
    return IScroll;
});