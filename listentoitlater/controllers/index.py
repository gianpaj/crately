# -*- coding: utf-8 -*-
from listentoitlater import app, cache
from listentoitlater.db.db import *
from flask import request, redirect, url_for, jsonify, session, send_from_directory, make_response, Response
from flask.ext.wtf import validators
from flask_login import (LoginManager, current_user,
                            login_user, logout_user, login_required)
from werkzeug import check_password_hash, generate_password_hash
from datetime import datetime
from flask.ext.oauth import OAuth
from mongoengine import connect
import os

FACEBOOK_APP_ID = ""
FACEBOOK_APP_SECRET = ""
TWITTER_APP_ID = ""
TWITTER_APP_SECRET = ""

#Defining Remote Applications
oauth = OAuth()
facebook = oauth.remote_app(
    'facebook',
    base_url='https://graph.facebook.com/',
    request_token_url=None,
    access_token_url='/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    consumer_key=FACEBOOK_APP_ID,
    consumer_secret=FACEBOOK_APP_SECRET,
    request_token_params={'scope': 'email',
                          'redirect_uri': 'https://crate.ly/#Dashboard',
                          'display': 'popup'}
)
twitter = oauth.remote_app(
    'twitter',
    base_url='http://api.twitter.com/1/',
    request_token_url='http://api.twitter.com/oauth/request_token',
    access_token_url='http://api.twitter.com/oauth/access_token',
    authorize_url='http://api.twitter.com/oauth/authenticate',
    consumer_key=TWITTER_APP_ID,
    consumer_secret=TWITTER_APP_SECRET
)

login_manager = LoginManager()


@app.before_request
def canonical():
    if 'listenitlater' in request.host:
        return redirect('https://crate.ly', 301)


@app.before_request
def before_request():
    g.db = connect('listenitlater')


@app.teardown_request
def teardown_request(exception):
    g.db.disconnect()


@login_manager.user_loader
def load_user(id):
    try:
        user = User.objects.get(id=id)
        return UserLogin(user)
    except:
        return None


def unauthorized_callbacks():
    if "application/json" in request.accept_mimetypes:
        # RETURN a HTTP 200
        return jsonify(result="Unauthorized", status=401)

    html = (
        '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">\n'
        '<title>401 Unauthorized</title>\n'
        '<h1>Unauthorized</h1>\n'
        '<p>The server could not verify that you are authorized to access '
        'the URL requested.  You either supplied the wrong credentials (e.g. '
        'a bad password), or your browser doesn\'t understand how to supply '
        'the credentials required.</p><p>In case you are allowed to request '
        'the document, please check your user-id and password and try '
        'again.</p>'
    )
    return make_response(html, 401)


def json_response(json):
    return Response(json, mimetype='application/json')

login_manager.anonymous_user = Anonymous
login_manager.login_view = "login"
login_manager.login_message = u"Please log in to access this page."
login_manager.refresh_view = "reauth"
login_manager.unauthorized_callback = unauthorized_callbacks

login_manager.setup_app(app)


@cache.cached(timeout=3600)
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'img/favicon.ico', mimetype='image/vnd.microsoft.icon')


# @cache.cached(timeout=3600)
@app.route('/')
def index():
    if current_user.is_authenticated():
        return send_from_directory(os.path.join(app.root_path, 'templates'), 'app.html')
    return send_from_directory(os.path.join(app.root_path, 'templates'), 'index.html')


@app.route('/change_password/<token>')
def change_password(token):
    if not token and RecoverPassword.objects.get(token).first() is not None:
        return redirect(url_for("index"))

    username = RecoverPassword.objects.get(token)

    return render_template('change_password.html', username)
    pass


@cache.cached(timeout=3600)
@app.route('/<staticfile>.html')
def alexa(staticfile):
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               staticfile + '.html')


@app.route("/login", methods=["POST"])
def login():
    if current_user.is_authenticated():
        return jsonify(result="Already logged in.")

    if request.method == "POST" and "username" in request.json:

        username = request.json["username"]
        password = request.json["password"]

        if not username or not password:
            return jsonify(result="Empty username or password.")
        else:
            try:
                user_record = User.objects.get(username=username)
            except:
                user_record = None

            if user_record is None:
                return jsonify(result="Please check you username or password.")
            elif not check_password_hash(user_record['pw_hash'], password):
                return jsonify(result="Please check you username or password.")
            else:
                user_record.date_logged_in = datetime.now()
                user_record.save()
                usr_obj = UserLogin(user_record)

                if login_user(usr_obj):
                    return json_response(str(current_user))
                    # return jsonify(result="authorized")
                else:
                    return jsonify(result="Invalid password.")


@app.route('/create-account', methods=['POST'])
def create_account():
    if current_user.is_authenticated():
        return jsonify(result="Already logged in.")

    if request.method == "POST" and "username" in request.json:
        username = request.json["username"]
        password = request.json["password"]
        email = request.json["email"]
        validate_email = validators.Email().regex.search

        if not username or not password or not email:
            # already checked in Javascript
            return jsonify(result="Empty username or password.")
        elif not validate_email(email):
            return jsonify(result="Invalid email.")
        elif not 2 < len(username) < 26:
            return jsonify(result="Username must be 3-25 characters")
        elif not 3 < len(password) < 33:
            return jsonify(result="Password must be 4-32 characters")
        elif User.objects(username=username).first() is not None:
            return jsonify(result="The username is already taken.")
        elif User.objects(email=email).first() is not None:
            return jsonify(result="You have already registered with this email.")
        else:
            new_user = User(username=username, email=email, pw_hash=generate_password_hash(password), date_registered=datetime.now(), date_logged_in=datetime.now(), playlists=create_default_playlists())
            new_user.save()
            # the date_logged_in is create because when the user is created is also automatically logged inself.
            usr_obj = UserLogin(User.objects.get(username=username))
            if login_user(usr_obj):
                return json_response(str(usr_obj))
            else:
                return jsonify(result="Error during login")


def create_default_playlists():
    """ Create default playlists for the user and return them as a list
    Note: the playlists are embedded documents of the the user doc
    while recordings and tags are reference fields
    """
    main_tag = Tag.objects.get_or_create(title='main')[0]

    rock = Playlist(title='Rock')
    rock.tags.append(main_tag)

    fav = Playlist(title='Favorites', default=True)
    fav.tags.append(main_tag)

    sc = Platform(name='SoundCloud', date_added=datetime.now(), url="http://soundcloud.com")

    rec_test = Recording.objects.get_or_create(title='Platz by seams', date_added=datetime.now(), date_uploaded=datetime.now(), duration=396219, recording_id='7084513', platform_user_id='seamz', url='/seams/platz', platform=sc, artwork_url='https://i1.sndcdn.com/artworks-000003089457-soujs7-large.jpg?cc23540')[0]
    fav.recordings.append(rec_test)

    return [rock, fav]


# HTML to close popup and reload the main window
html = (
        '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">\n'
        '<title>Closing window</title>\n'
        '<script type="text/javascript"> window.opener.location.reload(true); window.close(); </script>')


@app.route('/fblogin')
def fblogin():
    return facebook.authorize(callback=url_for('facebook_authorized',
        next=request.args.get('next') or request.referrer or None,
        _external=True))


@app.route('/login/fbauthorized')
@facebook.authorized_handler
def facebook_authorized(resp):
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        )

    session['oauth_token'] = (resp['access_token'], '')
    me = facebook.get('/me')

    try:
        user = User.objects.get(username=me.data['name'])
        user.date_logged_in = datetime.now()
    except:
        # the user doesn't exist in the database
        user = User(username=me.data['name'], email=me.data['email'],
                pw_hash=generate_password_hash('password'),
                date_registered=datetime.now(),
                date_logged_in=datetime.now(),
                playlists=create_default_playlists())
        # the date_logged_in is create because when the user is created is also automatically logged inself.

    user.save()

    usr_obj = UserLogin(user)

    login_user(usr_obj)

    return make_response(html, 200)


@facebook.tokengetter
def get_facebook_oauth_token():
    return session.get('oauth_token')


@app.route('/twlogin')
def twlogin():
    """Calling into authorize will cause the OpenID auth machinery to kick
    in.  When all worked out as expected, the remote application will
    redirect back to the callback URL provided.
    """
    return twitter.authorize(callback=url_for('twitter_authorized',
        next=request.args.get('next') or request.referrer or None))


@app.route('/login/twauthorized')
@twitter.authorized_handler
def twitter_authorized(resp):
    index = url_for("index")
    if resp is None:
        print 'You denied the request to sign in.'
        return redirect(index)

    try:
        user = User.objects.get(username=resp['screen_name'])
        user.date_logged_in = datetime.now()
    except:
        # the user doesn't exist in the database
        user = User(username=resp['screen_name'],
                    pw_hash=generate_password_hash('password'),
                    date_registered=datetime.now(),
                    date_logged_in=datetime.now(),
                    playlists=create_default_playlists())

    user.save()

    session['oauth_token'] = resp['oauth_token']
    session['oauth_token_secret'] = resp['oauth_token_secret']

    usr_obj = UserLogin(user)

    login_user(usr_obj)

    return make_response(html, 200)


@twitter.tokengetter
def get_twitter_token():
    """This is used by the API to look for the auth token and secret
    it should use for API calls.  During the authorization handshake
    a temporary set of token and secret is used, but afterwards this
    function has to return the token and secret.  If you don't want
    to store this in the database, consider putting it into the
    session instead.
    """
    if current_user.is_authenticated():
        return session.get('oauth_token'), session.get('oauth_token_secret')


@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for("index"))
