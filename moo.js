(function() {
  var Moo, colors, commander, config, configure, error, examples, exports, express, fs, hljs, init, jade, marked, open, pandoc, parse, path, preview, run, serve, timeLog, version, warn, watch, _,
    __slice = [].slice,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  express = require('express');

  path = require('path');

  fs = require('fs');

  jade = require('jade');

  open = require('open');

  colors = require('colors');

  marked = require('marked');

  commander = require('commander');

  _ = require('lodash');

  watch = require('chokidar').watch;

  hljs = require('highlight.js');

  error = function(msg) {
    return console.error(("" + 'error'.red + " - " + msg).bold);
  };

  warn = function(msg) {
    return console.warn(("" + 'warning'.magenta + " - " + msg).bold);
  };

  timeLog = function(msg) {
    return console.log("" + ((new Date).toLocaleTimeString()) + " - " + msg);
  };

  preview = function(options) {
    if (options == null) {
      options = {};
    }
    configure(options);
    if (config.sources.length !== 1) {
      error('expect one input file');
    }
    return serve();
  };

  serve = function() {
    var app, listen, server, source;

    source = config.sources[0];
    server = null;
    app = express();
    app.set('views', config.layout);
    app.set('view engine', 'jade');
    app.use(express.errorHandler());
    app.use('/', express["static"](path.dirname(fs.realpathSync(source))));
    app.use('/__moo__', express["static"](config.resources));
    app.get('/', function(req, res) {
      return res.render('index.jade');
    });
    app.get('/content', function(req, res) {
      return fs.readFile(source, function(err, buffer) {
        var text;

        if (err) {
          error(err.message);
          throw err;
        }
        text = buffer.toString();
        return parse(source, text, function(err, content) {
          if (err) {
            console.error(err);
            throw err;
          }
          return res.json(content);
        });
      });
    });
    app.get('/update-event', function(req, res) {
      var watcher;

      req.socket.setTimeout(0);
      res.socket.setTimeout(0);
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });
      watcher = watch(source, {
        persistent: true
      });
      watcher.on('change', function() {
        timeLog("changed: " + source);
        return res.write('data: updated\n\n');
      });
      watcher.on('unlink', function() {
        error("removed: " + source);
        watcher.close();
        return server.close();
      });
      watcher.on('error', function(err) {
        error(err.message);
        throw err;
      });
      return res.on('close', function() {
        return watcher.close();
      });
    });
    listen = function(port) {
      var url;

      server = app.listen(port);
      url = "http://localhost:" + (server.address().port);
      console.log("Server listening at " + url.blue.bold + ". Press Ctrl-C to stop.");
      open(url);
      return server;
    };
    return listen(config.port);
  };

  exports = function(options) {
    var files, nextFile, template, write;

    if (options == null) {
      options = {};
    }
    configure(options);
    template = "" + config.layout + "/export.jade";
    template = jade.compile(fs.readFileSync(template), {
      filename: template
    });
    files = config.sources.slice();
    write = function(source, content) {
      var destination, html;

      destination = function(file) {
        return path.join(path.dirname(file), path.basename(file, path.extname(file)) + '.html');
      };
      html = template(content);
      console.log("moo: " + source + " -> " + (destination(source)));
      return fs.writeFileSync(destination(source), html);
    };
    nextFile = function() {
      var source;

      source = files.shift();
      return fs.readFile(source, function(err, buffer) {
        var text;

        if (err) {
          throw err;
        }
        text = buffer.toString();
        return parse(source, text, function(err, content) {
          if (err) {
            throw err;
          }
          write(source, content);
          if (files.length) {
            return nextFile();
          }
        });
      });
    };
    return nextFile();
  };

  parse = function(source, text, cb) {
    var first, hasTitle, html, stripFrontmatter, title, tokens;

    title = path.basename(source);
    hasTitle = false;
    if (config.pandoc) {
      return pandoc(title, text, cb);
    }
    stripFrontmatter = function() {
      var mainmatter, match;

      if (/^-{3}\n/.test(text)) {
        mainmatter = text.split('---\n');
        mainmatter.shift();
        if (mainmatter.length >= 2) {
          match = /(?:^|\n)title:\s*(.+)/i.exec(mainmatter.shift());
          if (match) {
            hasTitle = true;
            title = match[1];
          }
          return text = mainmatter.join('---\n');
        }
      }
    };
    stripFrontmatter();
    tokens = marked.lexer(text);
    if (!hasTitle) {
      first = tokens[0];
      if (first && first.type === 'heading' && first.depth === 1) {
        title = first.text;
      }
    }
    html = marked.parser(tokens);
    return cb(null, {
      title: title,
      html: html
    });
  };

  pandoc = function(title, text, cb) {
    var options, pdc;

    pdc = require('pdc');
    options = ['--highlight-style', 'pygments'];
    return pdc(text, 'markdown', 'html', options, function(err, result) {
      if (err) {
        return cb(err, null);
      } else {
        return cb(null, {
          title: title,
          html: result
        });
      }
    });
  };

  config = {
    layout: 'github',
    port: 0,
    pandoc: false
  };

  configure = function(options) {
    _.extend(config, _.pick.apply(_, [options].concat(__slice.call(_.keys(config)))));
    config.resources = "" + __dirname + "/resources";
    config.layout = "" + config.resources + "/" + config.layout;
    return config.sources = options.args.sort();
  };

  init = function() {
    var highlight, l, languages;

    languages = (function() {
      var _results;

      _results = [];
      for (l in hljs.LANGUAGES) {
        _results.push(l);
      }
      return _results;
    })();
    highlight = hljs.highlight;
    return marked.setOptions({
      smartypants: true,
      highlight: function(code, lang) {
        if (__indexOf.call(languages, lang) >= 0) {
          return highlight(lang, code).value;
        }
        return code;
      }
    });
  };

  examples = ["  Examples:", "", "  - preview:".yellow.bold, "    + live preview markdown in the web browser", "    + example: " + '$ moo README.md'.cyan.bold, "  - export:".yellow.bold, "    + export markdown files to html docs", "    + example: " + '$ moo -e ch1.md ch2.md ch3.md'.cyan.bold, ""].join('\n');

  version = JSON.parse(fs.readFileSync("" + __dirname + "/package.json")).version;

  run = function(args) {
    var c;

    if (args == null) {
      args = process.argv;
    }
    c = config;
    commander.version(version).usage('[options] files').on('--help', function() {
      return console.log(examples);
    }).option('-e, --export', 'export mode').option('-p, --port <port>', 'server port (default: random)', parseInt, c.port).option('--pandoc', 'use pandoc markdown converter').parse(args).name = "moo";
    if (commander.args.length) {
      init();
      if (commander["export"]) {
        return exports(commander);
      } else {
        return preview(commander);
      }
    } else {
      return console.log(commander.helpInformation());
    }
  };

  Moo = module.exports = {
    run: run,
    preview: preview,
    exports: exports,
    parse: parse
  };

}).call(this);
