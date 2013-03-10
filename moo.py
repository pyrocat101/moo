#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
   _____________________
  /   _ __   ___  ___   \\
  |  | '  \ / _ \/ _ \  |
  \  |_|_|_|\___/\___/  /
   ---------------------
          \   ^__^
           \  (oo)\_______
              (__)\       )\/\\
                  ||----w |
                  ||     ||
  Editor-agnostic markdown live preview server.

Usage: moo [options] FILE

Options:
  -q, --quiet           Quiet mode.
  --debug               Enable server debug log.
  -p PORT, --port=PORT  Server port. Random port by default.

"""

# import bottle
# import subprocess
# from multiprocessing import Process
from gevent import monkey; monkey.patch_all()
import sys
import os
import misaka
import logging
import time
import pygments
import socket
from cgi import escape as escape_html
from docopt import docopt
from bottle import get, delete, view, response, static_file, route, run
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter
# if chardet is available, use it to detect file encoding
# try:
#     import chardet1 as chardet
#     # FIXME chardet returns None!
#     charset_detect = lambda x: chardet.detect(x)['encoding']
# except ImportError:
#     logging.warning('chardet not found, use UTF-8 as file encoding instead')
# UTF-8 as fallback encoding
charset_detect = lambda x: 'utf-8'

# inteval to check file updates (unit: second)
RELOAD_INTERVAL = 1
# file to preview
MARKDOWN_FILE = ''
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

renderer = HtmlRenderer(HTML_FLAGS)
to_html = misaka.Markdown(renderer, RENDER_EXTENSIONS).render

def render_markdown():
    title = os.path.basename(MARKDOWN_FILE)
    try:
        with open(MARKDOWN_FILE) as f:
            raw_content = f.read()
            decoded_content = raw_content.decode(charset_detect(raw_content))
            rendered = to_html(decoded_content)
            return title, rendered
    except IOError, e:
        logging.error(e.strerror)
        raise e


@get('/')
@view('preview')
def index():
    title, content = render_markdown()
    return { 'content': content, 'title': title }


@delete('/')
def index():
    logging.info('server shutdown')
    sys.exit(0)


@route('/static/style.css')
def stylesheet():
    return static_file('style.css', root='static')

def reloader(filename, interval):
    # last modified time
    mtime = None
    while True:
        try:
            new_mtime = os.stat(filename).st_mtime
        except OSError, e:
            logging.critical('%s: %s', MARKDOWN_FILE, e.strerror)
            sys.exit(-1)

        if mtime is None:
            mtime = new_mtime
            continue
        elif new_mtime > mtime:
            mtime = new_mtime
            yield 'data: updated\n\n'
            logging.info('detected file change in %s', MARKDOWN_FILE)
        time.sleep(interval)


@get('/update')
def update():
    logging.debug('sending event source stream...')
    response.content_type = 'text/event-stream'
    return reloader(MARKDOWN_FILE, RELOAD_INTERVAL)

# class MooServer(Process):
#     def __init__(self, *args, **kwargs):
#         super(MooServer, self).__init__()
#         self.args = args
#         self.kwargs = kwargs
#     def run(self):
#         logging.info('starting server at port %d' % PORT)
#         bottle.run(*self.args, **self.kwargs)

def pick_unused_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    addr, port = s.getsockname()
    s.close()
    return port

def open_local_url(port):
    import webbrowser
    logging.debug('opening web browser...')
    # from ipdb import set_trace; set_trace()
    local_url = 'http://127.0.0.1:%d' % port
    webbrowser.open_new(local_url)
    # if sys.platform == 'win32':
    #     # Windows
    #     subprocess.Popen(['start', local_url], shell=True)
    # elif sys.platform == 'darwin':
    #     # Macintosh
    #     subprocess.Popen(['open', local_url])
    # else:
    #     try:
    #         # Linux with X window system
    #         subprocess.Popen(['xdg-open', local_url])
    #     except OSError:
    #         # Oops
    #         logging.critical('cannot open preview URL')
    #         sys.exit(-1)

if __name__ == '__main__':
    args = docopt(__doc__, version='0.2.0')

    MARKDOWN_FILE = args['FILE']

    # shut-your-mouth-up mode
    if args['--quiet']:
        logging_level = logging.ERROR
    # logging configs
    if args['--debug']:
        logging_level = logging.DEBUG
        server_quiet = False
        server_debug = True
    else:
        logging_level = logging.INFO
        server_quiet = True
        server_debug = False

    logging.basicConfig(level=logging_level, format='%(asctime)s %(levelname)-8s %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S')

    if args['--port'] is None:
        # random port
        PORT = pick_unused_port()
    else:
        try:
            PORT = int(args['--port'])
        except:
            sys.stderr.write('Invalid port number\n')
            sys.exit(-1)

    # open preview URL in browser
    open_local_url(PORT)

    # start server
    run(port=PORT, quiet=server_quiet, debug=server_debug, server='gevent')
