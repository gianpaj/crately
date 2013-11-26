# -*- coding: utf-8 -*-
"""ListenToItLater MongoDB schema."""
# from listentoitlater import dbc
from flask import g
from flask_login import UserMixin, AnonymousUser
from mongoengine import *
from pymongo.database import Database, DBRef
from bson.objectid import ObjectId
import json
from types import ModuleType
from itertools import groupby


def encode_model(obj, recursive=False):
    if obj is None:
        return obj
    if isinstance(obj, (Document, EmbeddedDocument)):
        out = dict(obj._data)
        for k, v in out.items():
            if isinstance(v, ObjectId):
                if k is None:
                    del(out[k])
                else:
                    # Unlikely that we'll hit this since ObjectId is always NULL key
                    out[k] = str(v)
            else:
                out[k] = encode_model(v)
    elif isinstance(obj, ModuleType):
        out = None
    elif isinstance(obj, groupby):
        out = [(gb, list(l)) for gb, l in obj]
    elif isinstance(obj, (list)):
        out = [encode_model(item) for item in obj]

    elif isinstance(obj, (dict)):
        out = dict([(k, encode_model(v)) for (k, v) in obj.items()])

    elif hasattr(obj, 'isoformat'):
        out = obj.isoformat()
    elif isinstance(obj, ObjectId):
        return None
    elif isinstance(obj, (str, unicode, int)):
        out = obj
    elif isinstance(obj, float):
        out = str(obj)
    elif isinstance(obj, DBRef):
        db = Database(g.db, 'listenitlater')
        obj_deref = Database.dereference(db, obj)
        out = encode_model(obj_deref)
    else:
        raise TypeError, "Could not JSON-encode type '%s': %s" % (type(obj), str(obj))
    return out


class Anonymous(AnonymousUser):
    name = u"Anonymous"


class Platform(EmbeddedDocument):
    """Platform collection which is Embedded inside a Recording."""
    date_added = DateTimeField()
    name = StringField(required=True)
    url = StringField(required=True)


class Tag(Document):
    """Tag collection which only has a name and is unique."""
    title = StringField(required=True, unique=True)


class Recording(Document):
    """Recording collection."""
    # soundcloud title or youtube video_title, this can be updated (but needs to be thought to avoid abuse)
    title = StringField(required=True)
    date_added = DateTimeField()
    date_uploaded = DateTimeField()
    # duration in milliseconds
    duration = IntField(required=True)
    # Embedded because there are very few platforms
    platform = EmbeddedDocumentField(Platform)
    # Default an empty list of tags
    tags = ListField(ReferenceField(Tag, dbref=False), default=list)
    # soundcloud_id or youtube video_id
    recording_id = StringField(required=True)
    # user_id or youtube usernameID
    platform_user_id = StringField(required=True)
    # soundcloud permalink or youtube url + "?v=" + video_id
    url = StringField(required=True)
    # soundcloud artwork_url or youtube thumbnail
    cover = StringField()
    # only soundcloud
    genre = StringField()
    track_type = StringField()
    artwork_url = StringField()
    # country_restriction:

    meta = {'indexes': ['title']}


class Playlist(EmbeddedDocument):
    title = StringField(required=True, unique=True)
    # Default an empty list of recordings
    recordings = ListField(ReferenceField(Recording, dbref=False), default=list)
    # Default an empty list of tags
    tags = ListField(ReferenceField(Tag, dbref=False))
    default = BooleanField(required=True, default=False)


class User(Document):
    """User collection defined."""
    name = StringField()
    username = StringField(required=True, unique=True)
    email = StringField()
    pw_hash = StringField(required=True)
    location = StringField()
    site = StringField()
    bio = StringField()  # set max_length
    date_registered = DateTimeField(required=True)
    date_logged_in = DateTimeField(required=True)
    # last_seen = DateTimeField(required=True)
    picture = FileField()
    # settings = DictField()
    playlists = ListField(EmbeddedDocumentField(Playlist))  # , default=list)
    oauth_token = StringField()
    oauth_secret = StringField()


class UserLogin(UserMixin):
    """Wraps User object for Flask-Login"""

    def __init__(self, user, active=True):
        self.active = active
        self._user = user

    def get_id(self):
        return unicode(self._user.id)

    def is_active(self):
        return self.active

    def is_anonymous(self):
        return False

    def is_authenticated(self):
        return True

    def __str__(self):
        # exclude to return the password
        self._user._data.pop('pw_hash')
        return json.dumps(self._user, default=encode_model)


class RecoverPassword(Document):
    """This records expire after 48 hours"""
    username = StringField(required=True, unique=True)
    date = DateTimeField(required=True)
    token = StringField(required=True)
    meta = {
        'indexes': [
            {'fields': ['date'], 'expireAfterSeconds': 172800}
        ]
    }
