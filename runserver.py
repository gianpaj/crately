#!/usr/bin/env python
# -*- coding: utf-8 -*-
from os import path, environ
from listentoitlater import app
from ConfigParser import RawConfigParser
config = RawConfigParser()
config.read(path.dirname(path.realpath(__file__)) + '/development.cfg')

if __name__ == '__main__':
    port = int(environ.get("PORT", config.get('Flask', 'Port')))

    if not config.getboolean('Flask', 'Testing'):
        from cherrypy import wsgiserver

        d = wsgiserver.WSGIPathInfoDispatcher({'/': app})
        server = wsgiserver.CherryPyWSGIServer(('0.0.0.0', port), d)

        if config.getboolean('Flask', 'SSL'):
            server.ssl_certificate = config.get('SSL', 'cert_path')
            server.ssl_private_key = config.get('SSL', 'pkey_path')
            server.ssl_certificate_chain = config.get('SSL', 'gdbundle_path')

        try:
            server.start()
        except KeyboardInterrupt:
            server.stop()
    else:
        app.config['DEBUG'] = True
        app.run('0.0.0.0', port=port)
