(function()
{
    "use strict";
    window.addEventListener('DOMContentLoaded', function() {
          // We want to wait until the localisations library has loaded all the strings.
          // So we'll tell it to let us know once it's ready.
          navigator.mozL10n.once(start);
    });

    function start()
    {
          var translate = navigator.mozL10n.get;
          var inputs = document.querySelectorAll('input[data-l10n-placeholder]');
          Array.forEach(inputs, function(item)
          {
              item.setAttribute('placeholder', translate(item.getAttribute('data-l10n-placeholder')));
          });
    }

})();
