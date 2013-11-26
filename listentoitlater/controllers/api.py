# -*- coding: utf-8 -*-
from listentoitlater import app
from listentoitlater.db.db import *
from listentoitlater.controllers.index import json_response
from listentoitlater.controllers.mail import send_email
from flask import request, jsonify, make_response, Response
from flask_login import current_user, login_required

#----------- RESTful API
# for versioning in the future use request.headers['Accept'] and
# check if it gets "application/crately.1.0+json"
#
# for error handling on clients which don't accept other than 200
# use supress_response_code=true in the url
# and use method=get for the other options

# Status codes:
# 200 - OK
# 404 - Not Found


@app.errorhandler(400)
def bad_request(error):
    if "application/json" in request.accept_mimetypes:
        return jsonify(message='Bad Request' + error.description, status=error.code)  # error.description or 'Bad Request'

    html = (
        '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">\n'
        '<title>400 Bad Request</title>\n'
        '<h1>Bad Request</h1>\n'
        '<p>The browser (or proxy) sent a request that this server could'
        'not understand.</p>'
    )
    return make_response(html, 400)


@app.errorhandler(404)
def page_not_found(error):
    if "application/json" in request.accept_mimetypes:
        return Response({'message': 'This page does not exist', 'status': error.code}, 404, mimetype='application/json')

    html = (
        '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2 Final//EN">\n'
        '<title>404 Not Found</title>\n'
        '<h1>Not Found</h1>\n'
        '<p>The requested URL was not found on the server.</p>'
        '<p>If you entered the URL manually please check your spelling and try again.</p>'
    )
    return make_response(html, 404)


@app.route('/api/user/me', methods=["GET"])
@login_required
def me():
    return json_response(str(current_user))


@app.after_request
def after_request(response):
    if request.method in ['OPTIONS', 'POST']:
        origin = request.headers.get('Origin', '')
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Max-Age', 1000)
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Methods', 'HEAD, GET, PUT, POST, OPTIONS, DELETE')
        response.headers.add('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    return response


#----------- User's playlist
# GET, POST(replace), PUT(create) and DELETE a specific or all playlists
@app.route('/api/user/<username>/playlists', methods=['GET', 'PUT', 'DELETE'])
@app.route('/api/user/<username>/playlists/<id>', methods=['GET', 'POST', 'PUT', 'DELETE'])
@login_required
def playlists(username, id=None, default=False):
    """
    Returns the playlists of the current user by allowing to GET, PUT(create) or DELETE methods.

    >>> ctx = app.test_request_context('/api/user/me/playlists')
    >>> ctx.push()
    >>> print playlists()
    <flask.response object>
    """
    if username == 'me':
        if request.method == "GET":
            if id is not None:
                # GET/return a specific user's playlist (id)
                for playlist in current_user._user.playlists:
                    if playlist.title == id:
                        return json_response(json.dumps(playlist, default=encode_model))
                return jsonify(result='playlist not found', status=404)
            else:
                # GET/return a all user's playlists (limit?)
                # TODO user pagination => ie. ?page=2&per_page=20
                return json_response(json.dumps(current_user._user.playlists, default=encode_model))
            pass

        elif request.method == "PUT" and request.mimetype == 'application/json':
            if id is not None:
                # PUT/update a specific user's playlist and return the number of recordings
                data = request.json
                return jsonify(data=data)
            else:
                # PUT/update all user's playlist and return the number of playlists

                prevlen = len(current_user._user.playlists)
                current_user._user.playlists = []

                sc = Platform(name='SoundCloud', url="http://soundcloud.com")
                #yt = Platform(name='Youtube', url="http://youtube.com")

                playlists = request.json
                for playlist in playlists:
                    playlist_recordings = []
                    for recording in playlist['recordings']:
                        #platform = Platform()
                        #if recording['platform']['name'].lower() == 'soundcloud':
                        platform = sc
                        #elif recording['platform']['name'].lower() == 'youtube':
                        #    platform = yt
                        # TAGS are missing
                        found_or_new_rec = Recording.objects.get_or_create(title=recording['title'], duration=recording['duration'], recording_id=recording['recording_id'], platform_user_id=recording['platform_user_id'], url=recording['url'], platform=platform, artwork_url=recording['artwork_url'])[0]
                        playlist_recordings.append(found_or_new_rec)
                        # TAGS are missing
                    current_user._user.playlists.append(Playlist(title=playlist['title'], default=playlist['default'], recordings=playlist_recordings))
                current_user._user.save()
                return jsonify(prevlen=prevlen, data=len(current_user._user.playlists))

        elif request.method == "POST" and request.mimetype == 'application/json':
            if id is None or id != 'Favorites':
                return jsonify(result='can only add audio tracks to Favorites FTM, not ' + id)

            # POST/add a specific user's playlist (Favorites)
            else:
                users_playlists = current_user._user.playlists

                if request.json is None:
                    return jsonify(result='request empty')

                recording = request.json
                result = 'playlist not found'
                for playlist in users_playlists:
                    if playlist.title == id:
                        sc = Platform(name='SoundCloud', url="http://soundcloud.com")
                        platform = sc
                        found_or_new_rec = Recording.objects.get_or_create(title=recording['title'], duration=recording['duration'], recording_id=recording['recording_id'], platform_user_id=recording['platform_user_id'], url=recording['url'], platform=platform, artwork_url=recording['artwork_url'])[0]
                        playlist['recordings'].append(found_or_new_rec)

                        result = recording
                        break

                current_user._user.save()

                # Add username and date_registered to log who's adding a track from the Bookmarklet (Mixpanel)
                result['username'] = str(current_user._user.username)
                result['date_registered'] = str(current_user._user.date_registered.isoformat())
                # print result['date_registered']
                return jsonify(result=result)

        elif request.method == "DELETE":
            if id is not None:
                # DELETE a specific user's playlist
                pass
            else:
                # DELETE all the playlists
                pass
        else:
            return jsonify(result='unsupported method called')
    else:
        return jsonify(result='only user supported in api is "me" called')


#----------- Recordings
@app.route('/api/recordings/<id>', methods=['GET', 'POST'])
@login_required
def recordings(id=None):
    if id is not None:
        # if (id) is a URL
        if id.startswith("http://") or id.startswith("https://"):
            # url = id
            # Get information about a song by the song URL. The URL can be a direct link to a Soundcloud or Youtube song. If the URL is not already in Crate.ly a new song recording will be created.
            if request.method == "GET":
                # Recording.objects.get_or_create()
                pass
            else:
                return jsonify(result='unsupported method called')

        # else if (id)
        else:
            if request.method == "GET":
                # GET and return a specific recording
                pass
            elif request.method == "POST":
                # POST/update a specific recording
                pass
            else:
                return jsonify(result='unsupported method called')
    else:
        return jsonify(result='id or url not provided')


@app.route('/hello/<subject>/<to_address>')
def hello(subject, to_address):
    tags = ["test"]
    if send_email(subject, to_address, tags)[0]['status'] == "sent":
        return "email sent successfully"
