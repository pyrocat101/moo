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
