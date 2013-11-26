/* global DO: false, emailInput: false, checkEmail: false, devmode: false, analytics: false */

'use strict';

function newAlert(alert_area, alert_type, message) {
  $(alert_area).append($('<div class="alert ' + alert_type + ' fade in">' +
                '<strong>' + message + '</strong>' +
              '</div>'));
  $('div.alert').delay(1500).fadeOut('slow', function () { $(this).remove(); });
}

$('div.modal').on('shown', function () {
  $('input:text:visible:first', this).focus();
});

var requestInvite = function () {
  var self = this;
  self.email = ko.observable('');

  self.sendRequest = function () {
    newAlert('#requestInviteAlert', 'alert-error', 'Sorry Crate.ly has been discontinued :(');
    return;
    if (self.email() === '') {
      newAlert('#requestInviteAlert', 'alert-error', 'Email can\'t be empty');
      emailInput.focus();
    }
    else if (!checkEmail(self.email())) {
      newAlert('#requestInviteAlert', 'alert-error', 'Invalid email');
      emailInput.focus();
    }
    else {
      $.ajax({
        url: '',
        data: { EMAIL: self.email() },
        dataType: 'jsonp',
        error: function (resp, text) {
          console.log('mailchimp ajax submit error: ' + text);
        },
        success: function (data) {
          console.log(data);
          if (data.result !== 'success') {
            if (data.msg.indexOf('already subscribed') !== -1) {
              newAlert('#requestInviteAlert', 'alert-error', 'Your email is already registered.');
            }
            else {
              newAlert('#requestInviteAlert', 'alert-error', 'We couldn\'t register your email. Please try again later.');
            }
          }
          else {
            newAlert('#requestInviteAlert', 'alert-success', 'We just sent you a confirmation email. Please click the link in the email we just sent you.');
            if (!devmode) {
              analytics.identify(self.email() + Math.round((new Date(data.date_registered)).getTime() / 1000), {
                email: self.email()
              });
              analytics.track('New invitation request', {
                email: self.email()
              });
            }
          }
        }
      });
    }

  }; /* requestInvite */
};

ko.applyBindings(new requestInvite(), DO('requestInvite'));