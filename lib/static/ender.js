/*!
  * =============================================================
  * Ender: open module JavaScript framework (https://ender.no.de)
  * Build: ender build qwery domready reqwest bonzo
  * Packages: ender-js@0.4.5 qwery@3.4.1 domready@0.2.11 reqwest@0.7.3 bonzo@1.3.5
  * =============================================================
  */

/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011-2012 (@ded @fat)
  * http://ender.jit.su
  * License MIT
  */
(function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context['$']
    , oldEnder = context['ender']
    , oldRequire = context['require']
    , oldProvide = context['provide']

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules['$' + identifier] || window[identifier]
    if (!module) throw new Error("Ender Error: Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules['$' + name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  /**
   * main Ender return object
   * @constructor
   * @param {Array|Node|string} s a CSS selector or DOM node(s)
   * @param {Array.|Node} r a root node(s)
   */
  function Ender(s, r) {
    var elements
      , i

    this.selector = s
    // string || node || nodelist || window
    if (typeof s == 'undefined') {
      elements = []
      this.selector = ''
    } else if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      elements = ender._select(s, r)
    } else {
      elements = isFinite(s.length) ? s : [s]
    }
    this.length = elements.length
    for (i = this.length; i--;) this[i] = elements[i]
  }

  /**
   * @param {function(el, i, inst)} fn
   * @param {Object} opt_scope
   * @returns {Ender}
   */
  Ender.prototype['forEach'] = function (fn, opt_scope) {
    var i, l
    // opt out of native forEach so we can intentionally call our own scope
    // defaulting to the current item and be able to return self
    for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(opt_scope || this[i], this[i], i, this)
    // return self for chaining
    return this
  }

  Ender.prototype.$ = ender // handy reference to self

  // dev tools secret sauce
  Ender.prototype.splice = function () { throw new Error('Not implemented') }

  function ender(s, r) {
    return new Ender(s, r)
  }

  ender['_VERSION'] = '0.4.5'

  ender.fn = Ender.prototype // for easy compat to jQuery plugins

  ender.ender = function (o, chain) {
    aug(chain ? Ender.prototype : ender, o)
  }

  ender._select = function (s, r) {
    if (typeof s == 'string') return (r || document).querySelectorAll(s)
    if (s.nodeName) return [s]
    return s
  }


  // use callback to receive Ender's require & provide and remove them from global
  ender.noConflict = function (callback) {
    context['$'] = old
    if (callback) {
      context['provide'] = oldProvide
      context['require'] = oldRequire
      context['ender'] = oldEnder
      if (typeof callback == 'function') callback(require, provide, this)
    }
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = ender

}(this));

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * @preserve Qwery - A Blazing Fast query selector engine
    * https://github.com/ded/qwery
    * copyright Dustin Diaz 2012
    * MIT License
    */

  (function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(definition)
    else context[name] = definition()
  })('qwery', this, function () {
    var doc = document
      , html = doc.documentElement
      , byClass = 'getElementsByClassName'
      , byTag = 'getElementsByTagName'
      , qSA = 'querySelectorAll'
      , useNativeQSA = 'useNativeQSA'
      , tagName = 'tagName'
      , nodeType = 'nodeType'
      , select // main select() method, assign later

      , id = /#([\w\-]+)/
      , clas = /\.[\w\-]+/g
      , idOnly = /^#([\w\-]+)$/
      , classOnly = /^\.([\w\-]+)$/
      , tagOnly = /^([\w\-]+)$/
      , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
      , splittable = /(^|,)\s*[>~+]/
      , normalizr = /^\s+|\s*([,\s\+\~>]|$)\s*/g
      , splitters = /[\s\>\+\~]/
      , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
      , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
      , simple = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
      , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/
      , pseudo = /:([\w\-]+)(\(['"]?([^()]+)['"]?\))?/
      , easy = new RegExp(idOnly.source + '|' + tagOnly.source + '|' + classOnly.source)
      , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
      , tokenizr = new RegExp(splitters.source + splittersMore.source)
      , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?')

    var walker = {
        ' ': function (node) {
          return node && node !== html && node.parentNode
        }
      , '>': function (node, contestant) {
          return node && node.parentNode == contestant.parentNode && node.parentNode
        }
      , '~': function (node) {
          return node && node.previousSibling
        }
      , '+': function (node, contestant, p1, p2) {
          if (!node) return false
          return (p1 = previous(node)) && (p2 = previous(contestant)) && p1 == p2 && p1
        }
      }

    function cache() {
      this.c = {}
    }
    cache.prototype = {
      g: function (k) {
        return this.c[k] || undefined
      }
    , s: function (k, v, r) {
        v = r ? new RegExp(v) : v
        return (this.c[k] = v)
      }
    }

    var classCache = new cache()
      , cleanCache = new cache()
      , attrCache = new cache()
      , tokenCache = new cache()

    function classRegex(c) {
      return classCache.g(c) || classCache.s(c, '(^|\\s+)' + c + '(\\s+|$)', 1)
    }

    // not quite as fast as inline loops in older browsers so don't use liberally
    function each(a, fn) {
      var i = 0, l = a.length
      for (; i < l; i++) fn(a[i])
    }

    function flatten(ar) {
      for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
      return r
    }

    function arrayify(ar) {
      var i = 0, l = ar.length, r = []
      for (; i < l; i++) r[i] = ar[i]
      return r
    }

    function previous(n) {
      while (n = n.previousSibling) if (n[nodeType] == 1) break;
      return n
    }

    function q(query) {
      return query.match(chunker)
    }

    // called using `this` as element and arguments from regex group results.
    // given => div.hello[title="world"]:foo('bar')
    // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
    function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
      var i, m, k, o, classes
      if (this[nodeType] !== 1) return false
      if (tag && tag !== '*' && this[tagName] && this[tagName].toLowerCase() !== tag) return false
      if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
      if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
        for (i = classes.length; i--;) if (!classRegex(classes[i].slice(1)).test(this.className)) return false
      }
      if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) return false
      if (wholeAttribute && !value) { // select is just for existance of attrib
        o = this.attributes
        for (k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
            return this
          }
        }
      }
      if (wholeAttribute && !checkAttr(qualifier, getAttr(this, attribute) || '', value)) {
        // select is for attrib equality
        return false
      }
      return this
    }

    function clean(s) {
      return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
    }

    function checkAttr(qualify, actual, val) {
      switch (qualify) {
      case '=':
        return actual == val
      case '^=':
        return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, '^' + clean(val), 1))
      case '$=':
        return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, clean(val) + '$', 1))
      case '*=':
        return actual.match(attrCache.g(val) || attrCache.s(val, clean(val), 1))
      case '~=':
        return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, '(?:^|\\s+)' + clean(val) + '(?:\\s+|$)', 1))
      case '|=':
        return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, '^' + clean(val) + '(-|$)', 1))
      }
      return 0
    }

    // given a selector, first check for simple cases then collect all base candidate matches and filter
    function _qwery(selector, _root) {
      var r = [], ret = [], i, l, m, token, tag, els, intr, item, root = _root
        , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        , dividedTokens = selector.match(dividers)

      if (!tokens.length) return r

      token = (tokens = tokens.slice(0)).pop() // copy cached tokens, take the last one
      if (tokens.length && (m = tokens[tokens.length - 1].match(idOnly))) root = byId(_root, m[1])
      if (!root) return r

      intr = q(token)
      // collect base candidates to filter
      els = root !== _root && root[nodeType] !== 9 && dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ?
        function (r) {
          while (root = root.nextSibling) {
            root[nodeType] == 1 && (intr[1] ? intr[1] == root[tagName].toLowerCase() : 1) && (r[r.length] = root)
          }
          return r
        }([]) :
        root[byTag](intr[1] || '*')
      // filter elements according to the right-most part of the selector
      for (i = 0, l = els.length; i < l; i++) {
        if (item = interpret.apply(els[i], intr)) r[r.length] = item
      }
      if (!tokens.length) return r

      // filter further according to the rest of the selector (the left side)
      each(r, function (e) { if (ancestorMatch(e, tokens, dividedTokens)) ret[ret.length] = e })
      return ret
    }

    // compare element to a selector
    function is(el, selector, root) {
      if (isNode(selector)) return el == selector
      if (arrayLike(selector)) return !!~flatten(selector).indexOf(el) // if selector is an array, is el a member?

      var selectors = selector.split(','), tokens, dividedTokens
      while (selector = selectors.pop()) {
        tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
        dividedTokens = selector.match(dividers)
        tokens = tokens.slice(0) // copy array
        if (interpret.apply(el, q(tokens.pop())) && (!tokens.length || ancestorMatch(el, tokens, dividedTokens, root))) {
          return true
        }
      }
      return false
    }

    // given elements matching the right-most part of a selector, filter out any that don't match the rest
    function ancestorMatch(el, tokens, dividedTokens, root) {
      var cand
      // recursively work backwards through the tokens and up the dom, covering all options
      function crawl(e, i, p) {
        while (p = walker[dividedTokens[i]](p, e)) {
          if (isNode(p) && (interpret.apply(p, q(tokens[i])))) {
            if (i) {
              if (cand = crawl(p, i - 1, p)) return cand
            } else return p
          }
        }
      }
      return (cand = crawl(el, tokens.length - 1, el)) && (!root || isAncestor(cand, root))
    }

    function isNode(el, t) {
      return el && typeof el === 'object' && (t = el[nodeType]) && (t == 1 || t == 9)
    }

    function uniq(ar) {
      var a = [], i, j;
      o:
      for (i = 0; i < ar.length; ++i) {
        for (j = 0; j < a.length; ++j) if (a[j] == ar[i]) continue o
        a[a.length] = ar[i]
      }
      return a
    }

    function arrayLike(o) {
      return (typeof o === 'object' && isFinite(o.length))
    }

    function normalizeRoot(root) {
      if (!root) return doc
      if (typeof root == 'string') return qwery(root)[0]
      if (!root[nodeType] && arrayLike(root)) return root[0]
      return root
    }

    function byId(root, id, el) {
      // if doc, query on it, else query the parent doc or if a detached fragment rewrite the query and run on the fragment
      return root[nodeType] === 9 ? root.getElementById(id) :
        root.ownerDocument &&
          (((el = root.ownerDocument.getElementById(id)) && isAncestor(el, root) && el) ||
            (!isAncestor(root, root.ownerDocument) && select('[id="' + id + '"]', root)[0]))
    }

    function qwery(selector, _root) {
      var m, el, root = normalizeRoot(_root)

      // easy, fast cases that we can dispatch with simple DOM calls
      if (!root || !selector) return []
      if (selector === window || isNode(selector)) {
        return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
      }
      if (selector && arrayLike(selector)) return flatten(selector)
      if (m = selector.match(easy)) {
        if (m[1]) return (el = byId(root, m[1])) ? [el] : []
        if (m[2]) return arrayify(root[byTag](m[2]))
        if (hasByClass && m[3]) return arrayify(root[byClass](m[3]))
      }

      return select(selector, root)
    }

    // where the root is not document and a relationship selector is first we have to
    // do some awkward adjustments to get it to work, even with qSA
    function collectSelector(root, collector) {
      return function (s) {
        var oid, nid
        if (splittable.test(s)) {
          if (root[nodeType] !== 9) {
            // make sure the el has an id, rewrite the query, set root to doc and run it
            if (!(nid = oid = root.getAttribute('id'))) root.setAttribute('id', nid = '__qwerymeupscotty')
            s = '[id="' + nid + '"]' + s // avoid byId and allow us to match context element
            collector(root.parentNode || root, s, true)
            oid || root.removeAttribute('id')
          }
          return;
        }
        s.length && collector(root, s, false)
      }
    }

    var isAncestor = 'compareDocumentPosition' in html ?
      function (element, container) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (element, container) {
        container = container[nodeType] === 9 || container == window ? html : container
        return container !== element && container.contains(element)
      } :
      function (element, container) {
        while (element = element.parentNode) if (element === container) return 1
        return 0
      }
    , getAttr = function () {
        // detect buggy IE src/href getAttribute() call
        var e = doc.createElement('p')
        return ((e.innerHTML = '<a href="#x">x</a>') && e.firstChild.getAttribute('href') != '#x') ?
          function (e, a) {
            return a === 'class' ? e.className : (a === 'href' || a === 'src') ?
              e.getAttribute(a, 2) : e.getAttribute(a)
          } :
          function (e, a) { return e.getAttribute(a) }
      }()
    , hasByClass = !!doc[byClass]
      // has native qSA support
    , hasQSA = doc.querySelector && doc[qSA]
      // use native qSA
    , selectQSA = function (selector, root) {
        var result = [], ss, e
        try {
          if (root[nodeType] === 9 || !splittable.test(selector)) {
            // most work is done right here, defer to qSA
            return arrayify(root[qSA](selector))
          }
          // special case where we need the services of `collectSelector()`
          each(ss = selector.split(','), collectSelector(root, function (ctx, s) {
            e = ctx[qSA](s)
            if (e.length == 1) result[result.length] = e.item(0)
            else if (e.length) result = result.concat(arrayify(e))
          }))
          return ss.length > 1 && result.length > 1 ? uniq(result) : result
        } catch (ex) { }
        return selectNonNative(selector, root)
      }
      // no native selector support
    , selectNonNative = function (selector, root) {
        var result = [], items, m, i, l, r, ss
        selector = selector.replace(normalizr, '$1')
        if (m = selector.match(tagAndOrClass)) {
          r = classRegex(m[2])
          items = root[byTag](m[1] || '*')
          for (i = 0, l = items.length; i < l; i++) {
            if (r.test(items[i].className)) result[result.length] = items[i]
          }
          return result
        }
        // more complex selector, get `_qwery()` to do the work for us
        each(ss = selector.split(','), collectSelector(root, function (ctx, s, rewrite) {
          r = _qwery(s, ctx)
          for (i = 0, l = r.length; i < l; i++) {
            if (ctx[nodeType] === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
          }
        }))
        return ss.length > 1 && result.length > 1 ? uniq(result) : result
      }
    , configure = function (options) {
        // configNativeQSA: use fully-internal selector or native qSA where present
        if (typeof options[useNativeQSA] !== 'undefined')
          select = !options[useNativeQSA] ? selectNonNative : hasQSA ? selectQSA : selectNonNative
      }

    configure({ useNativeQSA: true })

    qwery.configure = configure
    qwery.uniq = uniq
    qwery.is = is
    qwery.pseudos = {}

    return qwery
  });

  if (typeof provide == "function") provide("qwery", module.exports);

  (function ($) {
    var q = function () {
      var r
      try {
        r = require('qwery')
      } catch (ex) {
        r = require('qwery-mobile')
      } finally {
        return r
      }
    }()

    $.pseudos = q.pseudos

    $._select = function (s, r) {
      // detect if sibling module 'bonzo' is available at run-time
      // rather than load-time since technically it's not a dependency and
      // can be loaded in any order
      // hence the lazy function re-definition
      return ($._select = (function () {
        var b
        if (typeof $.create == 'function') return function (s, r) {
          return /^\s*</.test(s) ? $.create(s, r) : q(s, r)
        }
        try {
          b = require('bonzo')
          return function (s, r) {
            return /^\s*</.test(s) ? b.create(s, r) : q(s, r)
          }
        } catch (e) { }
        return q
      })())(s, r)
    }

    $.ender({
        find: function (s) {
          var r = [], i, l, j, k, els
          for (i = 0, l = this.length; i < l; i++) {
            els = q(s, this[i])
            for (j = 0, k = els.length; j < k; j++) r.push(els[j])
          }
          return $(q.uniq(r))
        }
      , and: function (s) {
          var plus = $(s)
          for (var i = this.length, j = 0, l = this.length + plus.length; i < l; i++, j++) {
            this[i] = plus[j]
          }
          this.length += plus.length
          return this
        }
      , is: function(s, r) {
          var i, l
          for (i = 0, l = this.length; i < l; i++) {
            if (q.is(this[i], s, r)) {
              return true
            }
          }
          return false
        }
    }, true)
  }(ender));

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * domready (c) Dustin Diaz 2012 - License MIT
    */
  !function (name, definition) {
    if (typeof module != 'undefined') module.exports = definition()
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
    else this[name] = definition()
  }('domready', function (ready) {

    var fns = [], fn, f = false
      , doc = document
      , testEl = doc.documentElement
      , hack = testEl.doScroll
      , domContentLoaded = 'DOMContentLoaded'
      , addEventListener = 'addEventListener'
      , onreadystatechange = 'onreadystatechange'
      , readyState = 'readyState'
      , loaded = /^loade|c/.test(doc[readyState])

    function flush(f) {
      loaded = 1
      while (f = fns.shift()) f()
    }

    doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
      doc.removeEventListener(domContentLoaded, fn, f)
      flush()
    }, f)


    hack && doc.attachEvent(onreadystatechange, fn = function () {
      if (/^c/.test(doc[readyState])) {
        doc.detachEvent(onreadystatechange, fn)
        flush()
      }
    })

    return (ready = hack ?
      function (fn) {
        self != top ?
          loaded ? fn() : fns.push(fn) :
          function () {
            try {
              testEl.doScroll('left')
            } catch (e) {
              return setTimeout(function() { ready(fn) }, 50)
            }
            fn()
          }()
      } :
      function (fn) {
        loaded ? fn() : fns.push(fn)
      })
  })
  if (typeof provide == "function") provide("domready", module.exports);

  !function ($) {
    var ready = require('domready')
    $.ender({domReady: ready})
    $.ender({
      ready: function (f) {
        ready(f)
        return this
      }
    }, true)
  }(ender);
}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Reqwest! A general purpose XHR connection manager
    * (c) Dustin Diaz 2013
    * https://github.com/ded/reqwest
    * license MIT
    */
  !function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(definition)
    else context[name] = definition()
  }('reqwest', this, function () {

    var win = window
      , doc = document
      , twoHundo = /^20\d$/
      , byTag = 'getElementsByTagName'
      , readyState = 'readyState'
      , contentType = 'Content-Type'
      , requestedWith = 'X-Requested-With'
      , head = doc[byTag]('head')[0]
      , uniqid = 0
      , callbackPrefix = 'reqwest_' + (+new Date())
      , lastValue // data stored by the most recent JSONP callback
      , xmlHttpRequest = 'XMLHttpRequest'
      , noop = function () {}

      , isArray = typeof Array.isArray == 'function'
          ? Array.isArray
          : function (a) {
              return a instanceof Array
            }

      , defaultHeaders = {
            contentType: 'application/x-www-form-urlencoded'
          , requestedWith: xmlHttpRequest
          , accept: {
                '*':  'text/javascript, text/html, application/xml, text/xml, */*'
              , xml:  'application/xml, text/xml'
              , html: 'text/html'
              , text: 'text/plain'
              , json: 'application/json, text/javascript'
              , js:   'application/javascript, text/javascript'
            }
        }

      , xhr = win[xmlHttpRequest]
          ? function () {
              return new XMLHttpRequest()
            }
          : function () {
              return new ActiveXObject('Microsoft.XMLHTTP')
            }
      , globalSetupOptions = {
          dataFilter: function (data) {
            return data
          }
        }

    function handleReadyState(r, success, error) {
      return function () {
        // use _aborted to mitigate against IE err c00c023f
        // (can't read props on aborted request objects)
        if (r._aborted) return error(r.request)
        if (r.request && r.request[readyState] == 4) {
          r.request.onreadystatechange = noop
          if (twoHundo.test(r.request.status))
            success(r.request)
          else
            error(r.request)
        }
      }
    }

    function setHeaders(http, o) {
      var headers = o.headers || {}
        , h

      headers.Accept = headers.Accept
        || defaultHeaders.accept[o.type]
        || defaultHeaders.accept['*']

      // breaks cross-origin requests with legacy browsers
      if (!o.crossOrigin && !headers[requestedWith]) headers[requestedWith] = defaultHeaders.requestedWith
      if (!headers[contentType]) headers[contentType] = o.contentType || defaultHeaders.contentType
      for (h in headers)
        headers.hasOwnProperty(h) && http.setRequestHeader(h, headers[h])
    }

    function setCredentials(http, o) {
      if (typeof o.withCredentials !== 'undefined' && typeof http.withCredentials !== 'undefined') {
        http.withCredentials = !!o.withCredentials
      }
    }

    function generalCallback(data) {
      lastValue = data
    }

    function urlappend (url, s) {
      return url + (/\?/.test(url) ? '&' : '?') + s
    }

    function handleJsonp(o, fn, err, url) {
      var reqId = uniqid++
        , cbkey = o.jsonpCallback || 'callback' // the 'callback' key
        , cbval = o.jsonpCallbackName || reqwest.getcallbackPrefix(reqId)
        // , cbval = o.jsonpCallbackName || ('reqwest_' + reqId) // the 'callback' value
        , cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
        , match = url.match(cbreg)
        , script = doc.createElement('script')
        , loaded = 0
        , isIE10 = navigator.userAgent.indexOf('MSIE 10.0') !== -1

      if (match) {
        if (match[3] === '?') {
          url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
        } else {
          cbval = match[3] // provided callback func name
        }
      } else {
        url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
      }

      win[cbval] = generalCallback

      script.type = 'text/javascript'
      script.src = url
      script.async = true
      if (typeof script.onreadystatechange !== 'undefined' && !isIE10) {
        // need this for IE due to out-of-order onreadystatechange(), binding script
        // execution to an event listener gives us control over when the script
        // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
        //
        // if this hack is used in IE10 jsonp callback are never called
        script.event = 'onclick'
        script.htmlFor = script.id = '_reqwest_' + reqId
      }

      script.onload = script.onreadystatechange = function () {
        if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
          return false
        }
        script.onload = script.onreadystatechange = null
        script.onclick && script.onclick()
        // Call the user callback with the last value stored and clean up values and scripts.
        o.success && o.success(lastValue)
        lastValue = undefined
        head.removeChild(script)
        loaded = 1
      }

      // Add the script to the DOM head
      head.appendChild(script)

      // Enable JSONP timeout
      return {
        abort: function () {
          script.onload = script.onreadystatechange = null
          o.error && o.error({}, 'Request is aborted: timeout', {})
          lastValue = undefined
          head.removeChild(script)
          loaded = 1
        }
      }
    }

    function getRequest(fn, err) {
      var o = this.o
        , method = (o.method || 'GET').toUpperCase()
        , url = typeof o === 'string' ? o : o.url
        // convert non-string objects to query-string form unless o.processData is false
        , data = (o.processData !== false && o.data && typeof o.data !== 'string')
          ? reqwest.toQueryString(o.data)
          : (o.data || null)
        , http

      // if we're working on a GET request and we have data then we should append
      // query string to end of URL and not post data
      if ((o.type == 'jsonp' || method == 'GET') && data) {
        url = urlappend(url, data)
        data = null
      }

      if (o.type == 'jsonp') return handleJsonp(o, fn, err, url)

      http = xhr()
      http.open(method, url, true)
      setHeaders(http, o)
      setCredentials(http, o)
      http.onreadystatechange = handleReadyState(this, fn, err)
      o.before && o.before(http)
      http.send(data)
      return http
    }

    function Reqwest(o, fn) {
      this.o = o
      this.fn = fn

      init.apply(this, arguments)
    }

    function setType(url) {
      var m = url.match(/\.(json|jsonp|html|xml)(\?|$)/)
      return m ? m[1] : 'js'
    }

    function init(o, fn) {

      this.url = typeof o == 'string' ? o : o.url
      this.timeout = null

      // whether request has been fulfilled for purpose
      // of tracking the Promises
      this._fulfilled = false
      // success handlers
      this._fulfillmentHandlers = []
      // error handlers
      this._errorHandlers = []
      // complete (both success and fail) handlers
      this._completeHandlers = []
      this._erred = false
      this._responseArgs = {}

      var self = this
        , type = o.type || setType(this.url)

      fn = fn || function () {}

      if (o.timeout) {
        this.timeout = setTimeout(function () {
          self.abort()
        }, o.timeout)
      }

      if (o.success) {
        this._fulfillmentHandlers.push(function () {
          o.success.apply(o, arguments)
        })
      }

      if (o.error) {
        this._errorHandlers.push(function () {
          o.error.apply(o, arguments)
        })
      }

      if (o.complete) {
        this._completeHandlers.push(function () {
          o.complete.apply(o, arguments)
        })
      }

      function complete (resp) {
        o.timeout && clearTimeout(self.timeout)
        self.timeout = null
        while (self._completeHandlers.length > 0) {
          self._completeHandlers.shift()(resp)
        }
      }

      function success (resp) {
        // use global data filter on response text
        var filteredResponse = globalSetupOptions.dataFilter(resp.responseText, type)
          , r = resp.responseText = filteredResponse
        if (r) {
          switch (type) {
          case 'json':
            try {
              resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
            } catch (err) {
              return error(resp, 'Could not parse JSON in response', err)
            }
            break
          case 'js':
            resp = eval(r)
            break
          case 'html':
            resp = r
            break
          case 'xml':
            resp = resp.responseXML
                && resp.responseXML.parseError // IE trololo
                && resp.responseXML.parseError.errorCode
                && resp.responseXML.parseError.reason
              ? null
              : resp.responseXML
            break
          }
        }

        self._responseArgs.resp = resp
        self._fulfilled = true
        fn(resp)
        while (self._fulfillmentHandlers.length > 0) {
          self._fulfillmentHandlers.shift()(resp)
        }

        complete(resp)
      }

      function error(resp, msg, t) {
        self._responseArgs.resp = resp
        self._responseArgs.msg = msg
        self._responseArgs.t = t
        self._erred = true
        while (self._errorHandlers.length > 0) {
          self._errorHandlers.shift()(resp, msg, t)
        }
        complete(resp)
      }

      this.request = getRequest.call(this, success, error)
    }

    Reqwest.prototype = {
      abort: function () {
        this._aborted = true
        this.request.abort()
      }

    , retry: function () {
        init.call(this, this.o, this.fn)
      }

      /**
       * Small deviation from the Promises A CommonJs specification
       * http://wiki.commonjs.org/wiki/Promises/A
       */

      /**
       * `then` will execute upon successful requests
       */
    , then: function (success, fail) {
        if (this._fulfilled) {
          success(this._responseArgs.resp)
        } else if (this._erred) {
          fail(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
        } else {
          this._fulfillmentHandlers.push(success)
          this._errorHandlers.push(fail)
        }
        return this
      }

      /**
       * `always` will execute whether the request succeeds or fails
       */
    , always: function (fn) {
        if (this._fulfilled || this._erred) {
          fn(this._responseArgs.resp)
        } else {
          this._completeHandlers.push(fn)
        }
        return this
      }

      /**
       * `fail` will execute when the request fails
       */
    , fail: function (fn) {
        if (this._erred) {
          fn(this._responseArgs.resp, this._responseArgs.msg, this._responseArgs.t)
        } else {
          this._errorHandlers.push(fn)
        }
        return this
      }
    }

    function reqwest(o, fn) {
      return new Reqwest(o, fn)
    }

    // normalize newline variants according to spec -> CRLF
    function normalize(s) {
      return s ? s.replace(/\r?\n/g, '\r\n') : ''
    }

    function serial(el, cb) {
      var n = el.name
        , t = el.tagName.toLowerCase()
        , optCb = function (o) {
            // IE gives value="" even where there is no value attribute
            // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
            if (o && !o.disabled)
              cb(n, normalize(o.attributes.value && o.attributes.value.specified ? o.value : o.text))
          }
        , ch, ra, val, i

      // don't serialize elements that are disabled or without a name
      if (el.disabled || !n) return

      switch (t) {
      case 'input':
        if (!/reset|button|image|file/i.test(el.type)) {
          ch = /checkbox/i.test(el.type)
          ra = /radio/i.test(el.type)
          val = el.value
          // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
          ;(!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
        }
        break
      case 'textarea':
        cb(n, normalize(el.value))
        break
      case 'select':
        if (el.type.toLowerCase() === 'select-one') {
          optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
        } else {
          for (i = 0; el.length && i < el.length; i++) {
            el.options[i].selected && optCb(el.options[i])
          }
        }
        break
      }
    }

    // collect up all form elements found from the passed argument elements all
    // the way down to child elements; pass a '<form>' or form fields.
    // called with 'this'=callback to use for serial() on each element
    function eachFormElement() {
      var cb = this
        , e, i
        , serializeSubtags = function (e, tags) {
            var i, j, fa
            for (i = 0; i < tags.length; i++) {
              fa = e[byTag](tags[i])
              for (j = 0; j < fa.length; j++) serial(fa[j], cb)
            }
          }

      for (i = 0; i < arguments.length; i++) {
        e = arguments[i]
        if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
        serializeSubtags(e, [ 'input', 'select', 'textarea' ])
      }
    }

    // standard query string style serialization
    function serializeQueryString() {
      return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
    }

    // { 'name': 'value', ... } style serialization
    function serializeHash() {
      var hash = {}
      eachFormElement.apply(function (name, value) {
        if (name in hash) {
          hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
          hash[name].push(value)
        } else hash[name] = value
      }, arguments)
      return hash
    }

    // [ { name: 'name', value: 'value' }, ... ] style serialization
    reqwest.serializeArray = function () {
      var arr = []
      eachFormElement.apply(function (name, value) {
        arr.push({name: name, value: value})
      }, arguments)
      return arr
    }

    reqwest.serialize = function () {
      if (arguments.length === 0) return ''
      var opt, fn
        , args = Array.prototype.slice.call(arguments, 0)

      opt = args.pop()
      opt && opt.nodeType && args.push(opt) && (opt = null)
      opt && (opt = opt.type)

      if (opt == 'map') fn = serializeHash
      else if (opt == 'array') fn = reqwest.serializeArray
      else fn = serializeQueryString

      return fn.apply(null, args)
    }

    reqwest.toQueryString = function (o, trad) {
      var prefix, i
        , traditional = trad || false
        , s = []
        , enc = encodeURIComponent
        , add = function (key, value) {
            // If value is a function, invoke it and return its value
            value = ('function' === typeof value) ? value() : (value == null ? '' : value)
            s[s.length] = enc(key) + '=' + enc(value)
          }
      // If an array was passed in, assume that it is an array of form elements.
      if (isArray(o)) {
        for (i = 0; o && i < o.length; i++) add(o[i].name, o[i].value)
      } else {
        // If traditional, encode the "old" way (the way 1.3.2 or older
        // did it), otherwise encode params recursively.
        for (prefix in o) {
          buildParams(prefix, o[prefix], traditional, add)
        }
      }

      // spaces should be + according to spec
      return s.join('&').replace(/%20/g, '+')
    }

    function buildParams(prefix, obj, traditional, add) {
      var name, i, v
        , rbracket = /\[\]$/

      if (isArray(obj)) {
        // Serialize array item.
        for (i = 0; obj && i < obj.length; i++) {
          v = obj[i]
          if (traditional || rbracket.test(prefix)) {
            // Treat each array item as a scalar.
            add(prefix, v)
          } else {
            buildParams(prefix + '[' + (typeof v === 'object' ? i : '') + ']', v, traditional, add)
          }
        }
      } else if (obj.toString() === '[object Object]') {
        // Serialize object item.
        for (name in obj) {
          buildParams(prefix + '[' + name + ']', obj[name], traditional, add)
        }

      } else {
        // Serialize scalar item.
        add(prefix, obj)
      }
    }

    reqwest.getcallbackPrefix = function () {
      return callbackPrefix
    }

    // jQuery and Zepto compatibility, differences can be remapped here so you can call
    // .ajax.compat(options, callback)
    reqwest.compat = function (o, fn) {
      if (o) {
        o.type && (o.method = o.type) && delete o.type
        o.dataType && (o.type = o.dataType)
        o.jsonpCallback && (o.jsonpCallbackName = o.jsonpCallback) && delete o.jsonpCallback
        o.jsonp && (o.jsonpCallback = o.jsonp)
      }
      return new Reqwest(o, fn)
    }

    reqwest.ajaxSetup = function (options) {
      options = options || {}
      for (var k in options) {
        globalSetupOptions[k] = options[k]
      }
    }

    return reqwest
  });

  if (typeof provide == "function") provide("reqwest", module.exports);

  !function ($) {
    var r = require('reqwest')
      , integrate = function (method) {
          return function () {
            var args = Array.prototype.slice.call(arguments, 0)
              , i = (this && this.length) || 0
            while (i--) args.unshift(this[i])
            return r[method].apply(null, args)
          }
        }
      , s = integrate('serialize')
      , sa = integrate('serializeArray')

    $.ender({
        ajax: r
      , serialize: r.serialize
      , serializeArray: r.serializeArray
      , toQueryString: r.toQueryString
      , ajaxSetup: r.ajaxSetup
    })

    $.ender({
        serialize: s
      , serializeArray: sa
    }, true)
  }(ender);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
    * Bonzo: DOM Utility (c) Dustin Diaz 2012
    * https://github.com/ded/bonzo
    * License MIT
    */
  (function (name, context, definition) {
    if (typeof module != 'undefined' && module.exports) module.exports = definition()
    else if (typeof define == 'function' && define.amd) define(definition)
    else context[name] = definition()
  })('bonzo', this, function() {
    var win = window
      , doc = win.document
      , html = doc.documentElement
      , parentNode = 'parentNode'
      , specialAttributes = /^(checked|value|selected|disabled)$/i
        // tags that we have trouble inserting *into*
      , specialTags = /^(select|fieldset|table|tbody|tfoot|td|tr|colgroup)$/i
      , simpleScriptTagRe = /\s*<script +src=['"]([^'"]+)['"]>/
      , table = ['<table>', '</table>', 1]
      , td = ['<table><tbody><tr>', '</tr></tbody></table>', 3]
      , option = ['<select>', '</select>', 1]
      , noscope = ['_', '', 0, 1]
      , tagMap = { // tags that we have trouble *inserting*
            thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
          , tr: ['<table><tbody>', '</tbody></table>', 2]
          , th: td , td: td
          , col: ['<table><colgroup>', '</colgroup></table>', 2]
          , fieldset: ['<form>', '</form>', 1]
          , legend: ['<form><fieldset>', '</fieldset></form>', 2]
          , option: option, optgroup: option
          , script: noscope, style: noscope, link: noscope, param: noscope, base: noscope
        }
      , stateAttributes = /^(checked|selected|disabled)$/
      , ie = /msie/i.test(navigator.userAgent)
      , hasClass, addClass, removeClass
      , uidMap = {}
      , uuids = 0
      , digit = /^-?[\d\.]+$/
      , dattr = /^data-(.+)$/
      , px = 'px'
      , setAttribute = 'setAttribute'
      , getAttribute = 'getAttribute'
      , byTag = 'getElementsByTagName'
      , features = function() {
          var e = doc.createElement('p')
          e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>'
          return {
            hrefExtended: e[byTag]('a')[0][getAttribute]('href') != '#x' // IE < 8
          , autoTbody: e[byTag]('tbody').length !== 0 // IE < 8
          , computedStyle: doc.defaultView && doc.defaultView.getComputedStyle
          , cssFloat: e[byTag]('table')[0].style.styleFloat ? 'styleFloat' : 'cssFloat'
          , transform: function () {
              var props = ['transform', 'webkitTransform', 'MozTransform', 'OTransform', 'msTransform'], i
              for (i = 0; i < props.length; i++) {
                if (props[i] in e.style) return props[i]
              }
            }()
          , classList: 'classList' in e
          , opasity: function () {
              return typeof doc.createElement('a').style.opacity !== 'undefined'
            }()
          }
        }()
      , trimReplace = /(^\s*|\s*$)/g
      , whitespaceRegex = /\s+/
      , toString = String.prototype.toString
      , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1, boxFlex: 1, WebkitBoxFlex: 1, MozBoxFlex: 1 }
      , query = doc.querySelectorAll && function (selector) { return doc.querySelectorAll(selector) }
      , trim = String.prototype.trim ?
          function (s) {
            return s.trim()
          } :
          function (s) {
            return s.replace(trimReplace, '')
          }

      , getStyle = features.computedStyle
          ? function (el, property) {
              var value = null
                , computed = doc.defaultView.getComputedStyle(el, '')
              computed && (value = computed[property])
              return el.style[property] || value
            }
          : !(ie && html.currentStyle)
            ? function (el, property) {
                return el.style[property]
              }
            :
            /**
             * @param {Element} el
             * @param {string} property
             * @return {string|number}
             */
            function (el, property) {
              var val, value
              if (property == 'opacity' && !features.opasity) {
                val = 100
                try {
                  val = el['filters']['DXImageTransform.Microsoft.Alpha'].opacity
                } catch (e1) {
                  try {
                    val = el['filters']('alpha').opacity
                  } catch (e2) {}
                }
                return val / 100
              }
              value = el.currentStyle ? el.currentStyle[property] : null
              return el.style[property] || value
            }

    function isNode(node) {
      return node && node.nodeName && (node.nodeType == 1 || node.nodeType == 11)
    }


    function normalize(node, host, clone) {
      var i, l, ret
      if (typeof node == 'string') return bonzo.create(node)
      if (isNode(node)) node = [ node ]
      if (clone) {
        ret = [] // don't change original array
        for (i = 0, l = node.length; i < l; i++) ret[i] = cloneNode(host, node[i])
        return ret
      }
      return node
    }

    /**
     * @param {string} c a class name to test
     * @return {boolean}
     */
    function classReg(c) {
      return new RegExp('(^|\\s+)' + c + '(\\s+|$)')
    }


    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @param {boolean=} opt_rev
     * @return {Bonzo|Array}
     */
    function each(ar, fn, opt_scope, opt_rev) {
      var ind, i = 0, l = ar.length
      for (; i < l; i++) {
        ind = opt_rev ? ar.length - i - 1 : i
        fn.call(opt_scope || ar[ind], ar[ind], ind, ar)
      }
      return ar
    }


    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @return {Bonzo|Array}
     */
    function deepEach(ar, fn, opt_scope) {
      for (var i = 0, l = ar.length; i < l; i++) {
        if (isNode(ar[i])) {
          deepEach(ar[i].childNodes, fn, opt_scope)
          fn.call(opt_scope || ar[i], ar[i], i, ar)
        }
      }
      return ar
    }


    /**
     * @param {string} s
     * @return {string}
     */
    function camelize(s) {
      return s.replace(/-(.)/g, function (m, m1) {
        return m1.toUpperCase()
      })
    }


    /**
     * @param {string} s
     * @return {string}
     */
    function decamelize(s) {
      return s ? s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : s
    }


    /**
     * @param {Element} el
     * @return {*}
     */
    function data(el) {
      el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
      var uid = el[getAttribute]('data-node-uid')
      return uidMap[uid] || (uidMap[uid] = {})
    }


    /**
     * removes the data associated with an element
     * @param {Element} el
     */
    function clearData(el) {
      var uid = el[getAttribute]('data-node-uid')
      if (uid) delete uidMap[uid]
    }


    function dataValue(d) {
      var f
      try {
        return (d === null || d === undefined) ? undefined :
          d === 'true' ? true :
            d === 'false' ? false :
              d === 'null' ? null :
                (f = parseFloat(d)) == d ? f : d;
      } catch(e) {}
      return undefined
    }


    /**
     * @param {Bonzo|Array} ar
     * @param {function(Object, number, (Bonzo|Array))} fn
     * @param {Object=} opt_scope
     * @return {boolean} whether `some`thing was found
     */
    function some(ar, fn, opt_scope) {
      for (var i = 0, j = ar.length; i < j; ++i) if (fn.call(opt_scope || null, ar[i], i, ar)) return true
      return false
    }


    /**
     * this could be a giant enum of CSS properties
     * but in favor of file size sans-closure deadcode optimizations
     * we're just asking for any ol string
     * then it gets transformed into the appropriate style property for JS access
     * @param {string} p
     * @return {string}
     */
    function styleProperty(p) {
        (p == 'transform' && (p = features.transform)) ||
          (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + 'Origin')) ||
          (p == 'float' && (p = features.cssFloat))
        return p ? camelize(p) : null
    }

    // this insert method is intense
    function insert(target, host, fn, rev) {
      var i = 0, self = host || this, r = []
        // target nodes could be a css selector if it's a string and a selector engine is present
        // otherwise, just use target
        , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
      // normalize each node in case it's still a string and we need to create nodes on the fly
      each(normalize(nodes), function (t, j) {
        each(self, function (el) {
          fn(t, r[i++] = j > 0 ? cloneNode(self, el) : el)
        }, null, rev)
      }, this, rev)
      self.length = i
      each(r, function (e) {
        self[--i] = e
      }, null, !rev)
      return self
    }


    /**
     * sets an element to an explicit x/y position on the page
     * @param {Element} el
     * @param {?number} x
     * @param {?number} y
     */
    function xy(el, x, y) {
      var $el = bonzo(el)
        , style = $el.css('position')
        , offset = $el.offset()
        , rel = 'relative'
        , isRel = style == rel
        , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]

      if (style == 'static') {
        $el.css('position', rel)
        style = rel
      }

      isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
      isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)

      x != null && (el.style.left = x - offset.left + delta[0] + px)
      y != null && (el.style.top = y - offset.top + delta[1] + px)

    }

    // classList support for class management
    // altho to be fair, the api sucks because it won't accept multiple classes at once
    if (features.classList) {
      hasClass = function (el, c) {
        return el.classList.contains(c)
      }
      addClass = function (el, c) {
        el.classList.add(c)
      }
      removeClass = function (el, c) {
        el.classList.remove(c)
      }
    }
    else {
      hasClass = function (el, c) {
        return classReg(c).test(el.className)
      }
      addClass = function (el, c) {
        el.className = trim(el.className + ' ' + c)
      }
      removeClass = function (el, c) {
        el.className = trim(el.className.replace(classReg(c), ' '))
      }
    }


    /**
     * this allows method calling for setting values
     *
     * @example
     * bonzo(elements).css('color', function (el) {
     *   return el.getAttribute('data-original-color')
     * })
     *
     * @param {Element} el
     * @param {function (Element)|string}
     * @return {string}
     */
    function setter(el, v) {
      return typeof v == 'function' ? v(el) : v
    }

    function scroll(x, y, type) {
      var el = this[0]
      if (!el) return this
      if (x == null && y == null) {
        return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
      }
      if (isBody(el)) {
        win.scrollTo(x, y)
      } else {
        x != null && (el.scrollLeft = x)
        y != null && (el.scrollTop = y)
      }
      return this
    }

    /**
     * @constructor
     * @param {Array.<Element>|Element|Node|string} elements
     */
    function Bonzo(elements) {
      this.length = 0
      if (elements) {
        elements = typeof elements !== 'string' &&
          !elements.nodeType &&
          typeof elements.length !== 'undefined' ?
            elements :
            [elements]
        this.length = elements.length
        for (var i = 0; i < elements.length; i++) this[i] = elements[i]
      }
    }

    Bonzo.prototype = {

        /**
         * @param {number} index
         * @return {Element|Node}
         */
        get: function (index) {
          return this[index] || null
        }

        // itetators
        /**
         * @param {function(Element|Node)} fn
         * @param {Object=} opt_scope
         * @return {Bonzo}
         */
      , each: function (fn, opt_scope) {
          return each(this, fn, opt_scope)
        }

        /**
         * @param {Function} fn
         * @param {Object=} opt_scope
         * @return {Bonzo}
         */
      , deepEach: function (fn, opt_scope) {
          return deepEach(this, fn, opt_scope)
        }


        /**
         * @param {Function} fn
         * @param {Function=} opt_reject
         * @return {Array}
         */
      , map: function (fn, opt_reject) {
          var m = [], n, i
          for (i = 0; i < this.length; i++) {
            n = fn.call(this, this[i], i)
            opt_reject ? (opt_reject(n) && m.push(n)) : m.push(n)
          }
          return m
        }

      // text and html inserters!

      /**
       * @param {string} h the HTML to insert
       * @param {boolean=} opt_text whether to set or get text content
       * @return {Bonzo|string}
       */
      , html: function (h, opt_text) {
          var method = opt_text
                ? html.textContent === undefined ? 'innerText' : 'textContent'
                : 'innerHTML'
            , that = this
            , append = function (el, i) {
                each(normalize(h, that, i), function (node) {
                  el.appendChild(node)
                })
              }
            , updateElement = function (el, i) {
                try {
                  if (opt_text || (typeof h == 'string' && !specialTags.test(el.tagName))) {
                    return el[method] = h
                  }
                } catch (e) {}
                append(el, i)
              }
          return typeof h != 'undefined'
            ? this.empty().each(updateElement)
            : this[0] ? this[0][method] : ''
        }

        /**
         * @param {string=} opt_text the text to set, otherwise this is a getter
         * @return {Bonzo|string}
         */
      , text: function (opt_text) {
          return this.html(opt_text, true)
        }

        // more related insertion methods

        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , append: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el.appendChild(i)
            })
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , prepend: function (node) {
          var that = this
          return this.each(function (el, i) {
            var first = el.firstChild
            each(normalize(node, that, i), function (i) {
              el.insertBefore(i, first)
            })
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , appendTo: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t.appendChild(el)
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , prependTo: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t.insertBefore(el, t.firstChild)
          }, 1)
        }


        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , before: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el[parentNode].insertBefore(i, el)
            })
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , after: function (node) {
          var that = this
          return this.each(function (el, i) {
            each(normalize(node, that, i), function (i) {
              el[parentNode].insertBefore(i, el.nextSibling)
            }, null, 1)
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , insertBefore: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            t[parentNode].insertBefore(el, t)
          })
        }


        /**
         * @param {Bonzo|string|Element|Array} target the location for which you'll insert your new content
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , insertAfter: function (target, opt_host) {
          return insert.call(this, target, opt_host, function (t, el) {
            var sibling = t.nextSibling
            sibling ?
              t[parentNode].insertBefore(el, sibling) :
              t[parentNode].appendChild(el)
          }, 1)
        }


        /**
         * @param {Bonzo|string|Element|Array} node
         * @return {Bonzo}
         */
      , replaceWith: function (node) {
          bonzo(normalize(node)).insertAfter(this)
          return this.remove()
        }

        /**
         * @param {Object=} opt_host an optional host scope (primarily used when integrated with Ender)
         * @return {Bonzo}
         */
      , clone: function (opt_host) {
          var ret = [] // don't change original array
            , l, i
          for (i = 0, l = this.length; i < l; i++) ret[i] = cloneNode(opt_host || this, this[i])
          return bonzo(ret)
        }

        // class management

        /**
         * @param {string} c
         * @return {Bonzo}
         */
      , addClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            // we `each` here so you can do $el.addClass('foo bar')
            each(c, function (c) {
              if (c && !hasClass(el, setter(el, c)))
                addClass(el, setter(el, c))
            })
          })
        }


        /**
         * @param {string} c
         * @return {Bonzo}
         */
      , removeClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            each(c, function (c) {
              if (c && hasClass(el, setter(el, c)))
                removeClass(el, setter(el, c))
            })
          })
        }


        /**
         * @param {string} c
         * @return {boolean}
         */
      , hasClass: function (c) {
          c = toString.call(c).split(whitespaceRegex)
          return some(this, function (el) {
            return some(c, function (c) {
              return c && hasClass(el, c)
            })
          })
        }


        /**
         * @param {string} c classname to toggle
         * @param {boolean=} opt_condition whether to add or remove the class straight away
         * @return {Bonzo}
         */
      , toggleClass: function (c, opt_condition) {
          c = toString.call(c).split(whitespaceRegex)
          return this.each(function (el) {
            each(c, function (c) {
              if (c) {
                typeof opt_condition !== 'undefined' ?
                  opt_condition ? !hasClass(el, c) && addClass(el, c) : removeClass(el, c) :
                  hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
              }
            })
          })
        }

        // display togglers

        /**
         * @param {string=} opt_type useful to set back to anything other than an empty string
         * @return {Bonzo}
         */
      , show: function (opt_type) {
          opt_type = typeof opt_type == 'string' ? opt_type : ''
          return this.each(function (el) {
            el.style.display = opt_type
          })
        }


        /**
         * @return {Bonzo}
         */
      , hide: function () {
          return this.each(function (el) {
            el.style.display = 'none'
          })
        }


        /**
         * @param {Function=} opt_callback
         * @param {string=} opt_type
         * @return {Bonzo}
         */
      , toggle: function (opt_callback, opt_type) {
          opt_type = typeof opt_type == 'string' ? opt_type : '';
          typeof opt_callback != 'function' && (opt_callback = null)
          return this.each(function (el) {
            el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : opt_type;
            opt_callback && opt_callback.call(el)
          })
        }


        // DOM Walkers & getters

        /**
         * @return {Element|Node}
         */
      , first: function () {
          return bonzo(this.length ? this[0] : [])
        }


        /**
         * @return {Element|Node}
         */
      , last: function () {
          return bonzo(this.length ? this[this.length - 1] : [])
        }


        /**
         * @return {Element|Node}
         */
      , next: function () {
          return this.related('nextSibling')
        }


        /**
         * @return {Element|Node}
         */
      , previous: function () {
          return this.related('previousSibling')
        }


        /**
         * @return {Element|Node}
         */
      , parent: function() {
          return this.related(parentNode)
        }


        /**
         * @private
         * @param {string} method the directional DOM method
         * @return {Element|Node}
         */
      , related: function (method) {
          return bonzo(this.map(
            function (el) {
              el = el[method]
              while (el && el.nodeType !== 1) {
                el = el[method]
              }
              return el || 0
            },
            function (el) {
              return el
            }
          ))
        }


        /**
         * @return {Bonzo}
         */
      , focus: function () {
          this.length && this[0].focus()
          return this
        }


        /**
         * @return {Bonzo}
         */
      , blur: function () {
          this.length && this[0].blur()
          return this
        }

        // style getter setter & related methods

        /**
         * @param {Object|string} o
         * @param {string=} opt_v
         * @return {Bonzo|string}
         */
      , css: function (o, opt_v) {
          var p, iter = o
          // is this a request for just getting a style?
          if (opt_v === undefined && typeof o == 'string') {
            // repurpose 'v'
            opt_v = this[0]
            if (!opt_v) return null
            if (opt_v === doc || opt_v === win) {
              p = (opt_v === doc) ? bonzo.doc() : bonzo.viewport()
              return o == 'width' ? p.width : o == 'height' ? p.height : ''
            }
            return (o = styleProperty(o)) ? getStyle(opt_v, o) : null
          }

          if (typeof o == 'string') {
            iter = {}
            iter[o] = opt_v
          }

          if (ie && iter.opacity) {
            // oh this 'ol gamut
            iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')'
            // give it layout
            iter.zoom = o.zoom || 1;
            delete iter.opacity;
          }

          function fn(el, p, v) {
            for (var k in iter) {
              if (iter.hasOwnProperty(k)) {
                v = iter[k];
                // change "5" to "5px" - unless you're line-height, which is allowed
                (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
                try { el.style[p] = setter(el, v) } catch(e) {}
              }
            }
          }
          return this.each(fn)
        }


        /**
         * @param {number=} opt_x
         * @param {number=} opt_y
         * @return {Bonzo|number}
         */
      , offset: function (opt_x, opt_y) {
          if (opt_x && typeof opt_x == 'object' && (typeof opt_x.top == 'number' || typeof opt_x.left == 'number')) {
            return this.each(function (el) {
              xy(el, opt_x.left, opt_x.top)
            })
          } else if (typeof opt_x == 'number' || typeof opt_y == 'number') {
            return this.each(function (el) {
              xy(el, opt_x, opt_y)
            })
          }
          if (!this[0]) return {
              top: 0
            , left: 0
            , height: 0
            , width: 0
          }
          var el = this[0]
            , de = el.ownerDocument.documentElement
            , bcr = el.getBoundingClientRect()
            , scroll = getWindowScroll()
            , width = el.offsetWidth
            , height = el.offsetHeight
            , top = bcr.top + scroll.y - Math.max(0, de && de.clientTop, doc.body.clientTop)
            , left = bcr.left + scroll.x - Math.max(0, de && de.clientLeft, doc.body.clientLeft)

          return {
              top: top
            , left: left
            , height: height
            , width: width
          }
        }


        /**
         * @return {number}
         */
      , dim: function () {
          if (!this.length) return { height: 0, width: 0 }
          var el = this[0]
            , de = el.nodeType == 9 && el.documentElement // document
            , orig = !de && !!el.style && !el.offsetWidth && !el.offsetHeight ?
               // el isn't visible, can't be measured properly, so fix that
               function (t) {
                 var s = {
                     position: el.style.position || ''
                   , visibility: el.style.visibility || ''
                   , display: el.style.display || ''
                 }
                 t.first().css({
                     position: 'absolute'
                   , visibility: 'hidden'
                   , display: 'block'
                 })
                 return s
              }(this) : null
            , width = de
                ? Math.max(el.body.scrollWidth, el.body.offsetWidth, de.scrollWidth, de.offsetWidth, de.clientWidth)
                : el.offsetWidth
            , height = de
                ? Math.max(el.body.scrollHeight, el.body.offsetHeight, de.scrollHeight, de.offsetHeight, de.clientHeight)
                : el.offsetHeight

          orig && this.first().css(orig)
          return {
              height: height
            , width: width
          }
        }

        // attributes are hard. go shopping

        /**
         * @param {string} k an attribute to get or set
         * @param {string=} opt_v the value to set
         * @return {Bonzo|string}
         */
      , attr: function (k, opt_v) {
          var el = this[0]
            , n

          if (typeof k != 'string' && !(k instanceof String)) {
            for (n in k) {
              k.hasOwnProperty(n) && this.attr(n, k[n])
            }
            return this
          }

          return typeof opt_v == 'undefined' ?
            !el ? null : specialAttributes.test(k) ?
              stateAttributes.test(k) && typeof el[k] == 'string' ?
                true : el[k] : (k == 'href' || k =='src') && features.hrefExtended ?
                  el[getAttribute](k, 2) : el[getAttribute](k) :
            this.each(function (el) {
              specialAttributes.test(k) ? (el[k] = setter(el, opt_v)) : el[setAttribute](k, setter(el, opt_v))
            })
        }


        /**
         * @param {string} k
         * @return {Bonzo}
         */
      , removeAttr: function (k) {
          return this.each(function (el) {
            stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
          })
        }


        /**
         * @param {string=} opt_s
         * @return {Bonzo|string}
         */
      , val: function (s) {
          return (typeof s == 'string') ?
            this.attr('value', s) :
            this.length ? this[0].value : null
        }

        // use with care and knowledge. this data() method uses data attributes on the DOM nodes
        // to do this differently costs a lot more code. c'est la vie
        /**
         * @param {string|Object=} opt_k the key for which to get or set data
         * @param {Object=} opt_v
         * @return {Bonzo|Object}
         */
      , data: function (opt_k, opt_v) {
          var el = this[0], o, m
          if (typeof opt_v === 'undefined') {
            if (!el) return null
            o = data(el)
            if (typeof opt_k === 'undefined') {
              each(el.attributes, function (a) {
                (m = ('' + a.name).match(dattr)) && (o[camelize(m[1])] = dataValue(a.value))
              })
              return o
            } else {
              if (typeof o[opt_k] === 'undefined')
                o[opt_k] = dataValue(this.attr('data-' + decamelize(opt_k)))
              return o[opt_k]
            }
          } else {
            return this.each(function (el) { data(el)[opt_k] = opt_v })
          }
        }

        // DOM detachment & related

        /**
         * @return {Bonzo}
         */
      , remove: function () {
          this.deepEach(clearData)
          return this.detach()
        }


        /**
         * @return {Bonzo}
         */
      , empty: function () {
          return this.each(function (el) {
            deepEach(el.childNodes, clearData)

            while (el.firstChild) {
              el.removeChild(el.firstChild)
            }
          })
        }


        /**
         * @return {Bonzo}
         */
      , detach: function () {
          return this.each(function (el) {
            el[parentNode] && el[parentNode].removeChild(el)
          })
        }

        // who uses a mouse anyway? oh right.

        /**
         * @param {number} y
         */
      , scrollTop: function (y) {
          return scroll.call(this, null, y, 'y')
        }


        /**
         * @param {number} x
         */
      , scrollLeft: function (x) {
          return scroll.call(this, x, null, 'x')
        }

    }


    function cloneNode(host, el) {
      var c = el.cloneNode(true)
        , cloneElems
        , elElems
        , i

      // check for existence of an event cloner
      // preferably https://github.com/fat/bean
      // otherwise Bonzo won't do this for you
      if (host.$ && typeof host.cloneEvents == 'function') {
        host.$(c).cloneEvents(el)

        // clone events from every child node
        cloneElems = host.$(c).find('*')
        elElems = host.$(el).find('*')

        for (i = 0; i < elElems.length; i++)
          host.$(cloneElems[i]).cloneEvents(elElems[i])
      }
      return c
    }

    function isBody(element) {
      return element === win || (/^(?:body|html)$/i).test(element.tagName)
    }

    function getWindowScroll() {
      return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
    }

    function createScriptFromHtml(html) {
      var scriptEl = document.createElement('script')
        , matches = html.match(simpleScriptTagRe)
      scriptEl.src = matches[1]
      return scriptEl
    }

    /**
     * @param {Array.<Element>|Element|Node|string} els
     * @return {Bonzo}
     */
    function bonzo(els) {
      return new Bonzo(els)
    }

    bonzo.setQueryEngine = function (q) {
      query = q;
      delete bonzo.setQueryEngine
    }

    bonzo.aug = function (o, target) {
      // for those standalone bonzo users. this love is for you.
      for (var k in o) {
        o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
      }
    }

    bonzo.create = function (node) {
      // hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
      return typeof node == 'string' && node !== '' ?
        function () {
          if (simpleScriptTagRe.test(node)) return [createScriptFromHtml(node)]
          var tag = node.match(/^\s*<([^\s>]+)/)
            , el = doc.createElement('div')
            , els = []
            , p = tag ? tagMap[tag[1].toLowerCase()] : null
            , dep = p ? p[2] + 1 : 1
            , ns = p && p[3]
            , pn = parentNode
            , tb = features.autoTbody && p && p[0] == '<table>' && !(/<tbody/i).test(node)

          el.innerHTML = p ? (p[0] + node + p[1]) : node
          while (dep--) el = el.firstChild
          // for IE NoScope, we may insert cruft at the begining just to get it to work
          if (ns && el && el.nodeType !== 1) el = el.nextSibling
          do {
            // tbody special case for IE<8, creates tbody on any empty table
            // we don't want it if we're just after a <thead>, <caption>, etc.
            if ((!tag || el.nodeType == 1) && (!tb || (el.tagName && el.tagName != 'TBODY'))) {
              els.push(el)
            }
          } while (el = el.nextSibling)
          // IE < 9 gives us a parentNode which messes up insert() check for cloning
          // `dep` > 1 can also cause problems with the insert() check (must do this last)
          each(els, function(el) { el[pn] && el[pn].removeChild(el) })
          return els
        }() : isNode(node) ? [node.cloneNode(true)] : []
    }

    bonzo.doc = function () {
      var vp = bonzo.viewport()
      return {
          width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
        , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
      }
    }

    bonzo.firstChild = function (el) {
      for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
        if (c[i].nodeType === 1) e = c[j = i]
      }
      return e
    }

    bonzo.viewport = function () {
      return {
          width: ie ? html.clientWidth : self.innerWidth
        , height: ie ? html.clientHeight : self.innerHeight
      }
    }

    bonzo.isAncestor = 'compareDocumentPosition' in html ?
      function (container, element) {
        return (container.compareDocumentPosition(element) & 16) == 16
      } : 'contains' in html ?
      function (container, element) {
        return container !== element && container.contains(element);
      } :
      function (container, element) {
        while (element = element[parentNode]) {
          if (element === container) {
            return true
          }
        }
        return false
      }

    return bonzo
  }); // the only line we care about using a semi-colon. placed here for concatenation tools

  if (typeof provide == "function") provide("bonzo", module.exports);

  (function ($) {

    var b = require('bonzo')
    b.setQueryEngine($)
    $.ender(b)
    $.ender(b(), true)
    $.ender({
      create: function (node) {
        return $(b.create(node))
      }
    })

    $.id = function (id) {
      return $([document.getElementById(id)])
    }

    function indexOf(ar, val) {
      for (var i = 0; i < ar.length; i++) if (ar[i] === val) return i
      return -1
    }

    function uniq(ar) {
      var r = [], i = 0, j = 0, k, item, inIt
      for (; item = ar[i]; ++i) {
        inIt = false
        for (k = 0; k < r.length; ++k) {
          if (r[k] === item) {
            inIt = true; break
          }
        }
        if (!inIt) r[j++] = item
      }
      return r
    }

    $.ender({
      parents: function (selector, closest) {
        if (!this.length) return this
        if (!selector) selector = '*'
        var collection = $(selector), j, k, p, r = []
        for (j = 0, k = this.length; j < k; j++) {
          p = this[j]
          while (p = p.parentNode) {
            if (~indexOf(collection, p)) {
              r.push(p)
              if (closest) break;
            }
          }
        }
        return $(uniq(r))
      }

    , parent: function() {
        return $(uniq(b(this).parent()))
      }

    , closest: function (selector) {
        return this.parents(selector, true)
      }

    , first: function () {
        return $(this.length ? this[0] : this)
      }

    , last: function () {
        return $(this.length ? this[this.length - 1] : [])
      }

    , next: function () {
        return $(b(this).next())
      }

    , previous: function () {
        return $(b(this).previous())
      }

    , related: function (t) {
        return $(b(this).related(t))
      }

    , appendTo: function (t) {
        return b(this.selector).appendTo(t, this)
      }

    , prependTo: function (t) {
        return b(this.selector).prependTo(t, this)
      }

    , insertAfter: function (t) {
        return b(this.selector).insertAfter(t, this)
      }

    , insertBefore: function (t) {
        return b(this.selector).insertBefore(t, this)
      }

    , clone: function () {
        return $(b(this).clone(this))
      }

    , siblings: function () {
        var i, l, p, r = []
        for (i = 0, l = this.length; i < l; i++) {
          p = this[i]
          while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
          p = this[i]
          while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
        }
        return $(r)
      }

    , children: function () {
        var i, l, el, r = []
        for (i = 0, l = this.length; i < l; i++) {
          if (!(el = b.firstChild(this[i]))) continue;
          r.push(el)
          while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
        }
        return $(uniq(r))
      }

    , height: function (v) {
        return dimension.call(this, 'height', v)
      }

    , width: function (v) {
        return dimension.call(this, 'width', v)
      }
    }, true)

    /**
     * @param {string} type either width or height
     * @param {number=} opt_v becomes a setter instead of a getter
     * @return {number}
     */
    function dimension(type, opt_v) {
      return typeof opt_v == 'undefined'
        ? b(this).dim()[type]
        : this.css(type, opt_v)
    }
  }(ender));
}());