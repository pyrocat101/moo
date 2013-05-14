var express  = require('express'),
    _        = require('lodash'),
    path     = require('path'),
    util     = require('util'),
    fs       = require('fs'),
    markdown = require('./markdown'),
    jade     = require('jade');

var DEFAULT_PORT = module.exports.DEFAULT_PORT = 7777;

var Server = function (markup) {
  var app = this.app = express();

  if (_.isString(markup)) {
    markup = new Markup(markup);
  }

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  // environment-specific configuration
  app.configure('development', function() {
    app.use(express.errorHandler({ dumpException: true, showStack: true }));
    app.set('view options', { pretty: true });
  });
  app.configure('production', function () {
    app.use(express.errorHandler());
  });

  // index
  app.get('/', function (req, res) {
    markup.timestamp(function (err, ts) {
      if (err) {
        console.error(err);
        // FIXME: have a try
        // res.status(500).send(err.toString());
        throw err;
      }
      markup.html(function (err, html) {
        if (err) {
          console.error(err);
          throw err;
        }
        res.render('index', {
          title: markup.title,
          timestamp: ts,
          html: html
        });
      });
    });
  });
  // close server
  app.del('/', function () {
    app.close();
  });
  // async update content
  app.post('/update', function (req, res) {
    var timestamp = req.body.timestamp;
    if (!timestamp) {
      res.status(400).send('malformed JSON');
    }
    markup.timestamp(function (err, ts) {
      if (err) {
        console.log('xxxxx');
        console.error(err);
        // FIXME: have a try
        // res.status(500).send(err.toString());
        throw err;
      }
      var ret = {
        title: markup.title,
        timestamp: ts,
        html: null
      };
      if (ts === timestamp) {
        res.json(ret);
      } else {
        console.log("detected file change");
        markup.html(function (err, html) {
          if (err) {
            console.error(err);
            throw err;
          }
          ret.html = html;
          res.json(ret);
        });
      }
    });
  });
  // handle styles
  app.use('/static', express.static(__dirname + '/static'));
  // handle user-defined static assets
  // app.use('/', express.static(path.dirname(markup.path)));
};

Server.prototype.listen = function (port) {
  console.log("Server listening at " + (port || DEFAULT_PORT));
  this.app.listen(port || DEFAULT_PORT);
};

Server.prototype.close = function() {
  this.app.close();
};

module.exports.Server = Server;

var Markup = function (filename, input) {
  if (!fs.existsSync(filename)) {
    throw new Error("input file '" + filename + "' doesn't exist");
  }
  this.filename = filename = path.resolve(process.cwd(), filename);
  this.title = util.format('%s - %s',
                           path.basename(filename),
                           path.dirname(filename));
};

Markup.prototype.timestamp = function (callback) {
  fs.stat(this.filename, function (err, stat) {
    if (err) callback(err, null);
    callback(null, stat.mtime.getTime());
  });
};

Markup.prototype.html = function (callback) {
  _.forOwn(Markup.ftdetects, function (detect, name) {
    if ((detect.test && detect.test(this.filename)) || detect(this.filename)) {
      var options = Markup.rendererOptions[name];
      Markup.renderers[name](this.filename, options, callback);
      found = true;
      return false;
    }
  }, this);
  if (!found) {
    callback(new Error('renderer not found'), null);
  }
};

Markup.prototype.export = function () {
  if (!this.exportTemplate) {
    this.exportTemplate = fs.readFileSync(__dirname + '/views/export.jade');
  }
  var render = jade.compile(this.exportTemplate);
  return render({ html: this.html() });
};

// // utility method
// Markup.export = function (input) {
//   var exportTemplate = fs.readFileSync(__dirname + '/views/export.jade');
//   return jade.compile()
// }

Markup.ftdetects = {
  'markdown': /\.(markdown|md|mdown|mkd|mkdn)$/
};

Markup.renderers = {
  'markdown': markdown.render
};

Markup.rendererOptions = {};

module.exports.Markup = Markup;
