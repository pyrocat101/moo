(function() {
  var Moo, colors, commander, config, configure, error, examples, exportHtml, express, fs, highlight, jade, marked, open, parse, path, preview, run, serve, timeLog, version, warn, watch, _,
    __slice = [].slice;

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

  highlight = require('highlight.js').highlight;

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
      return error('expect one input file');
    } else {
      return serve();
    }
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
        var content, text;

        if (err) {
          error(err.message);
          throw err;
        }
        text = buffer.toString();
        content = parse(source, text);
        return res.json(content);
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

  exportHtml = function(options) {
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
        var content, text;

        if (err) {
          throw err;
        }
        text = buffer.toString();
        content = parse(source, text);
        write(source, content);
        if (files.length) {
          return nextFile();
        }
      });
    };
    return nextFile();
  };

  parse = function(source, text) {
    var first, hasTitle, html, stripFrontmatter, title, tokens;

    title = path.basename(source);
    hasTitle = false;
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
    tokens = marked.lexer(text);
    if (!hasTitle) {
      first = tokens[0];
      if (first && first.type === 'heading' && first.depth === 1) {
        title = first.text;
      }
    }
    html = marked.parser(tokens);
    return {
      title: title,
      html: html
    };
  };

  config = {
    layout: 'github',
    port: 0
  };

  configure = function(options) {
    _.extend(config, _.pick.apply(_, [options].concat(__slice.call(_.keys(config)))));
    config.resources = "" + __dirname + "/resources";
    config.layout = "" + config.resources + "/" + config.layout;
    return config.sources = options.args.sort();
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
    }).option('-e, --export', 'export mode').option('-l, --layout <name>', 'choose a layout (github or docco)', c.layout).option('-p, --port <port>', 'server port (default: random)', parseInt, c.port).option('--pandoc', 'use pandoc markdown converter').parse(args).name = "moo";
    if (commander.args.length) {
      marked.setOptions({
        highlight: function(code, lang) {
          if (lang != null) {
            return highlight(lang, code).value;
          }
          return code;
        }
      });
      if (commander["export"]) {
        return exportHtml(commander);
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
    exportHtml: exportHtml,
    parse: parse
  };

}).call(this);
