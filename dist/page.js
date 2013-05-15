define("handy/base/1.1.0/page",["$","arale/base/1.0.1/base","arale/class/1.0.0/class","arale/events/1.0.0/events","./path","./navigation","./history"],function(t){var e,a=t("$"),r=t("arale/base/1.0.1/base"),n=t("./path"),s=t("./navigation"),o=a(window),i=r.extend({init:function(){this._initPages(),this._initEvents()},_initPages:function(){var t=this.pages=[];a.each(a(".page"),function(e,r){if(0===e)t.push({url:n.parseUrl(n.documentUrl.hrefNoHash),dom:a(r)});else{var s=a(r).data("url");s&&t.push({url:n.parseUrl(n.makeUrlAbsolute(s)),dom:a(r)})}}),this.activePage=this.pages[0]},_initEvents:function(){var t=this;o.on("navigate",function(e,a){var r=a.state,s=n.parseUrl(n.squash(location.href));s.hrefNoHash,"forward"===r.direction?t.forward(s):t.backward(s)}),a(document).on("touchend","[data-transition]",function(e){e.preventDefault(),t.forward(this.href)}).on("click","[data-transition]",!1),a(document).on("touchend","[data-rel=back]",function(t){t.preventDefault(),window.history.back()}).on("click","[data-transition]",!1),o.trigger("hashchange")},forward:function(t,e,r){if(t){var s,o="object"===a.type(t)?t:n.parseUrl(n.squash(n.makeUrlAbsolute(t)));0>(s=this._getIndexByUrl(o))?this._createPage({url:o,data:e,post:r}):this.transition(this.pages[s])}},backward:function(t,e,r){if(t){var s,o="object"===a.type(t)?t:n.parseUrl(n.squash(n.makeUrlAbsolute(t)));0>(s=this._getIndexByUrl(o))?this._createPage({url:o,data:e,post:r},!0):this.transition(this.pages[s],!0)}else window.history.back()},transition:function(t,e){if(t!==this.activePage){var r=this,n=t.url,o=t.dom,i=this.activePage,h=i.dom,c=i.url;r.trigger("transiting"),o.css("display","block");var u=o.css("transform").split(")")[0].split(", "),l=0,f=h.css("transform").split(")")[0].split(", "),d=0;"none"!=u&&(l=+(u[13]||u[5])),"none"!=f&&(d=+(f[13]||f[5])),o.css("transform","translate("+(e?"-":"")+"100%,"+l+"px)"),o.animate({translate:"0,"+l+"px"},{duration:250,complete:function(){r.activePage=t,a(this).css("transform",""),r.trigger("transition",t)}}),h.animate({translate:(e?"":"-")+"100%,"+d+"px"},{duration:250,complete:function(){h.data("cache")===!1?(r.pages.splice(r._getIndexByUrl(c),1),a(this).remove()):a(this).hide().css("transform","")}}),s.go(n,e)}},_getIndexByUrl:function(t){for(var e=this.pages,a=0,r=e.length;r>a;a++)if(t.hrefNoHash===e[a].url.hrefNoHash)return a;return-1},_createPage:function(t,e){this.trigger("loading"),a.ajax(t.url.href,{type:t.post?"post":"get",data:t.data,context:this,success:function(r){var n,s,o,i,h=a("<div></div>"),c=this.pages;n=r.match(/<title[^>]*>([^<]*)/)&&RegExp.$1,s=r.match(/<body[^>]*>([\s\S]*)<\/body>/gim)&&RegExp.$1,h.get(0).innerHTML=s,o=h.find("[data-role=page]").eq(0),t.post&&o.data("cache",!1),this.activePage.dom.after(o.hide()),i={url:t.url,dom:o},this.trigger("load",i),e?(c.unshift(i),this.transition(i,!0)):(c.push(i),this.transition(i))},error:function(){this.trigger("error",t)}})}});return e=new i}),define("handy/base/1.1.0/path",["$"],function(t){var e=t("$"),a=e("head").find("base"),r={urlParseRE:/^\s*(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/,getLocation:function(t){var e=t?this.parseUrl(t):location,a=this.parseUrl(t||location.href).hash;return a="#"===a?"":a,e.protocol+"//"+e.host+e.pathname+e.search+a},parseLocation:function(){return this.parseUrl(this.getLocation())},parseUrl:function(t){if("object"===e.type(t))return t;var a=r.urlParseRE.exec(t||"")||[];return{href:a[0]||"",hrefNoHash:a[1]||"",hrefNoSearch:a[2]||"",domain:a[3]||"",protocol:a[4]||"",doubleSlash:a[5]||"",authority:a[6]||"",username:a[8]||"",password:a[9]||"",host:a[10]||"",hostname:a[11]||"",port:a[12]||"",pathname:a[13]||"",directory:a[14]||"",filename:a[15]||"",search:a[16]||"",hash:a[17]||""}},makePathAbsolute:function(t,e){if(t&&"/"===t.charAt(0))return t;t=t||"",e=e?e.replace(/^\/|(\/[^\/]*|[^\/]+)$/g,""):"";for(var a=e?e.split("/"):[],r=t.split("/"),n=0;r.length>n;n++){var s=r[n];switch(s){case".":break;case"..":a.length&&a.pop();break;default:a.push(s)}}return"/"+a.join("/")},isSameDomain:function(t,e){return r.parseUrl(t).domain===r.parseUrl(e).domain},isRelativeUrl:function(t){return""===r.parseUrl(t).protocol},isAbsoluteUrl:function(t){return""!==r.parseUrl(t).protocol},makeUrlAbsolute:function(t,e){if(!r.isRelativeUrl(t))return t;void 0===e&&(e=this.documentBase);var a=r.parseUrl(t),n=r.parseUrl(e),s=a.protocol||n.protocol,o=a.protocol?a.doubleSlash:a.doubleSlash||n.doubleSlash,i=a.authority||n.authority,h=""!==a.pathname,c=r.makePathAbsolute(a.pathname||n.filename,n.pathname),u=a.search||!h&&n.search||"",l=a.hash;return s+o+i+c+u+l},addSearchParams:function(t,a){var n=r.parseUrl(t),s="object"==typeof a?e.param(a):a,o=n.search||"?";return n.hrefNoSearch+o+("?"!==o.charAt(o.length-1)?"&":"")+s+(n.hash||"")},get:function(t){return void 0===t&&(t=r.parseLocation().hash),r.stripHash(t).replace(/[^\/]*\.[^\/*]+$/,"")},set:function(t){location.hash=t},isPath:function(t){return/\//.test(t)},clean:function(t){return t.replace(this.documentBase.domain,"")},stripHash:function(t){return t.replace(/^#/,"")},stripQueryParams:function(t){return t.replace(/\?.*$/,"")},cleanHash:function(t){return r.stripHash(t.replace(/\?.*$/,""))},isHashValid:function(t){return/^#[^#]+$/.test(t)},isExternal:function(t){var e=r.parseUrl(t);return e.protocol&&e.domain!==this.documentUrl.domain?!0:!1},hasProtocol:function(t){return/^(:?\w+:)/.test(t)},squash:function(t,e){var a,n,s,o=this.isPath(t),i=this.parseUrl(t),h=i.hash;return e=e||(r.isPath(t)?r.getLocation():r.getDocumentUrl()),n=o?r.stripHash(t):t,n=r.isPath(i.hash)?r.stripHash(i.hash):n,a=r.makeUrlAbsolute(n,e),s=this.parseUrl(a).search,o&&(r.isPath(h)&&(h=""),-1===h.indexOf("#")&&""!==h&&(h="#"+h),a=r.parseUrl(a),a=a.protocol+"//"+a.host+a.pathname+s+h),a}};return r.documentUrl=r.parseLocation(),r.documentBase=a.length?r.parseUrl(r.makeUrlAbsolute(a.attr("href"),r.documentUrl.href)):r.documentUrl,r.documentBaseDiffers=r.documentUrl.hrefNoHash!==r.documentBase.hrefNoHash,r.getDocumentUrl=function(t){return t?e.extend({},r.documentUrl):r.documentUrl.href},r.getDocumentBase=function(t){return t?e.extend({},r.documentBase):r.documentBase.href},r}),define("handy/base/1.1.0/navigation",["$","handy/base/1.1.0/path","handy/base/1.1.0/history"],function(t){var e,a=t("$"),r=t("handy/base/1.1.0/path"),n=t("handy/base/1.1.0/history"),s=a(window),o={currentHref:r.documentBase.hrefNoHash,go:function(t,e){var a=n.find(t.hrefNoHash);r.documentBase.hrefNoHash===t.hrefNoHash?r.set("#"):r.set("#"+t.pathname),0>a&&(e||n.clearForward(this.currentHref),n.add(t.hrefNoHash,e)),this.currentHref=t.hrefNoHash}};return s.on("hashchange",function(){var t=r.parseUrl(r.squash(location.href)).hrefNoHash;if(t===o.currentHref){if(e)return;n.add(t),e=!0}else{var s=n.find(o.currentHref),i=n.find(t);a(this).trigger("navigate",{state:{direction:i>-1&&s>i?"backward":"forward"}})}}),o}),define("handy/base/1.1.0/history",["$"],function(t){function e(){this._stack=[]}var a=t("$");return window.undefined,a.extend(e.prototype,{add:function(t,e){this._stack[e?"unshift":"push"](t)},clearForward:function(t){this._stack=this._stack.slice(0,this.find(t)+1)},find:function(t){return this._stack.indexOf(t)}}),new e});
