var Notif = function()
{
    this.init = function()
    {
        if (Notification.permission !== "granted") {
            Notification.requestPermission(function() {});
        }
    };
    this.send = function(title, body)
    {
        if (settings.getViewNotification() && Notification.permission === "granted")
        {
            var n = new Notification(title, {
                body: body,
                tag: 'tfe RSS',
                icon: location.href.replace('index.html','')+'/img/icons/icon60x60.png'
            });
            n.onclick = this.receive.bind(this,n);
        }
    };

    this.receive = function(n)
    {
        n.close();
        navigator.mozApps.getSelf().onsuccess = function() { this.result.launch(); };
    };
};

