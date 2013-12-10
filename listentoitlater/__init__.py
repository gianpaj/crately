# -*- coding: utf-8 -*-
__version__ = '0.01'
from flask import Flask
from flask.ext.cache import Cache
from ConfigParser import RawConfigParser
from os.path import dirname, realpath

app = Flask('listentoitlater')
# config for production - DEBUG gets overwritten in runserver.py
app.config.from_pyfile('listentoitlater.cfg')
cache = Cache(app)

listentoitlater_path = dirname(dirname(realpath(__file__)))
config = RawConfigParser()
config.read(listentoitlater_path + '/production.cfg')

if not config.getboolean('Flask', 'Testing'):
    from raven.contrib.flask import Sentry
    import newrelic.agent

    app.config['SENTRY_DSN'] = config.get('Flask', 'SENTRY_DSN')
    sentry = Sentry(app)
    newrelic.agent.initialize(listentoitlater_path + '/newrelic.ini')

from listentoitlater.controllers import *
