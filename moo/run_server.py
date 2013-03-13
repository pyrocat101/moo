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
  -p port, --port=port  Server port. Random port by default.

"""

import logging
import socket
import sys
from docopt import docopt
from moo import run_server

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

def main():
    args = docopt(__doc__, version='0.2.0')

    markdown_file = args['FILE']
    # app.config['MARKDOWN_FILE'] = args['FILE']

    # shut-your-mouth-up mode
    if args['--quiet']:
        logging_level = logging.ERROR
    # logging configs
    if args['--debug']:
        logging_level = logging.DEBUG
        use_debug = True
        # app.debug = True
        server_quiet = False
        # server_debug = True
    else:
        logging_level = logging.INFO
        use_debug = False
        server_quiet = True
        # server_debug = False

    logging.basicConfig(level=logging_level,
                        format='%(asctime)s %(levelname)-8s %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')

    if args['--port'] is None:
        # random port
        port = pick_unused_port()
    else:
        try:
            port = int(args['--port'])
        except:
            sys.stderr.write('Invalid port number\n')
            sys.exit(-1)

    # encoding detection
    # try:
    #     import chardet
    #     def charset_detect(text):
    #         confidence, charset = chardet.detect(text).values()
    #         if charset is None:
    #             return 'utf-8'
    #         else:
    #             return charset
    # except ImportError:
    #     logging.warn('chardet not found, use UTF-8 as file encoding instead')
    #     # fallback
    #     def charset_detect(text):
    #         return 'utf-8'

    # open preview URL in browser
    # import threading, webbrowser
    # url = 'http://127.0.0.1:{}'.format(port)
    # threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    # FIXME this will prevent me from quitting!
    open_local_url(port)
    # start server
    run_server(markdown_file, port=port, debug=use_debug, quiet=server_quiet)
    # app.run(threaded=True, port=port)
    # open preview URL in browser

    # run(port=port, quiet=server_quiet, debug=server_debug, server='gevent')

if __name__ == '__main__':
    main()
