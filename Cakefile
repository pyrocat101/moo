flour  = require 'flour'
fs     = require 'fs'
path   = require 'path'
mime   = require 'mime'
glob   = require 'glob'
colors = require 'colors'

embedAssets = (css) ->
  dir = path.dirname css
  css = fs.readFileSync css, 'utf-8'
  url = /url\s?\(['"]?(.*?)(?=['"]?\))/gi

  while (match = url.exec css)
    asset = path.join dir, match[1]
    try
      type = mime.lookup asset
      asset = fs.readFileSync asset, 'base64'
      css = css.replace match[1], "data:#{type};base64,#{asset}"
    catch e
      console.error "Asset not found: #{asset.red}".bold
  return css

flour.minifiers['css'] = (file, cb) ->
  csso = require 'csso'
  css = embedAssets file.path
  css = csso.justDoIt css
  cb css

task 'build:coffee', ->
  compile 'moo.coffee', 'moo.js'

task 'build:css', ->
  glob 'resources/*/style.css', (err, files) ->
    files.forEach (file) ->
      min = "#{path.dirname(file)}/#{path.basename(file, '.css')}.min.css"
      minify file, min

task 'build', ->
  invoke 'build:coffee'
  invoke 'build:css'

task 'watch', ->
  invoke 'build:coffee'
  invoke 'build:css'

  watch 'moo.coffee', -> invoke 'build:coffee'
  watch 'resources/*/style.css', -> invoke 'build:css'
