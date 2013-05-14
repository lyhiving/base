define(function (require, exports, module) {
  var $ = require('$');
  var $base = $("head").find("base")

  var Path = {
    // This scary looking regular expression parses an absolute URL or its relative
    // variants (protocol, site, document, query, and hash), into the various
    // components (protocol, host, path, query, fragment, etc that make up the
    // URL as well as some other commonly used sub-parts. When used with RegExp.exec()
    // or String.match, it parses the URL into a results array that looks like this:
    //
    //     [0]: http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content
    //     [1]: http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread
    //     [2]: http://jblas:password@mycompany.com:8080/mail/inbox
    //     [3]: http://jblas:password@mycompany.com:8080
    //     [4]: http:
    //     [5]: //
    //     [6]: jblas:password@mycompany.com:8080
    //     [7]: jblas:password
    //     [8]: jblas
    //     [9]: password
    //    [10]: mycompany.com:8080
    //    [11]: mycompany.com
    //    [12]: 8080
    //    [13]: /mail/inbox
    //    [14]: /mail/
    //    [15]: inbox
    //    [16]: ?msg=1234&type=unread
    //    [17]: #msg-content
    //
    urlParseRE: /^\s*(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/,

    // Abstraction to address xss (Issue #4787) by removing the authority in
    // browsers that auto	decode it. All references to location.href should be
    // replaced with a call to this method so that it can be dealt with properly here
    getLocation: function (url) {
      var uri = url ? this.parseUrl(url) : location,
        hash = this.parseUrl(url || location.href).hash;

      // mimic the browser with an empty string when the hash is empty
      hash = hash === "#" ? "" : hash;

      // Make sure to parse the url or the location object for the hash because using location.hash
      // is autodecoded in firefox, the rest of the url should be from the object (location unless
      // we're testing) to avoid the inclusion of the authority
      return uri.protocol + "//" + uri.host + uri.pathname + uri.search + hash;
    },

    parseLocation: function () {
      return this.parseUrl(this.getLocation());
    },

    //Parse a URL into a structure that allows easy access to
    //all of the URL components by name.
    parseUrl: function (url) {
      // If we're passed an object, we'll assume that it is
      // a parsed url object and just return it back to the caller.
      if ($.type(url) === "object") {
        return url;
      }

      var matches = Path.urlParseRE.exec(url || "") || [];

      // Create an object that allows the caller to access the sub-matches
      // by name. Note that IE returns an empty string instead of undefined,
      // like all other browsers do, so we normalize everything so its consistent
      // no matter what browser we're running on.
      return {
        href: matches[  0 ] || "",
        hrefNoHash: matches[  1 ] || "",
        hrefNoSearch: matches[  2 ] || "",
        domain: matches[  3 ] || "",
        protocol: matches[  4 ] || "",
        doubleSlash: matches[  5 ] || "",
        authority: matches[  6 ] || "",
        username: matches[  8 ] || "",
        password: matches[  9 ] || "",
        host: matches[ 10 ] || "",
        hostname: matches[ 11 ] || "",
        port: matches[ 12 ] || "",
        pathname: matches[ 13 ] || "",
        directory: matches[ 14 ] || "",
        filename: matches[ 15 ] || "",
        search: matches[ 16 ] || "",
        hash: matches[ 17 ] || ""
      };
    },

    //Turn relPath into an asbolute path. absPath is
    //an optional absolute path which describes what
    //relPath is relative to.
    makePathAbsolute: function (relPath, absPath) {
      if (relPath && relPath.charAt(0) === "/") {
        return relPath;
      }

      relPath = relPath || "";
      absPath = absPath ? absPath.replace(/^\/|(\/[^\/]*|[^\/]+)$/g, "") : "";

      var absStack = absPath ? absPath.split("/") : [],
        relStack = relPath.split("/");
      for (var i = 0; i < relStack.length; i++) {
        var d = relStack[ i ];
        switch (d) {
          case ".":
            break;
          case "..":
            if (absStack.length) {
              absStack.pop();
            }
            break;
          default:
            absStack.push(d);
            break;
        }
      }
      return "/" + absStack.join("/");
    },

    //Returns true if both urls have the same domain.
    isSameDomain: function (absUrl1, absUrl2) {
      return Path.parseUrl(absUrl1).domain === Path.parseUrl(absUrl2).domain;
    },

    //Returns true for any relative variant.
    isRelativeUrl: function (url) {
      // All relative Url variants have one thing in common, no protocol.
      return Path.parseUrl(url).protocol === "";
    },

    //Returns true for an absolute url.
    isAbsoluteUrl: function (url) {
      return Path.parseUrl(url).protocol !== "";
    },

    //Turn the specified realtive URL into an absolute one. This function
    //can handle all relative variants (protocol, site, document, query, fragment).
    makeUrlAbsolute: function (relUrl, absUrl) {
      if (!Path.isRelativeUrl(relUrl)) {
        return relUrl;
      }

      if (absUrl === undefined) {
        absUrl = this.documentBase;
      }

      var relObj = Path.parseUrl(relUrl),
        absObj = Path.parseUrl(absUrl),
        protocol = relObj.protocol || absObj.protocol,
        doubleSlash = relObj.protocol ? relObj.doubleSlash : ( relObj.doubleSlash || absObj.doubleSlash ),
        authority = relObj.authority || absObj.authority,
        hasPath = relObj.pathname !== "",
        pathname = Path.makePathAbsolute(relObj.pathname || absObj.filename, absObj.pathname),
        search = relObj.search || ( !hasPath && absObj.search ) || "",
        hash = relObj.hash;

      return protocol + doubleSlash + authority + pathname + search + hash;
    },

    //Add search (aka query) params to the specified url.
    addSearchParams: function (url, params) {
      var u = Path.parseUrl(url),
        p = ( typeof params === "object" ) ? $.param(params) : params,
        s = u.search || "?";
      return u.hrefNoSearch + s + ( s.charAt(s.length - 1) !== "?" ? "&" : "" ) + p + ( u.hash || "" );
    },

    //get path from current hash, or from a file path
    get: function (newPath) {
      if (newPath === undefined) {
        newPath = Path.parseLocation().hash;
      }
      return Path.stripHash(newPath).replace(/[^\/]*\.[^\/*]+$/, '');
    },

    //set location hash to path
    set: function (Path) {
      location.hash = Path;
    },

    //test if a given url (string) is a path
    //NOTE might be exceptionally naive
    isPath: function (url) {
      return ( /\// ).test(url);
    },

    //return a url path with the window's location protocol/hostname/pathname removed
    clean: function (url) {
      return url.replace(this.documentBase.domain, "");
    },

    //just return the url without an initial #
    stripHash: function (url) {
      return url.replace(/^#/, "");
    },

    stripQueryParams: function (url) {
      return url.replace(/\?.*$/, "");
    },

    //remove the preceding hash, any query params, and dialog notations
    cleanHash: function (hash) {
      return Path.stripHash(hash.replace(/\?.*$/, "")/*.replace(dialogHashKey, "")*/);
    },

    isHashValid: function (hash) {
      return ( /^#[^#]+$/ ).test(hash);
    },

    //check whether a url is referencing the same domain, or an external domain or different protocol
    //could be mailto, etc
    isExternal: function (url) {
      var u = Path.parseUrl(url);
      return u.protocol && u.domain !== this.documentUrl.domain ? true : false;
    },

    hasProtocol: function (url) {
      return ( /^(:?\w+:)/ ).test(url);
    },

    squash: function (url, resolutionUrl) {
      var state, href, cleanedUrl, search/*, stateIndex*/,
        isPath = this.isPath(url),
        uri = this.parseUrl(url),
        preservedHash = uri.hash;
      //uiState = "";

      // produce a url against which we can resole the provided path
      resolutionUrl = resolutionUrl || (Path.isPath(url) ? Path.getLocation() : Path.getDocumentUrl());

      // If the url is anything but a simple string, remove any preceding hash
      // eg #foo/bar -> foo/bar
      //    #foo -> #foo
      cleanedUrl = isPath ? Path.stripHash(url) : url;

      // If the url is a full url with a hash check if the parsed hash is a path
      // if it is, strip the #, and use it otherwise continue without change
      cleanedUrl = Path.isPath(uri.hash) ? Path.stripHash(uri.hash) : cleanedUrl;

      // make the cleanedUrl absolute relative to the resolution url
      href = Path.makeUrlAbsolute(cleanedUrl, resolutionUrl);

      // grab the search from the resolved url since parsing from
      // the passed url may not yield the correct result
      search = this.parseUrl(href).search;

      // TODO all this crap is terrible, clean it up
      if (isPath) {
        // reject the hash if it's a path or it's just a dialog key
        if (Path.isPath(preservedHash)/* || preservedHash.replace("#", "").indexOf(this.uiStateKey) === 0*/) {
          preservedHash = "";
        }

        // make sure that pound is on the front of the hash
        if (preservedHash.indexOf("#") === -1 && preservedHash !== "") {
          preservedHash = "#" + preservedHash;
        }

        // reconstruct each of the pieces with the new search string and hash
        href = Path.parseUrl(href);
        href = href.protocol + "//" + href.host + href.pathname + search + preservedHash;
      }

      return href;
    }
  };

  Path.documentUrl = Path.parseLocation();

  Path.documentBase = $base.length ?
    Path.parseUrl(Path.makeUrlAbsolute($base.attr("href"), Path.documentUrl.href)) :
    Path.documentUrl;

  Path.documentBaseDiffers = (Path.documentUrl.hrefNoHash !== Path.documentBase.hrefNoHash);

  //return the original document url
  Path.getDocumentUrl = function (asParsedObject) {
    return asParsedObject ? $.extend({}, Path.documentUrl) : Path.documentUrl.href;
  };

  //return the original document base url
  Path.getDocumentBase = function (asParsedObject) {
    return asParsedObject ? $.extend({}, Path.documentBase) : Path.documentBase.href;
  };

  return Path;
});