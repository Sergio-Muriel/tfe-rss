// DOMContentLoaded is fired once the document has been loaded and parsed,
// but without waiting for other external resources to load (css/images/etc)
// That makes the app more responsive and perceived as faster.
// https://developer.mozilla.org/Web/Reference/Events/DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
    'use strict';

    var login =  new Login();

    // Add the old reader support
    var theoldreader = new TheOldReader();
    login.init(theoldreader);

    var list_accounts = theoldreader.getAccounts(function(list)
      {
          console.log('list ',list);
      });

    // Export to debug
    window.theoldreader = theoldreader;
    window.login = login;
});
