#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
	moo
	~~~

	Moo is a mini markdown render server that provides preview of markdown 
	files. It can automatically reload the preview in your broswer when the 
	monitored file changes, which makes it suitable to live preview markdown
	in editors that does not provide this feature. Plugins can be
	easily written to interface with it.

"""

import flask, misaka, sys, pygments, os, time, getopt
from cgi import escape as escape_html
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter

__version__ = '0.1.2'

app = flask.Flask(__name__)

class MarkedRenderer(misaka.HtmlRenderer, misaka.SmartyPants):
    def block_code(self, text, lang):
        if not lang:
            return '\n<pre><code>%s</code></pre>\n' % \
                escape_html(text.strip())
        lexer = get_lexer_by_name(lang, stripall=True)
        formatter = HtmlFormatter()
        return pygments.highlight(text, lexer, formatter)

md = misaka.Markdown(MarkedRenderer(),
            extensions=misaka.EXT_FENCED_CODE |
                       misaka.EXT_NO_INTRA_EMPHASIS |
                       misaka.EXT_AUTOLINK |
                       misaka.EXT_STRIKETHROUGH |
                       misaka.EXT_LAX_HTML_BLOCKS |
                       misaka.EXT_SUPERSCRIPT |
                       misaka.HTML_HARD_WRAP |
                       misaka.EXT_TABLES |
                       misaka.HTML_USE_XHTML)

def reloader(filename, interval):
    # TODO cache
    mtime = None
    while True:
        try:
            new_time = os.stat(filename).st_mtime
        except OSError:
            # TODO exit reloader
            continue

        if mtime is None:
            mtime = new_time
            continue
        elif new_time > mtime:
            mtime = new_time
            yield 'data: updated\n\n'
            print 'Detected file change in %s' % filename
        time.sleep(interval)

def render_md(filename):
    try:
        source = open(filename, 'r')
        return md.render(source.read())
    except IOError, ex:
        app.logger.error(ex.strerror)
    finally:
        source.close()

def shutdown_server():
    func = flask.request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()

@app.route('/', methods=['GET', 'DELETE'])
def index():
    if flask.request.method == 'DELETE':
        shutdown_server()
        return 'Server shutdown'
    else:
        try:
            filename = flask.current_app.config['FILENAME']
            source = open(filename, 'r')
            content = md.render(source.read().decode('utf-8'))
            name = os.path.basename(filename)
            name = name[:20] + '...' if len(name) > 20 else name
        except IOError, ex:
            app.logger.error(ex.strerror)
        return flask.render_template('marked.html', name=name, content=content)

@app.route('/update')
def update():
    filename = flask.current_app.config['FILENAME']
    return flask.Response(reloader(filename, 1),
                          mimetype='text/event-stream')

USAGE = """
Render markdown file and auto reload for changes.
Usage: %s [-p PORT] INPUT_FILE
"""

def run_server():
    try:
        opts, args = getopt.getopt(sys.argv[1:], "p:h", ["help", "port="])
    except getopt.GetoptError, err:
        print str(err)
        print USAGE
        sys.exit(2)
    port = 5000
    for o, a in opts:
        if o in ("-h", "--help"):
            print USAGE
            sys.exit()
        elif o in ("-p", "--port"):
            port = int(a)
        else:
            assert False, "unhandled option: %s" % o
    assert len(args) > 0 and args[0] is not None, "No input file specified."
    app.config['FILENAME'] = args[0]
    app.debug = True
    app.run(threaded=True, port=port)

if __name__ == '__main__':
    run_server()
