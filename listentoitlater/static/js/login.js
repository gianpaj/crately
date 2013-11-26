function newAlert (alert_area, message) {
  $(alert_area).append($('<div class="alert alert-error fade in">'+
                '<strong>' + message + '</strong>'+
              '</div>'));
  $('div.alert').delay(1500).fadeOut('slow', function () { $(this).remove(); });
}

var loginModel = function() {
  // Data
  var self = this;
  self.username = ko.observable('');
  self.password = ko.observable('');

  self.doLogin = function() {
    if ( self.username() === '' ) {
      newAlert('#loginAlert', 'Username can not be empty');
      LusernameInput.focus();
    }
    else if ( self.password() === '' ) {
      newAlert('#loginAlert', 'Password can not be empty');
      LpasswordInput.focus();
    }
    else {
      $.ajax('/login', {
        data: ko.toJSON({ username: self.username(), password: self.password() }),
        type: 'post',
        contentType: 'application/json',
        success: function(data) {

          if ( data.result ) {
            newAlert('#loginAlert', data.result);
          }
          else {
            if ( !devmode ) {
              analytics.identify(data.username+Math.round((new Date(data.date_registered)).getTime() / 1000), {
                name: self.username()
              });
              analytics.track('Manual Login', {
                date_last_login: new Date()
              });
            }

            window.location.reload();
          }
        },
        error: function (data) {
          log('doLogin failed ' + data);
        }
      });
    }
  }; /* doLogin */
};

var createAccountModel = function() {
  // Data
  var self = this;
  self.username = ko.observable('');
  self.email = ko.observable('');
  self.password = ko.observable('');

  self.doAccount = function() {
    if ( self.username() === '' ) {
      newAlert('#createAccountAlert', 'Username can\'t be empty');
      CAusernameInput.focus();
    }
    else if ( !checkLength( self.username(), 3, 25 ) ) {
      newAlert('#createAccountAlert', 'Username must be 3-25 characters');
      CAusernameInput.focus();
    }
    else if ( !checkRegexp( self.username(), /^[a-z]([0-9a-z_])+$/i ) ) {
      newAlert('#createAccountAlert',  'Username may consist of a-Z, 0-9, underscores, begin with a letter.');
      CAusernameInput.focus();
    }
    else if ( self.email() === '' ) {
      newAlert('#createAccountAlert', 'Email can\'t be empty');
      emailInput.focus();
    }
    else if ( !checkEmail(self.email()) ) {
      newAlert('#createAccountAlert', 'Invalid email');
      emailInput.focus();
    }
    else if ( self.password() === '' ) {
      newAlert('#createAccountAlert', 'Password can\'t be empty');
      CApasswordInput.focus();
    }
    else if ( !checkLength( self.password(), 4, 32 ) ) {
      newAlert('#createAccountAlert', 'Password must be 4-32 characters');
      CApasswordInput.focus();
    }
    else {
      $.ajax('/create-account', {
        data: ko.toJSON({ username: self.username(), email: self.email(), password: self.password() }),
        type: 'post',
        contentType: 'application/json',
        success: function(data) {
          // log(data);
          if ( data.result ) {
            newAlert('#createAccountAlert', data.result);
          }
          else if ( data ) {
            if ( !devmode ) {
              analytics.identify(data.username+Math.round((new Date(data.date_registered)).getTime() / 1000), {
                  name             : self.username()
              });
              analytics.track('Manual Account Created', {
                date_registered: new Date(data.date_registered)
              });
            }

            window.location.reload();
          }
        },
        error: function (response) {
          log('Failed ' + response);
        }
      });
    }
  }; /* doAccount */
};

ko.applyBindings(new loginModel(), DO('loginModal') );
ko.applyBindings(new createAccountModel(), DO('createAccountModal') );