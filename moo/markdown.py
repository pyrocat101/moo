"""
Copyright (c) 2013 metaphysiks

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

import logging
import misaka
import pygments
from cgi import escape as escape_html
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter

__all__ = ['to_html']

# misaka renderer extensions
RENDER_EXTENSIONS = misaka.EXT_FENCED_CODE | \
                    misaka.EXT_NO_INTRA_EMPHASIS | \
                    misaka.EXT_AUTOLINK | \
                    misaka.EXT_STRIKETHROUGH | \
                    misaka.EXT_LAX_HTML_BLOCKS | \
                    misaka.EXT_SUPERSCRIPT | \
                    misaka.EXT_TABLES
# misaka HTML flags
HTML_FLAGS = misaka.HTML_TOC

class HtmlRenderer(misaka.HtmlRenderer, misaka.SmartyPants):
    def block_code(self, text, lang):
        if not lang:
            return '\n<pre><code>%s</code></pre>\n' % \
                escape_html(text.strip())
        lexer = get_lexer_by_name(lang, stripall=True)
        formatter = HtmlFormatter()
        return pygments.highlight(text, lexer, formatter)

markdown = misaka.Markdown(HtmlRenderer(HTML_FLAGS), RENDER_EXTENSIONS)

def to_html(filename):
    try:
        with open(filename) as f:
            content = f.read()
            # TODO charset detect
            content = content.decode('utf-8')
            content = markdown.render(content)
            return content
    except IOError, e:
        logging.error(e.strerror)
        raise e
