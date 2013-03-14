"""
Copyright (c) 2012 Timon Wong

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
from bottle import ServerAdapter
from cherrypy import wsgiserver

class StoppableCherryPyServer(ServerAdapter):
    """ HACK for making a stoppable server """
    def __int__(self, *args, **kwargs):
        super(ServerAdapter, self).__init__(*args, **kwargs)
        self.srv = None

    def run(self, handler):
        self.srv = wsgiserver.CherryPyWSGIServer(
            (self.host, self.port), handler, numthreads=2, timeout=2, shutdown_timeout=2
        )
        self.srv.start()

    def shutdown(self):
        logging.info('stopping server...')
        try:
            if self.srv is not None:
                self.srv.stop()
        except:
            logging.critical('error on shutting down cherrypy server')
        self.srv = None

