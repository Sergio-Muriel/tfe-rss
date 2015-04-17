// Init classes
var theoldreader = new TheOldReader();
var layout =  new Layout();
var login =  new Login();


// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
    'use strict';

    layout.init(theoldreader);

    // Add the old reader support
    login.init(theoldreader);
});
