express = require 'express'
path    = require 'path'
util    = require 'util'
fs      = require 'fs'
jade    = require 'jade'

module.exports.DEFAULT_PORT = DEFAULT_PORT = 7777

isString = (obj) -> Object::toString.call(obj) is '[object String]'
isRegExp = (obj) -> Object::toString.call(obj) is '[object RegExp]'

class Server
  # construct a server for a markup object or markup filename
  constructor: (markup) ->
    @app = app = express()
    markup = new Markup(markup) if isString markup

    app.set 'views', __dirname + '/views'
    app.set 'view engine', 'jade'
    app.use express.bodyParser()

    # static files
    app.use '/static', express.static(__dirname + '/static')

    # environment-specific
    app.configure 'development', ->
      app.use express.errorHandler { dumpException: true, showStack: true }
      app.set 'view options', { pretty: true }
    app.configure 'production', ->
      app.use express.errorHandler()

    # index
    app.get '/', (req, res) ->
      markup.timestamp (err, ts) ->
        if err
          console.error err
          throw err
        markup.html (err, html) ->
          if err
            console.error err
            throw err
          res.render 'index',
            title: markup.title
            timestamp: ts
            html: html
    # close server programmatically
    app.del '/', -> app.close()
    # async content update
    app.post '/update', (req, res) ->
      timestamp = req.body.timestamp
      unless timestamp? then res.send 400, 'malformed JSON'
      markup.timestamp (err, ts) ->
        if err
          console.error err
          throw err
        ret =
          title: markup.title
          timestamp: ts
          html: null
        if ts is timestamp
          res.json ret
        else
          console.log 'detected file change'
          markup.html (err, html) ->
            if err
              console.error(err);
              throw err;
            ret.html = html
            res.json ret

  listen: (port=DEFAULT_PORT) ->
    console.log "Server listening at #{port}"
    @app.listen port

  close: -> @app.close()

module.exports.Server = Server

class Markup
  # wrapper object for files written in markup language
  constructor: (filename) ->
    unless fs.existsSync filename
      throw new Error "input file '#{filename}' doesn't exist"
    @filename = filename = path.resolve(process.cwd(), filename)
    @title = "#{path.basename(filename)} - #{path.dirname(filename)}"

  timestamp: (callback) ->
    fs.stat @filename, (err, stat) ->
      if err then callback err, null
      callback null, stat.mtime.getTime()

  html: (callback) ->
    found = false
    for own name, detect of Markup.ftdetects
      if (isRegExp(detect) and detect.test(@filename)) or detect(@filename)
        options = Markup.rendererOptions[name]
        Markup.renderers[name](@filename, options, callback)
        found = true
    unless found then callback new Error('renderer not found'), null

  export: ->
    unless @exportTemplate?
      @exportTemplate = fs.readFileSync(__dirname + '/views/export.jade')
    render = jade.compile @exportTemplate
    render { html: @html() }

Markup.ftdetects =
  'markdown': /\.(markdown|md|mdown|mkd|mkdn)$/

Markup.renderers =
  'markdown': require('./markdown').render

Markup.rendererOptions = {}

module.exports.Markup = Markup
