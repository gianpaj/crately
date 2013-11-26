/* Author: Gianfranco */
(function(){
  if (typeof UIinit === 'undefined') {
    var UIinit = {};
  }
  // var intercomSettings;

  UIinit = {
    init: function () {
      $.ajax('/api/user/me', {
        type: 'get',
        contentType: 'application/json',
        success: function (data) {
          // if Unauthorized (@login_required decorator in python)
          if (data.status === 401) {
            location.hash = "Dashboard";
            // go to dashboard
          } else {
            UIinit.UIlogin(data);
          }
        },
        error: function (xhr) {
          log(xhr);
          log('get /api/user/me failed');
        }
      });
    },

    UIlogin: function (data) {
      var i, icon = null;
      // log('parsed data:');
      // log(data);

      if ( !devmode ) {

        var profile = {name : data.username};
        if (data.email) {
          profile.email = data.email;
        }
        analytics.identify(data.username+Math.round((new Date(data.date_registered)).getTime() / 1000), profile);

        analytics.track('Active on the site', {
          last_seen: new Date()
        });

        soundManager.onready(function() {
          // Ready to use; soundManager.createSound() etc. can now be called.
          log('soundmanager2 ready!');
          $('#sm2-status').hide();
        });
        soundManager.ontimeout(function() {
          analytics.track('Flash Blocked', {});

          noty({"text":"Flash movie has not loaded (likely flash-blocked). Please allow Flash from this site to enable sound reproduction.",
            "layout":"topCenter", "type":"error", "textAlign":"center", "easing":"swing",
            "animateOpen":{"height":"toggle"}, "animateClose":{"height":"toggle"},
            "speed":"500", "timeout":"3000", "closable":true, "closeOnSelfClick":true});
        });
      }

      ViewModelVar.username(data.username);
      ViewModelVar.allPlaylists.push(new Playlist('Search Results',[], 'icon-search', true));

      for (i = 0; i < data.playlists.length; i++) {
        if (data.playlists[i].title === 'Favorites') {
          icon = 'icon-star';
        } else {
          icon = 'icon-music';
        }
        ViewModelVar.addPlaylist(data.playlists[i].title, data.playlists[i].recordings, icon, data.playlists[i]['default']);
      }
    }
  };

  /* call init on document load */
  $(document).ready(UIinit.init);

  // Player SoundManager GUI Actions
  // Bind a click event to the play / pause button
  $('.play, .pause').live('click', function() {
    if ($('.player').attr('class').contains('playing')) {
      soundManager.pauseAll();
    } else {
      // TODO: if soundManager has no sound pick the first from the current playlist
      soundManager.resumeAll();
    }
  });

  $('div.modal').on('shown', function () {
    $('input:text:visible:first', this).focus();
  });


  $('a.facebook').click(function () {
    window.open('/fblogin', 'SignIn Facebook', 'location=yes, scrollbars=yes, width=640, height=359');
  });

  $('a.twitter').click(function () {
    window.open('/twlogin', 'SignIn Twitter', 'location=yes, scrollbars=yes, width=800, height=400');
    /*
    if value is returned from the login window
      analytics.track('Account Created with Twitter', {});
    */
  });
})();

var tooltip = $('.volumetooltip');