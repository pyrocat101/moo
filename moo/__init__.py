from gevent import monkey
monkey.patch_all()

import io
import os
import re
import sys
import time
import webbrowser
from functools import partial
from traceback import format_exc

import jinja2
from bottle import default_app as Bottle, response, static_file
from bottle import jinja2_view
from gevent.pywsgi import WSGIServer

import misaka
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import HtmlFormatter
from cgi import escape as escape_html

import click


__author__ = "Linjie Ding <i@pyroc.at>"
__license__ = "MIT"
__version__ = "0.5.4"


# Logging ---------------------------------------------------------------------

def logger(msg, level, fg, bg=None, action=None):
    level = click.style(level, fg=fg, bg=bg, bold=True)
    click.echo("%s - %s" % (level, msg), err=True)
    if callable(action):
        action()

def die():
    click.secho(format_exc(), fg='red', bold=True, err=True)
    sys.exit(-1)

ok = partial(logger, level='ok', fg='green')
info = partial(logger, level='info', fg='cyan')
error = partial(logger, level='error', fg='red', action=lambda: sys.exit(-1))


# Markdown --------------------------------------------------------------------

RENDER_EXTENSIONS = misaka.EXT_FENCED_CODE       \
                  | misaka.EXT_NO_INTRA_EMPHASIS \
                  | misaka.EXT_AUTOLINK          \
                  | misaka.EXT_STRIKETHROUGH     \
                  | misaka.EXT_SUPERSCRIPT       \
                  | misaka.EXT_TABLES
HTML_TITLE = re.compile(r"\s*<h1>([^<]*)</h1>")

class HtmlRenderer(misaka.HtmlRenderer):
    def blockcode(self, text, lang=''):
        if not lang:
            return "\n<pre><code>%s</code></pre>\n" % escape_html(text)
        lexer = get_lexer_by_name(lang, stripall=True)
        formatter = HtmlFormatter()
        return highlight(text, lexer, formatter)

markdown = misaka.Markdown(HtmlRenderer(), RENDER_EXTENSIONS)

def render(text, filename=""):
    title = os.path.basename(filename)
    yaml_title, text = strip_yaml(text)
    if yaml_title is not None:
        title = yaml_title
    html = markdown(text)
    title_match = HTML_TITLE.match(html)
    if title_match is not None and yaml_title is None:
        title = title_match.group(1)
    return { "title": title, "html": html }

YAML_BOUNDARY = re.compile(r"^-{3,}$", re.MULTILINE)
YAML_TITLE = re.compile(r"\s*title:\s*(.+)", re.MULTILINE)

def strip_yaml(text):
    try:
        prelude, frontmatter, content = YAML_BOUNDARY.split(text, 2)
        if prelude.strip():
            return None, text
    except ValueError:
        return None, text
    title_match = YAML_TITLE.search(frontmatter)
    if title_match is not None:
        return title_match.group(1), content
    else:
        return None, content


# Preview ---------------------------------------------------------------------

SRC_ROOT = os.path.dirname(os.path.realpath(__file__))
STATIC_ROOT = os.path.join(SRC_ROOT, 'static')
TEMPLATE_ROOT = os.path.join(SRC_ROOT, 'templates')

view = partial(jinja2_view, template_lookup=[TEMPLATE_ROOT])
open = partial(io.open, encoding="utf-8")

def preview(filename, options={}):
    path = os.path.abspath(filename)
    dirpath = os.path.dirname(filename)
    realpath = os.path.realpath(path)

    if not os.path.isfile(realpath):
        error("%s is not a regular file" % filename)

    app = Bottle()

    @app.route('/')
    @view('index')
    def index():
        return { 'css': options.get('css', True) }

    @app.route('/content')
    def content():
        with open(path, 'rt') as fp:
            return render(fp.read(), path)

    @app.route('/update-event')
    def update():
        response.set_header('Content-Type', 'text/event-stream')
        response.set_header('Cache-Control', 'no-cache')
        mtime = lambda: os.stat(path).st_mtime
        last_mtime = mtime()
        while True:
            if not os.path.exists(path):
                error("%s no longer exists" % filename)
            current_mtime = mtime()
            if current_mtime > last_mtime:
                last_mtime = current_mtime
                ok('%s updated' % filename)
                yield 'data: update\n\n'
            time.sleep(0.25)

    @app.route('/__moo__/<res:path>')
    def moo_static(res):
        return static_file(res, root=STATIC_ROOT)

    @app.route('/<res:path>')
    def static(res):
        return static_file(res, root=dirpath)

    server = WSGIServer(("127.0.0.1", options.get('port', 0)), app, log=None)
    server.start()

    url = 'http://127.0.0.1:%d' % server.server_port
    info('Server listening at %s. Press Ctrl-C to stop.' % url)

    webbrowser.open(url)
    server.serve_forever()


# Export ----------------------------------------------------------------------

def export_file(infile, outfile, template, options, filename=""):
    text = infile.read()
    payload = render(text, filename)
    payload.update(options)
    html = template.render(**payload)
    outfile.write(html)
    outfile.flush()

def export_files(files, options={}):
    loader = jinja2.FileSystemLoader(TEMPLATE_ROOT)
    env = jinja2.Environment(loader=loader)
    template = env.get_template('export.html')

    def include_file(name):
        return jinja2.Markup(loader.get_source(env, name)[0])
    env.globals['include_file'] = include_file

    for infile in files:
        if infile == '-':
            export_file(sys.stdin, sys.stdout, template, options)
            ok("STDIN -> STDOUT")
        else:
            outfile = os.path.splitext(infile)[0] + '.html'
            with open(infile, 'rt') as i, open(outfile, 'wt') as o:
                export_file(i, o, template, options, filename=infile)
                ok("%s -> %s" % (infile, outfile))


# Main ------------------------------------------------------------------------

def version(ctx, param, value):
    if not value or ctx.resilient_parsing:
        return
    click.echo(__version__)
    ctx.exit()

@click.command()
@click.option('-p', '--port', default=0,
              help='server port (default: random)')
@click.option('-e', '--export', is_flag=True, default=False,
              help='export rendered HTML instead of preview')
@click.option('--css/--no-css', default=True,
              help='css styling (default: enabled)')
@click.option('--version', is_flag=True, callback=version,
              expose_value=False, is_eager=True, help='print the version')
@click.argument('files', nargs=-1,
                type=click.Path(exists=True, dir_okay=False))
def main(port, export, css, files):
    """
    \b
    Examples:
    $ moo README.md                     # live preview README.md
    $ moo -e *.md                       # export all markdown files
    $ moo --no-css -e README.md         # export README.md without CSS
    $ cat README.md | moo -e - | less   # export STDIN to STDOUT
    """
    options = { 'css': css, 'port': port }
    try:
        if not export:
            if len(files) != 1:
                error("please specify just one file to preview")
            preview(files[0], options)
        else:
            export_files(files, options)
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as exc:
        die()

if __name__ == '__main__':
    main()
