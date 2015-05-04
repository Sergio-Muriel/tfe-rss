var Activities = function()
{
    this.controller = null;

    this.init= function(controller)
    {
        this.controller = controller;
        navigator.mozSetMessageHandler("activity", this.getMessage.bind(this));
    };
    this.getMessage= function(receive)
    {
        console.log('receive',receive);
        if(receive.source.data.type=='url')
        {
            this.controller.addFeed(receive.source.data.url)
            .then(
            function(result)
            {
                var translate = navigator.mozL10n.get;
                layout.updateLeftList();
                alert(translate('feed_added'));
            },
            function(result)
            {
                var translate = navigator.mozL10n.get;
                alert(translate('feed_added_error'));
            });
        }
    };
};

