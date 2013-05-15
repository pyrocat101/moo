rs   = require 'robotskirt'
hljs = require 'highlight.js'
fs   = require 'fs'

renderer = new rs.HtmlRenderer [rs.HTML_TOC]
# codeblock syntax highlight
# TODO: try Pygments?
renderer.blockcode = (code, lang) ->
  unless lang?
    # no language was provided, don't highlight
    "<pre><code>#{rs.houdini.escapeHTML(code)}</code></pre>"
  else
    "<pre><code>#{hljs.highlight(lang, code).value}</code></pre>"

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

module.exports.render = (data, options={}) ->
  return rs.smartypantsHtml parser.render(data.toString())
