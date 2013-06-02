express     = require 'express'
path        = require 'path'
fs          = require 'fs'
jade        = require 'jade'
open        = require 'open'
colors      = require 'colors'
marked      = require 'marked'
commander   = require 'commander'
_           = require 'lodash'
{watch}     = require 'chokidar'
{highlight} = require 'highlight.js'

error   = (msg) -> console.error "#{'error'.red} - #{msg}".bold
warn    = (msg) -> console.warn  "#{'warning'.magenta} - #{msg}".bold
timeLog = (msg) -> console.log   "#{(new Date).toLocaleTimeString()} - #{msg}"

preview = (options = {}) ->
  configure options

  unless config.sources.length is 1
    error 'expect one input file'
  else
    serve()

serve = ->
  source  = config.sources[0]
  server  = null

  # config server
  app = express()
  app.set 'views', config.layout
  app.set 'view engine', 'jade'
  app.use express.errorHandler()

  # static files
  app.use '/', express.static(path.dirname(fs.realpathSync(source)))
  app.use '/__moo__', express.static(config.resources)

  # routers
  app.get '/', (req, res) -> res.render 'index.jade'

  app.get '/content', (req, res) ->
    fs.readFile source, (err, buffer) ->
      if err
        error err.message
        throw err

      text = buffer.toString()
      content = parse source, text
      res.json content

  app.get '/update-event', (req, res) ->
    # let socket alive as long as possible
    req.socket.setTimeout 0
    res.socket.setTimeout 0

    res.set
      'Content-Type': 'text/event-stream'
      'Cache-Control': 'no-cache'
      'Connection': 'keep-alive'

    watcher = watch source, persistent: true

    watcher.on 'change', ->
      timeLog "changed: #{source}"
      res.write 'data: updated\n\n'
    watcher.on 'unlink', ->
      error "removed: #{source}"
      watcher.close()
      # FIXME: test
      # res.end()
      server.close()
    watcher.on 'error', (err) ->
      error err.message
      throw err

    res.on 'close', -> watcher.close()

  listen = (port) ->
    server = app.listen port
    url = "http://localhost:#{server.address().port}"
    console.log "Server listening at #{url.blue.bold}. Press Ctrl-C to stop."
    # open URL in browser
    open url
    server

  return listen(config.port)

exportHtml = (options = {}) ->
  configure options

  template = "#{config.layout}/export.jade"
  template = jade.compile fs.readFileSync(template), filename: template

  files = config.sources.slice()

  write = (source, content) ->
    destination = (file) ->
      path.join(path.dirname(file), path.basename(file, path.extname(file)) + '.html')
    html = template content

    console.log "moo: #{source} -> #{destination source}"
    fs.writeFileSync destination(source), html

  nextFile = ->
    source = files.shift()
    fs.readFile source, (err, buffer) ->
      throw err if err

      text = buffer.toString()
      content = parse source, text
      write source, content
      nextFile() if files.length

  nextFile()

parse = (source, text) ->
  title = path.basename source
  hasTitle = false

  # strip YAML font-matter
  stripFrontmatter = ->
    if /^-{3}\n/.test text
      mainmatter = text.split('---\n')
      mainmatter.shift()
      if mainmatter.length >= 2
        match = /(?:^|\n)title:\s*(.+)/i.exec mainmatter.shift()
        if match
          hasTitle = true
          title = match[1]
        text = mainmatter.join '---\n'

  # FIXME: pandoc support
  tokens = marked.lexer text
  unless hasTitle
    first = tokens[0]
    if first and first.type is 'heading' and first.depth is 1
      title = first.text

  # FIXME: code highlight
  html = marked.parser tokens

  title: title, html: html

config =
  layout: 'github'
  port:   0

configure = (options) ->
  _.extend config, _.pick(options, _.keys(config)...)

  config.resources = "#{__dirname}/resources"
  config.layout    = "#{config.resources}/#{config.layout}"
  config.sources   = options.args.sort()

examples = [
  "  Examples:"
  ""
  "  - preview:".yellow.bold
  "    + live preview markdown in the web browser"
  "    + example: #{'$ moo README.md'.cyan.bold}"
  "  - export:".yellow.bold
  "    + export markdown files to html docs"
  "    + example: #{'$ moo -e ch1.md ch2.md ch3.md'.cyan.bold}"
  ""
].join('\n')
version = JSON.parse(fs.readFileSync("#{__dirname}/package.json")).version

run = (args = process.argv) ->
  c = config
  commander.version(version)
    .usage('[options] files')
    .on('--help', -> console.log examples)
    .option('-e, --export', 'export mode')
    .option('-l, --layout <name>', 'choose a layout (github or docco)', c.layout)
    .option('-p, --port <port>', 'server port (default: random)', parseInt, c.port)
    .option('--pandoc', 'use pandoc markdown converter')
    .parse(args)
    .name = "moo"

  if commander.args.length
    marked.setOptions
      smartypants: true
      highlight: (code, lang) ->
        if lang?
          return highlight(lang, code).value
        return code
    if commander.export then exportHtml(commander) else preview(commander)
  else
    console.log commander.helpInformation()

# public API
Moo = module.exports = {run, preview, exportHtml, parse}
