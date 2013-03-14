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
  -q, --quiet             Quiet mode.
  -p port, --port=port    Server port. [default: 7777]
  -o file, --output=file  Export to HTML mode.
  --debug                 Output verbose debug logs.

"""

import logging
import moo
import os
import sys
from docopt import docopt

# def pick_unused_port():
#     s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
#     s.bind(('127.0.0.1', 0))
#     addr, port = s.getsockname()
#     s.close()
#     return port

def open_local_url(port):
    import webbrowser
    logging.debug('opening web browser...')
    # from ipdb import set_trace; set_trace()
    local_url = 'http://127.0.0.1:%d' % port
    webbrowser.open(local_url)

def main():
    args = docopt(__doc__, version='0.2.0')

    markdown_file = os.path.abspath(args['FILE'])
    output_file = args['--output']
    if output_file is not None:
        output_file = os.path.abspath(output_file)

    # export HTML mode
    if output_file is not None:
        moo.export_html(markdown_file, output_file)
        return

    # shut-your-mouth-up mode
    if args['--quiet']:
        logging_level = logging.ERROR
    # logging configs
    if args['--debug']:
        logging_level = logging.DEBUG
        use_debug = True
    else:
        logging_level = logging.INFO
        use_debug = False

    logging.basicConfig(level=logging_level,
                        format='%(asctime)s %(levelname)-8s %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')

    try:
        port = int(args['--port'])
    except:
        sys.stderr.write('Invalid port number\n')
        sys.exit(-1)

    # try open browser
    try:
        open_local_url(port)
    except:
        pass
    # start server
    print 'Preview on http://127.0.0.1:%d' % port
    print 'Hit Ctrl-C to quit.'
    moo.quickstart(markdown_file, port=port, debug=use_debug)

if __name__ == '__main__':
    main()
