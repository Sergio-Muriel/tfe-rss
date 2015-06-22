var Install = function()
{
    this.install = function()
    {
        if(!/http/.test(location.href))
        {
            console.log('not available here');
            return;
        }
        var request = window.navigator.mozApps.install(location.href.replace('index.html','manifest.webapp'));
        request.onsuccess = function () {
            // Save the App object that is returned
            var appRecord = this.result;
            alert('Installation successful!');
        };
        request.onerror = function () {
            // Display the error information from the DOMError object
            alert('Install failed, error: ' + this.error.name);
        };
    };
};
