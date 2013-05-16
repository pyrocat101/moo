fs    = require 'fs'
path  = require 'path'
{spawn, exec} = require 'child_process'

# ANSI Terminal Colors.
bold = red = green = reset = ''
unless process.env.NODE_DISABLE_COLORS
  bold  = '\x1B[0;1m'
  red   = '\x1B[0;31m'
  green = '\x1B[0;32m'
  reset = '\x1B[0m'

# Log a message with a color.
log = (message, color, explanation) ->
  console.log color + message + reset + ' ' + (explanation or '')

embedImages = (cssPath) ->
  imgRegex = /url\s?\(['"]?(.*?)(?=['"]?\))/gi
  css = fs.readFileSync cssPath, 'utf-8'
  while (match = imgRegex.exec css)
    imgPath = path.join path.dirname(cssPath), match[1]
    try
      img = fs.readFileSync imgPath, 'base64'
      ext = imgPath.substr imgPath.lastIndexOf('.') + 1
      css = css.replace match[1], "data:image/#{ext};base64,#{img}"
    catch e
      log "Image not found (%s)", red
  return css

compressCSS = (css) ->
  css
    .replace(/\s+/g, ' ')
    .replace(/:\s+/g, ':')
    .replace(/\/\*.*?\*\//g, '')
    .replace(/\} /g, '}')
    .replace(/[ ]\{/g, '{')
    .replace(/; /g, ';')
    .replace(/\n+/g, '')

task 'build:css', 'compress and pack CSS (images encoded into data-URIs)', ->
  css = './lib/static/github.css'
  min = "#{path.dirname(css)}/#{path.basename(css, '.css')}.min.css"
  data = compressCSS embedImages(css)
  fs.writeFile min, data

ender    = path.join process.cwd(), 'node_modules/.bin/ender'
enderPkg = 'qwery domready reqwest bonzo'
app      = 'app.js'
optLevel = 'whitespace'

task 'build:js', 'minify client-side scripts', ->
  process.chdir './lib/static'
  exec "#{ender} build #{enderPkg}", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr
  exec "#{ender} compile #{app} --level #{optLevel}", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr

coffeeBin = path.join process.cwd(), 'node_modules/.bin/coffee'

task 'build', 'build source from src/*.coffee to lib/*.js', ->
  exec "#{coffeeBin} -co lib/ src/", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr

task 'watch', 'continually build source with --watch', ->
  coffee = spawn coffeeBin, ['-cw', '-o', 'lib', 'src']
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()
  coffee.stderr.on 'data', (data) -> console.log data.toString().trim()
