# -*- coding: utf-8 -*-
from listentoitlater.db.db import *
from flask import render_template
from flask_login import login_required
from mailsnake import MailSnake
from mailsnake.exceptions import *
from datetime import datetime
import random

mapi = MailSnake('', api='mandrill')
# try:
#     mapi.users.ping()  # returns "Everything's Chimpy!"
# except MailSnakeException:
#     print 'An error occurred. :('

# login_manager = LoginManager()

EMAIL_FROM = "gianfranco@crate.ly"
SUBJECT_PREFIX = "crate.ly :: "


@login_required
def send_email(template, to_address, username, subject, tags, **kwargs):
    return mapi.messages.send(message={
        'html': render_email(template, username, subject),
        'subject': SUBJECT_PREFIX + subject,
        'from_email': EMAIL_FROM,
        'from_name': 'Crate.ly',
        'tags': tags,
        'to': [{'email': to_address, 'name': username}]})


@login_required
def render_email(template, username, subject):
    if not template:
        template = "email.html"
    return render_template(template, username=username, subject=subject)


@login_required
def send_recover_password(username, lang="EN"):
    if current_user._user.email:
        tags = ['recover_password']
        subject = "trying to reset your password?"
        ## TODO add counter for num of max times a password can be recovered every X days
        token = generate_token(username)
        send_email("email_recover_password.html", current_user._user.email, username, subject, tags, token)
    pass


def generate_token(username):
    """Create random + salted link and return it"""
    # or flask.current_app
    SECRET_KEY = app.config.get("SECRET_KEY")('base_64')[:-1]

    token = ''.join(random.choice(SECRET_KEY) for i in range(16))
    rec_passwd = RecoverPassword(username, date=datetime.now(), token=token)
    rec_passwd.save()

    return token
