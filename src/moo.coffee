express  = require 'express'
path     = require 'path'
util     = require 'util'
fs       = require 'fs'
jade     = require 'jade'
chokidar = require 'chokidar'

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
      app.use express.errorHandler {dumpException: true, showStack: true}
      app.set 'view options', {pretty: true}
    app.configure 'production', ->
      app.use express.errorHandler()

    # index
    app.get '/', (req, res) ->
      res.render 'index'
    # close server programmatically
    app.del '/', (req, res) =>
      res.send 'bye'
      @close()
    # update event stream
    app.get '/update-event', (req, res) =>
      # let request last as long as possible
      req.socket.setTimeout Infinity
      res.set {
        'Content-Type': 'text/event-stream'
        'Cache-Control': 'no-cache'
        'Connection': 'keep-alive'
      }
      markup.watch (err) ->
        if err
          console.error err
        else
          console.log "Detected file change in #{path.basename(markup.filename)}"
          res.write 'data: updated\n\n'
      res.on 'close', -> markup.unwatch()
    # rendered content
    app.get '/content', (req, res) ->
      markup.html (err, html) ->
        if err
          console.error err
          throw err
        res.json {title: markup.title, html: html}

  listen: (port=DEFAULT_PORT) ->
    console.log "Server listening at #{port}"
    @server = @app.listen port

  close: -> @server.close()

module.exports.Server = Server

class Markup
  # wrapper object for files written in markup language
  constructor: (filename) ->
    unless fs.existsSync filename
      throw new Error "input file '#{filename}' doesn't exist"
    @filename = filename = path.resolve(process.cwd(), filename)
    @title = "#{path.basename(filename)} - #{path.dirname(filename)}"

  # returns {title: title, html: html}
  html: (callback) ->
    found = false
    for own name, detect of Markup.ftdetects
      if (isRegExp(detect) and detect.test(@filename)) or detect(@filename)
        options = Markup.rendererOptions[name]
        render = Markup.renderers[name]
        fs.readFile @filename, (err, data) =>
          if err
            callback err, null
          else
            # try to strip YAML front-matter
            data = @_stripYAMLFrontmatter data
            callback null, render(data)
        found = true
    unless found then callback new Error('renderer not found'), null

  export: ->
    unless @exportTemplate?
      @exportTemplate = fs.readFileSync(__dirname + '/views/export.jade')
    render = jade.compile @exportTemplate
    render @html()

  watch: (callback) ->
    @watcher = watcher = chokidar.watch @filename, {persistent: true}
    watcher
      .on('change', -> callback())
      .on('unlink', => callback new Error "File #{@filename} has been removed")
      .on('error', callback)

  unwatch: -> @watcher.close()

  _stripYAMLFrontmatter: (source) ->
    source = source.toString()
    if /^-{3}\n/.test source
      content = source.split('---\n')
      content.shift()
      if content.length >= 2
        match = /(?:^|\n)title:\s*(.+)/i.exec content.shift()
        if match then @title = match[1]
        return content.join '---\n'
    return source

Markup.ftdetects =
  'markdown': /\.(markdown|md|mdown|mkd|mkdn)$/

Markup.renderers =
  'markdown': require('./markdown').render

Markup.rendererOptions = {}

module.exports.Markup = Markup
