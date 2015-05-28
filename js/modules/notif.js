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
        if (Notification.permission === "granted")
        {
            var n = new Notification(title, {
                body: body,
                icon: 'img/icons/icon60x60.png'
            });
        }
    };
};

