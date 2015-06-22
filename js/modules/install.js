var Install = function()
{
    this.url = location.href.replace(/[^\/]+$/,'')+'/manifest.webapp';
    this.install = function()
    {
        var self=this;
        console.log('create promise install');
        return new Promise(function(ok, reject)
        {
            console.log('run promise install');
            if(!/http/.test(location.href))
            {
                reject();
                return;
            }
            console.log('requestion ',self.url);
            var request = window.navigator.mozApps.install(self.url);
            request.onsuccess = ok;
            request.onerror = reject;
        });
    };

    this.notinstalled= function()
    {
        var self=this;
        console.log('new promise notinstalled');
        return new Promise(function(ok, reject)
        {
            console.log('run promise notinstalled');
            // already app:// installed
            if(!/http/.test(location.href))
            {
                reject();
                return;
            }
            var request = window.navigator.mozApps.checkInstalled(self.url);
            request.onerror = reject;
            request.onsuccess = function(e)
            {
                return request.result ? reject () : ok();
            };
        });
    };
};
