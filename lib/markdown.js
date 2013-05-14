var marked = require('marked'),
    _      = require('lodash'),
    hljs   = require('highlight.js'),
    fs     = require('fs');

module.exports.render = function (filename, options /* optional */, callback) {
  options = options || {};
  if (arguments.length === 2) {
    callback = arguments[1];
    options = {};
  }

  var defaultOptions = {
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    langPrefix: 'lang-',
    highlight: function(code, lang) {
      return lang ? hljs.highlight(lang, code).value : code;
    }
  };
  marked.setOptions(_.merge(defaultOptions, options));
  fs.readFile(filename, function (err, data) {
    if (err) callback(err, null);
    var html = marked(data.toString());
    callback(null, html);
  });
};
