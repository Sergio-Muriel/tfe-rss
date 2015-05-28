// Init classes
var translate = navigator.mozL10n.get;

var theoldreader = new TheOldReader();
var tinytinyrss = new Tinytinyrss();
//var feedly = new Feedly();
var layout =  new Layout();
var settings =  new Settings();
var notif = new Notif();


// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
    'use strict';

    layout.init();

    // Add the old reader support
    settings.init([theoldreader, tinytinyrss]);
    notif.init();
});
