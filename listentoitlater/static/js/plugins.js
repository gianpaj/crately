/* global log: false, console: false */

'use strict';

// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function f() {
  log.history = log.history || [];
  log.history.push(arguments);
  if (this.console) {
    var args = arguments, newarr;
    args.callee = args.callee.caller;
    newarr = [].slice.call(args);
    if (typeof console.log === 'object') {
      log.apply.call(console.log, console, newarr);
    }
    else {
      console.log.apply(console, newarr);
    }
  }
};

// make it safe to use console.log always
(function (a) { function b() {}for (var c = 'assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn'.split(','), d;!!(d = c.pop());) {a[d] = a[d] || b; }})
(function () {
  try {
    console.log();
    return window.console;
  }
  catch (a) {
    return (window.console === {});
  }
}());

// jQuery mapping for focus on the empty input form
var LusernameInput = $( '#loginForm input[id=usernameL]' );
var LpasswordInput = $( '#loginForm input[id=passwordL]' );

var CAusernameInput = $( '#createAccountForm input[id=usernameC]' );
var emailInput = $( '#createAccountForm input[id=email]' );
var CApasswordInput = $( '#createAccountForm input[id=passwordC]' );

function checkLength(o, min, max) {
  if (o.length > max || o.length < min) {
    return false;
  } else {
    return true;
  }
}

function checkRegexp(o, regexp) {
  if (!regexp.test(o)) {
    return false;
  } else {
    return true;
  }
}

function checkEmail(email) {
  // From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
  return checkRegexp(email, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
}

/******************************************************************************
 * General Methods
 *****************************************************************************/
function DO(domId) {
  return window.document.getElementById(domId);
}

// simple function to check if a string starts with another
// ie. 'http://www'.startsWith('http') => true
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function (str) {
    return this.substring(0, str.length) === str;
  };
}

if (!String.prototype.contains) {
  String.prototype.contains = function (str) {
    return this.indexOf(str) !== -1;
  };
}

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

(function ($) {
  $('div.modal').on('shown', function () {
    $('input:text:visible:first', this).focus();
  });
})(jQuery);

// jQuery mapping for focus on the empty input form
var emailInput = $('#requestInviteForm input[id=email]');
