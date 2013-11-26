/* Author: Gianfranco */

// soundcloud client_id for the API
var snd_client_id = '';
var ENTER_KEY = 13;
var ESC_KEY = 27;

var spinnerOpts = {
  lines: 12, // The number of lines to draw
  length: 7, // The length of each line
  width: 4, // The line thickness
  radius: 10, // The radius of the inner circle
  corners: 1, // Corner roundness (0..1)
  rotate: 0, // The rotation offset
  color: '#000', // #rgb or #rrggbb
  speed: 1, // Rounds per second
  trail: 60, // Afterglow percentage
  shadow: false, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: 'auto', // Top position relative to parent in px
  left: 'auto' // Left position relative to parent in px
};

// custom binding to handle the enter key
ko.bindingHandlers.enterKey = {
  init: function (element, valueAccessor, allBindingsAccessor, data) {
    var wrappedHandler, newValueAccessor;

    // wrap the handler with a check for the enter key
    wrappedHandler = function (data, event) {
      if (event.keyCode === ENTER_KEY ) {
        valueAccessor().call(this, data, event);
      }
    };

    // create a valueAccessor with the options that we would want to pass to the event binding
    newValueAccessor = function () {
      return {
        keyup: wrappedHandler
      };
    };

    // call the real event binding's init function
    ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data);
  }
};
ko.bindingHandlers.escKey = {
  init: function (element, valueAccessor, allBindingsAccessor, data) {
    var wrappedHandler, newValueAccessor;

    // wrap the handler with a check for the enter key
    wrappedHandler = function (data, event) {
      if (event.keyCode === ESC_KEY ) {
        valueAccessor().call(this, data, event);
      }
    };

    // create a valueAccessor with the options that we would want to pass to the event binding
    newValueAccessor = function () {
      return {
        keyup: wrappedHandler
      };
    };

    // call the real event binding's init function
    ko.bindingHandlers.event.init(element, newValueAccessor, allBindingsAccessor, data);
  }
};

// custom binding to handle the flash message indicating when a song has been dragged and dropped
ko.bindingHandlers.flash = {
  init: function (element) {
    $(element).hide();
  },
  update: function (element, valueAccessor) {
    var value = ko.utils.unwrapObservable(valueAccessor()),
        $element = $(element);

    if (value) {
      $element.stop().hide().text(value).fadeIn(function () {
        clearTimeout($element.data("timeout"));
        $element.data("timeout", setTimeout(function () {
          $element.fadeOut();
          valueAccessor()(null);
        }, 3000));
      });
    }
  },
  timeout: null
};

// wrapper to hasfocus that also selects text and applies focus async
ko.bindingHandlers.selectAndFocus = {
  init: function( element, valueAccessor, allBindingsAccessor ) {
    // ko.bindingHandlers.hasfocus.init( element, valueAccessor, allBindingsAccessor );
    ko.utils.registerEventHandler( element, 'focus', function() {
      element.focus();
      $(element).select();
    });
  },
  update: function( element, valueAccessor ) {
    ko.utils.unwrapObservable( valueAccessor() ); // for dependency
    // ensure that element is visible before trying to focus
    setTimeout(function() {
      ko.bindingHandlers.hasfocus.update( element, valueAccessor );
    }, 0);
  }
};

ko.bindingHandlers.slider = {
  init: function (element, valueAccessor) {
    var observable = valueAccessor();

    $(element).slider({
      range: "min",
      min: 1,
      value: 35,

      start: function(event, ui) {
        tooltip.fadeIn('fast');
        tooltip.text(ui.value);
        tooltip.css('left', ui.value+132);
      },

      slide: function (event, ui) {
        playerModelVar.volume(ui.value * 0.01);
        var soundID = soundManager.soundIDs[ViewModelVar.next_index];
        soundManager.setVolume(soundID, ui.value);
        observable(ui.value);

        tooltip.css('left', ui.value+132).text(ui.value); //Adjust the tooltip accordingly
      },

      stop: function() {
        tooltip.fadeOut('fast');
      }
    });
  },
  update: function (element, valueAccessor) {
    var observable = valueAccessor();
    $(element).slider({ value: observable() });
    var volume = $('.volume');

    if(observable() <= 5) {
      volume.css('background-position', '0 0');
    }
    else if (observable() <= 25) {
      volume.css('background-position', '0 -25px');
    }
    else if (observable() <= 75) {
      volume.css('background-position', '0 -50px');
    }
    else {
      volume.css('background-position', '0 -75px');
    }
  }
};

//represents a single playlist item
var Playlist = function (title, recs, icon, def) {
  this.recordings = ko.observableArray(recs);
  this.recordings.title = title; // for drag-drop flash message
  this.title = ko.observable(title);
  this.icon = ko.observable(icon);
  this.editing = ko.observable(false);
  this.editing_new = ko.observable(false);
  this['default'] = def;
};

// represents a single platform item
var Platform = function (platform, platform_url) {
  this.name = platform;
  this.url = platform_url;
};

// represents a single recording item
var Recording = function (title, platform, platform_url, url, duration, recording_id, user_id, artwork_url) {
  this.title = title;
  this.platform = new Platform(platform, platform_url);
  this.url = url;
  this.duration = duration || 0;
  this.recording_id = recording_id.toString() || '01';
  this.platform_user_id = user_id.toString() || '';
  this.artwork_url = artwork_url || 'https://s3-eu-west-1.amazonaws.com/assets.listentoitlater.co/img/75x75.gif';
};

// Send all the playlist via a PUT http method
function put_allNonSearchPlaylists () {
  // all the playlists except the search results
  var allNonSearchPlaylists = ko.utils.arrayFilter(ViewModelVar.allPlaylists(), function(item) {
    return item.title() !== 'Search Results';
  });

  $.ajax('/api/user/me/playlists', {
    type: 'put',
    data: ko.toJSON(allNonSearchPlaylists),
    dataType: "json",
    contentType: 'application/json',
    success: function (data) {},
    error: function (xhr) {
      log(xhr);
      log('get /api/user/playlists failed');
    }
  });
}

// methods on prototype, as there can be many playlists
ko.utils.extend(Playlist.prototype, {
  // edit a playlist title
  edit: function () {
    this.editing(true);
  },
  // stop editing a playlist title
  stopEditing: function () {
    var playlist_title = this.title();
    // the title is not empty
    if (playlist_title === '') {
      log("playlist name can't be empty -- TO ADD to noty");
    }
    else if (playlist_title === 'double-click to rename') {
      log("choose another playlist title, it can not be 'double-click to rename' -- TO ADD to noty");
    }
    // if a playlist exist already with same title
    else if ( ViewModelVar.allPlaylistsTitles().filter( function(value) { return value === playlist_title; } ).length > 1 ) {
      log("choose another playlist title, two playlist cannot have the same name -- TO ADD to noty");
    }
    else {
      log("playlist saved", playlist_title);
      this.editing(false);
      this.editing_new(false);
      put_allNonSearchPlaylists();
      this.goToPlaylist(playlist_title);
    }
  },
  // don't save this new playlist
  cancel: function () {
    // only if the user press ESC after clicking New Playlist
    if (this.editing_new() === true) {
      ViewModelVar.allPlaylists.remove(this);
    }
  },
  goToPlaylist: function () {
    location.hash = this.title();
  },
  recordingInPlaylist: function(rec, playlist) {
    var pl = ViewModelVar.getPlaylist(playlist);
    if ( pl !== null ) {
      var ret;
      ko.utils.arrayForEach(pl.recordings(), function(item) {
        if (item.recording_id === rec.recording_id) {
          ret =  true;
        }
      });
      return ret || false;
    }
  },
  // Add to Favorites or other playlist
  addToPlaylist: function (playlist) {
    if (event.type === "click") {
      $.ajax({
        url: '/api/user/me/playlists/'+playlist,
        type: 'POST',
        data: ko.toJSON(this),
        contentType: 'application/json',
        success: function(data) {
          // if Unauthorized (@login_required decorator in python)
          if (data.status === 401) {
            log(data);
          }
          else {
            // log(data.result);
          }
        },
        error: function (response) {
          log('Failed ' + response);
        }
      });
    }
  },
  removeRecording: function() {
    var arrayToWrite = ViewModelVar.getPlaylist(ViewModelVar.chosenPlaylistId());
    arrayToWrite.recordings.remove(this);
    put_allNonSearchPlaylists();
  }
});

var ViewModel = function() {
  // Data
  var self = this, Sammyapp;
  self.next_index = '';
  self.chosenPlaylistId = ko.observable();
  self.username = ko.observable();

  // currentUser Object which gets loaded once the user is logged in
  // this contains the Database object, including the playlists and songs inside the playlist
  // THIS should be implemented instead of the underscore template

  self.searchResults = ko.observableArray();
  self.allPlaylists = ko.observableArray();

  self.allPlaylistsTitles = ko.computed(function() {
    return ko.utils.arrayMap(self.allPlaylists(), function(item) {
      return item.title();
    });
  }, self);

  self.chosenPlaylistData = ko.computed({
    read: function() {
      return ko.utils.arrayFirst(self.allPlaylists(), function(item) {
        return item.title() === self.chosenPlaylistId();
      });
    },
    write: function(recording) {
      var array_to_write = self.getPlaylist(self.chosenPlaylistId());
      // log(recording);
      array_to_write.recordings.push(recording);
    },
    owner: self
  });
  self.getPlaylist = function (arg) {
    return ko.utils.arrayFirst(self.allPlaylists(), function(item) {
      return item.title() === arg;
    });
  };

  // Crates
  self.userPlaylists = ko.computed(function() {
    return ko.utils.arrayFilter(self.allPlaylists(), function(item) {
      return item['default'] === false;
    });
  }, self);

  self.mainPlaylists = ko.computed(function() {
    return ko.utils.arrayFilter(self.allPlaylists(), function(item) {
      return item['default'] === true;
    });
  }, self);

  self.updateLastAction = function (arg) {
    if ( devmode ) {
      playerModelVar.lastAction("Moved " + arg.item.title + " from " + arg.sourceParent.title + " (index " + arg.sourceIndex + ") to " + arg.targetParent.title + " (index " + arg.targetIndex + ")");
    }
    //if (arg.targetParent.title === 'Favorites'){
      // NOT yet implemented
      // log('arg.targetParent.title === Favorites');
      // add mark change as favourite
    //}
    //if (arg.sourceParent.title === 'Favorites'){
      // NOT yet implemented
      // log('arg.sourceParent.title === Favorites');
      // remove mark change as favourite
    //}
    put_allNonSearchPlaylists();
  };

  // add a new playlist, from the HTML button or when the user obj gets loaded
  self.addPlaylist = function (title, recordings, icon, def) {
    if (typeof title === 'undefined' || typeof title === 'object') {
      title = "double-click to rename";
      recordings = [];
      icon = "icon-music";
      def = false;
    }

    var newPlaylist = new Playlist(title, recordings, icon, def);
    // Adds the item. Writing to the "playlists" observableArray causes any associated UI to update.
    self.allPlaylists.push(newPlaylist);
    if (title === "double-click to rename") {
      newPlaylist.edit();
      newPlaylist.editing_new(true);
    }
  };

  // remove a playlist after the user confirmation
  self.removePlaylist = function (playlist) {
    $('#confirmModal').confirm(function() {
      self.allPlaylists.remove(playlist);
      put_allNonSearchPlaylists();
      // select the last playlist
      location.hash = self.userPlaylists().slice(-1)[0].title();
    });
  };

  self.playSong = function (recording, event) {
    var chosenPlaylist;
    var $elem = ('target' in event) ? $(event.target) : ('srcElement' in event) ? $(event.srcElement) : null;

    // get the index of the track clicked
    index_clicked_track = $elem.closest('tbody').children().index($elem.closest('tr'));
    self.next_index = index_clicked_track;
    chosenPlaylist = self.chosenPlaylistId();

    self.playingPlaylistData = ko.computed({
      read: function() {
        return self.getPlaylist(chosenPlaylist).recordings();
      },
      write: function(index, sm2id) {
        var array_to_write = self.getPlaylist(chosenPlaylist).recordings();
        array_to_write[index].sm2id = sm2id;
      },
      owner: self
    });

    // Loop through each of the recordings for SoundCloud starting from the one clicked
    $.each(self.playingPlaylistData(), function(index, recording) {
      if (recording.platform.name === "SoundCloud" && index_clicked_track <= index) {
        var stream_url;

        $.ajax({
          url: 'https://api.soundcloud.com/resolve?url=https://soundcloud.com' + recording.url + '&format=json&client_id=' + snd_client_id + '&callback=?',
          type: 'get',
          dataType: 'json',
          timeout: 2000, // 2 seconds timeout
          success: function(data) {
            if (data.tracks !== undefined){
              noty({"text":"Please enter a soundcloud track url. Sets are not supported at the moment.",
                "layout":"topCenter", "type":"error", "textAlign":"center", "easing":"swing",
                "animateOpen":{"height":"toggle"}, "animateClose":{"height":"toggle"},
                "speed":"500", "timeout":"3000", "closable":true, "closeOnSelfClick":true});
            }
            else {
              stream_url = data.stream_url;
              if (stream_url.indexOf("secret_token") === -1) {
                stream_url = stream_url + '?';
              }
              else {
                stream_url = stream_url;
              }
              stream_url = stream_url + '&client_id=' + snd_client_id;

              // add all sound manager track ids to this array
              self.playingPlaylistData(index, data.id);

              // ## SoundManager2
              // **Create the sound using SoundManager2**
              var $player = $('.player'),
                $playerbuttontitle = $('.player-button-title');

              soundManager.createSound({
                // Give the sound an id and the SoundCloud stream url we created above.
                id: 'track_' + data.id,
                url: stream_url,

                // On play & resume add a *playing* class to the main player div.
                // This will be used in the stylesheet to hide/show the play/pause buttons depending on state.
                onplay: function() {
                  $player.addClass('playing');
                  $playerbuttontitle.text(data.title);
                },
                onresume: function() {
                  $player.addClass('playing');
                },
                // On pause, remove the *playing* class from the main player div.
                onpause: function() {
                  $player.removeClass('playing');
                },
                // When a track finished, call the Next Track function. (Declared at the bottom of this file).
                onfinish: function() {
                  $playerbuttontitle.text('Click an audio track to start listening');
                  $player.removeClass('playing');
                  playerModelVar.nextTrack(index_clicked_track);
                },
                whileplaying: function() {
                  // $player.setPosition(this.position, this.duration));
                  // log(this.position);
                }
              });

              if (index_clicked_track === index) {
                soundManager.stopAll();
                soundManager.play('track_' + data.id);
                soundManager.setVolume('track_' + data.id, playerModelVar.volume());

                $('.currentlyplaying').removeClass('icon-play');
                $elem.closest('tr').find('i.currentlyplaying').addClass('icon-play');
                // return false; // break the .each loop
              }
            }
          },
          error: function() {
            if (index === index_clicked_track) {
              alert("Oops, looks like we can't find that audio track on " + recording.platform.name + '. Maybe the track or user has been removed');
              log(recording.url + ' track not on ' + recording.platform.name);
            }
          }
        });
      }
    });
  };

  // Behaviours
  self.searchAdd = function (elem) {
    var $elem = $(elem).find('input'),
      value = $elem.val();

    if (self.chosenPlaylistId() === 'Dashboard') {
      window.location.hash = 'Search Results';
    }
    if ((value.startsWith('http') === true) && (value.contains('soundcloud.com'))) {

      $.getJSON('https://api.soundcloud.com/resolve?url=' + value + '&format=json&consumer_key=' + snd_client_id + '&callback=?', function(data) {
        var rec_url = data.permalink_url.replace('http://soundcloud.com','');

        self.chosenPlaylistData(new Recording(data.title+' by '+data.user.username, 'SoundCloud', 'http://soundcloud.com', rec_url, data.duration, data.id, data.user_id, data.artwork_url));
        // if a playlist has ever been playing
        // create a SoundManager Sound
        // add the id to self.playingPlaylistData
      });
      if (self.chosenPlaylistId() !== 'Search Results') {
        put_allNonSearchPlaylists();
      } else {
        self.getPlaylist('Search Results').recordings.removeAll();
      }

    } else {
      var spinner = new Spinner(spinnerOpts).spin(DO('rightcontent'));
      self.getPlaylist('Search Results').recordings.removeAll();
      $.getJSON('https://api.soundcloud.com/tracks.json?q=' + value + '&limit=30&filter=streamable&format=json&client_id=' + snd_client_id + '&callback=?', function(data) {
        // var newItems = ko.utils.arrayForEach(data, function(item) {
        //   var rec_url = item.permalink_url.replace('http://soundcloud.com','');
        //   return new Recording(item.title+' by '+item.user.username, 'SoundCloud', 'http://soundcloud.com', rec_url, item.duration, item.id, item.user_id, item.artwork_url);
        // });
        // // var newItems
        // self.chosenPlaylistData(newItems);

        for (var i = 0; i < data.length; i++) {
          var rec_url = data[i].permalink_url.replace('http://soundcloud.com','');
          self.chosenPlaylistData(new Recording(data[i].title+' by '+data[i].user.username, 'SoundCloud', 'http://soundcloud.com', rec_url, data[i].duration, data[i].id, data[i].user_id, data[i].artwork_url));
        }
        spinner.stop();
      });
      window.location.hash = 'Search Results';
    }
    // reset the search field
    $elem.val('');
  };

  self.logout = function () {
    if ( !devmode ) {
      analytics.track('Logout button pressed', {});
    }
    location.href = '/logout';
  };

  // internal computed observable that fires whenever anything changes in our playlists
  ko.computed(function() {
    // store a clean copy to local storage, which also creates a dependency on the observableArray and all observables in each item
    localStorage.setItem('playlists-crately', ko.toJSON( self.allPlaylists ) );
  }).extend({
    throttle: 500
  }); // save at most twice per second

  // // Client-side routes
  Sammyapp = new Sammy('#appcontainer', function () {
    this.debug = false;

    this.get('#:playlist', function () {
      var selectedPlaylist = this.params.playlist,
        allPlaylists = self.allPlaylists();

      if (((selectedPlaylist !== 'Dashboard') || (selectedPlaylist !== '_=_')) && (typeof allPlaylists !== "undefined")) {
        self.chosenPlaylistId(selectedPlaylist);
      }
      else {
        self.chosenPlaylistId('Dashboard');
      }
    });

    this.notFound = function(verb, path) {
      if(this.debug) {
        var ret = this.error(['404 Not Found', verb, path].join(' '));
        return (verb === 'get') ? ret : true;
      }
    };
    if (this.debug === false) {
      this.log = function(){
        return false;
      };
    }

    this._checkFormSubmission = function(form) {
      var $form = $(form),
        path = $form.attr("action");

      // if not the mailchimp form and not a path doesn't match '#'
      if($form.attr("id") !== 'mc-embedded-subscribe-form' && !(/^#/).test(path)) {
        return false;
      } else {
        return this._checkFormSubmission(form);
      }
    };

    this.restart = function() {
      this.setLocation( this.getLocation() );
    };

    this.get('', function () { this.app.runRoute('get', '#Dashboard');});
  }).run('');
};

var playerModel = function() {
  var self = this;
  var vmv = ViewModelVar;

  // Variables and Function for sortable / drag-drop
  self.lastAction = ko.observable();
  self.lastError = ko.observable();
  self.volume = ko.observable(35);
  self.previousVolume = ko.observable();

  // see min 32.55 - http://www.knockmeout.net/2012/08/thatconference-2012-session.html

  // Bind a click event to the volume button, calling the Mute / Unmute function
  self.triggerVolume = function () {
    if (soundManager.muted) {
      soundManager.unmute();
      self.volume(self.previousVolume());
    }
    else {
      soundManager.mute();
      self.previousVolume(self.volume());
      self.volume(0);
    }
  };

  self.prevTrack = function () {
    if (vmv.next_index > 0) {
      vmv.next_index -= 2;
      self.nextTrack(vmv.next_index);
    }
    else {
      //start from the beginning of the current song
      // soundManager.play('track_' + vmv.playingPlaylistData()[vmv.next_index].sm2id);
      soundManager.setPosition('track_' + vmv.playingPlaylistData()[vmv.next_index].sm2id, 0);
    }
  };

  self.nextTrack = function () {
    soundManager.stopAll();
    $('.currentlyplaying').removeClass('icon-play');
    if (vmv.next_index < vmv.playingPlaylistData().length) {
      vmv.next_index++;
      soundManager.play('track_' + vmv.playingPlaylistData()[vmv.next_index].sm2id);
      $('table.table-striped').find('tr').eq(vmv.next_index).find('i.currentlyplaying').addClass('icon-play');
    }
  };
};

// check local storage for playlists
var playlists = ko.utils.parseJson( localStorage.getItem('playlists-crately') );

// bind a new instance of our view model to the page
ViewModelVar = new ViewModel( playlists || [] );
ko.bindingHandlers.sortable.afterMove = ViewModelVar.updateLastAction;

ko.applyBindings(ViewModelVar, DO('appcontainer') );
playerModelVar = new playerModel();
ko.applyBindings(playerModelVar, document.getElementsByClassName('bottomplayer')[0]);
