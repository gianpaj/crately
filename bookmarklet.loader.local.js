// ListenToItLater

javascript:(function(){
  var d = document, orgtitle,
    z = d.createElement('scr' + 'ipt'),
    b = d.body,
    t = d.title;
    l = d.location.protocol;

  function contains(something, str) {
    return something.indexOf(str) != -1;
  }
  
  try {
    if (!b) throw (0);
    matches = /https?:\/\/(?:www\.)?soundcloud\.com\/([\w-_\/]+)\/([\w-_\/]+)/.exec(d.URL);
    if (!matches) throw (1);
    if (contains(d.URL, '/sets/')) throw (2);
    if (contains(d.URL, '/groups/')) throw (2);
    if (t.substring(0, 12) == '(Saving...) ') {
      t = t.substring(12);
    }
    t = '(Saving...) '+t;

    z.setAttribute('src', 'https://0.0.0.0:8000/static/js/bookmarklet.script.local.js?t=' + encodeURIComponent(d.title) + '&d=' + (new Date().getTime()));
    b.appendChild(z);
  }
  catch (e) {
    if (e === 0) {
      alert('Please wait until the page has loaded.');
    }
    else if (e === 1) {
      alert("ListenToItLater bookmarklet works with SoundCloud only. Sorry");
    }
    else {
      alert("Works only with SoundCloud tracks (not sets or groups). Navigate to each track to save it to ListenToItLater");
    }
  }
})();
void(0);