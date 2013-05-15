rs   = require 'robotskirt'
hljs = require 'highlight.js'
fs   = require 'fs'

renderer = new rs.HtmlRenderer [rs.HTML_TOC]
# codeblock syntax highlight
# TODO: try Pygments?
renderer.blockcode = (code, lang) ->
  unless lang?
    # no language was provided, don't highlight
    "<pre>#{rs.houdini.escapeHTML(code)}</pre>"
  else
    "<pre>#{hljs.highlight(lang, code)}</pre>"

rendererOptions = [
  rs.EXT_FENCED_CODE
  rs.EXT_NO_INTRA_EMPHASIS
  rs.EXT_AUTOLINK
  rs.EXT_STRIKETHROUGH
  rs.EXT_LAX_HTML_BLOCKS
  rs.EXT_SUPERSCRIPT
  rs.EXT_TABLES
]
parser = new rs.Markdown renderer, rendererOptions

module.exports.render = (filename, options={}, callback) ->
  # `options` is optional
  if arguments.length is 2
    callback = arguments[1]
    options = {}

  fs.readFile filename, (err, data) ->
    if err then callback err, null
    html = rs.smartypantsHtml(parser.render(data.toString()))
    callback null, html
