// Bookmarklet for localhost tests v1 for ListenToItLater w/out Mixpanel

(function(){
  var rec,
    snd_client_id = '',
    jQuery_version = '1.7.1',
    d = document,
    b = d.body;

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
    this.artwork_url = artwork_url || 'https://0.0.0.0:8000/static/img/75x75.gif';
  };

  function Notify(msg) {
    $lilnotification = $('#lilnotification');
    $lilnotification.html(msg);
    $lilnotification.miniNotification({
      closeButton: true,
      closeButtonText: '[hide]',
      closeButtonClass: 'lilhide',
      innerDivClass: 'lilinner'
    });
    $lilnotification.find('.lilhide').css('margin-left','66px');
  }

  function AddRecording() {
    $.ajax({
      url: 'https://0.0.0.0:8000/api/user/me/playlists/Favorites',
      type: 'POST',
      data: JSON.stringify(rec),
      xhrFields: { withCredentials: true },
      contentType: 'application/json',
      success: function(data) {
        // if Unauthorized (@login_required decorator in python)
        if (data.status == 401) {
          Notify('You must be logged into <a href="https://listentoitlater.co" target="_blank">ListenToItLater</a>');
        }
        else {
          Notify('Added to your <a href="https://listentoitlater.co" target="_blank">ListenToItLater</a> ' + 'Favorites');
        }
      },
      error: function (response) {
        console.log('Failed ' + response);
      }
    });
  }

  function Init () {
    // Inject HTML
    $('body').append('<div id="lilnotification" style="'+
      'display: none;'+
      'opacity: 0.95;'+
      'top: -46px;'+
      'position: fixed;'+
      'cursor: pointer;'+
      'width: 100%;'+
      'background: #EFEFEF;'+
      'text-align: center;'+
      'border-top: 2px solid #FFF;'+
      'z-index:9999;'+
      'font-family: helvetica,,arial,sans-serif;'+
      'margin: 0 auto;">'+
      '</div>');

    // get the song information from the SoundCloud API
    $.getJSON('https://api.soundcloud.com/resolve?url=' + encodeURIComponent(d.URL) + '&format=json&consumer_key=' + snd_client_id + '&callback=?', function(data) {
      var rec_url = data.permalink_url.replace('http://soundcloud.com','');
      // create the recording JS obj that will be send to the server (serialized)
      rec = new Recording(data.title+' by '+data.user.username, 'SoundCloud', 'http://soundcloud.com', rec_url, data.duration, data.id, data.user_id, data.artwork_url);
      // console.log(JSON.stringify(rec));
    }).done(function() {
      AddRecording();
    });
  }

  // load jQuery if not already
  function loadScript(url, callback) {
    if (!window.jQuery || jQuery.fn.jquery <= jQuery_version) {
      var head = d.getElementsByTagName("head")[0];
      var z = d.createElement("scr"+"ipt");
      z.src = url;

      // Attach handlers for all browsers
      var done = false;
      z.onload = z.onreadystatechange = function() {
        if( !done && ( !this.readyState || this.readyState == "loaded" || this.readyState == "complete") )
        {
          done = true;

          // Continue your code
          callback();

          // Handle memory leak in IE
          z.onload = z.onreadystatechange = null;
          head.removeChild( z );
        }
      };

      head.appendChild(z);
    }
  }

  // This code loads jQuery and executes Init when jQuery is loaded
  loadScript('https://ajax.googleapis.com/ajax/libs/jquery/' + jQuery_version + '/jquery.min.js', function() {
    loadScript('https://0.0.0.0:8000/static/js/libs/miniNotification.min.js', function() {
      Init();
    });
  });

})();