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
  --debug               Enable server debug log.
  -q, --quiet           Quiet mode.
  -p PORT, --port=PORT  Server port. Random port by default.

"""

import bottle
import logging
import markdown
import misaka
import os
import re
import sys
from bottle import Bottle

def build_server(filename):
    app = Bottle()
    markup = Markup(filename)

    @app.get('/')
    @bottle.view('preview')
    def handle_index():
        title = '%s - %s' % (markup.basename, markup.dirname)
        html_part = markup.html
        return { 'html_part': html_part, 'title': title }

    @app.delete('/')
    def handle_shutdown():
        logging.info('stopping server...')
        sys.exit(0)

    @app.post('/update')
    def update():
        try:
            obj = bottle.request.json
            timestamp = str(obj['timestamp'])
        except:
            bottle.response.status = '400 Malformed JSON'
            return
        try:
            file_timestamp = markup.timestamp
        except OSError, e:
            logging.critical('%s: %s', MARKDOWN_FILE, e.strerror)
            raise e

        if file_timestamp == timestamp: # Keep old entry
            return {
                'timestamp': file_timestamp,
                'filename': markup.basename,
                'dirname': markup.dirname,
                'html_part': None
            }
        else:
            return {
                'timestamp': file_timestamp,
                'filename': markup.basename,
                'dirname': markup.dirname,
                'html_part': markup.html
            }

    @app.route('/static/<filename>')
    def handle_static(filename):
        return bottle.static_file(filename, root='static')

    return app

class Markup(object):
    _markup_detect = {}
    _markup_render = {}

    @classmethod
    def add_markup(cls, markup, ftdetect, render_func):
        markup = str(markup)
        cls._markup_detect[markup] = ftdetect
        cls._markup_render[markup] = render_func

    def __init__(self, filename):
        filename = os.path.expanduser(filename)
        if os.path.exists(filename) and os.path.isfile(filename):
            self._filename = filename
            self._basename = os.path.basename(filename)
            self._dirname = os.path.dirname(filename)
            self._filetype = self._ftdetect(filename)
        else:
            raise ValueError('invalid filename')

    def _ftdetect(self, filename):
        # Markup._markup_detect
        for ft, detect in Markup._markup_render:
            if re.search(detect, filename) is not None:
                return ft
        raise ValueError('unsupported markup')

    def filename():
        doc = "The filename property."
        def fget(self):
            return self._filename
        return locals()
    filename = property(**filename())

    def basename():
        doc = "The basename property."
        def fget(self):
            return self._basename
        return locals()
    basename = property(**basename())

    def dirname():
        doc = "The dirname property."
        def fget(self):
            return self._dirname
        return locals()
    dirname = property(**dirname())

    def timestamp():
        doc = "Source file timestamp."
        def fget(self):
            return os.stat(self.filename).st_mtime
        return locals()
    timestamp = property(**timestamp())

    def html():
        doc = "Rendered html."
        def fget(self):
            # TODO render html
            # return self._html
            render_func = Markup._markup_render[self._filetype]
            return render_func(self._filename)
        return locals()
    html = property(**html())

Markup.add_markup('markdown', r'\.(markdown|md|mdown|mkd|mkdn)$',
                  markdown.to_html)

# TODO use cherrypy
# TODO rewrite this func
# def run_server(markdown_file, port, debug=False):
#     global MARKDOWN_FILE

#     MARKDOWN_FILE = markdown_file
#     app.run(port=port, debug=debug, reloader=False, quiet=False)

