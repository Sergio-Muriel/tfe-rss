var Settings = function()
{
    "use strict";
    this.form= null;
    this.controller = null;

    this.init =  function(controllers)
    {
        var self=this;
        this.controllers = controllers;

        this.view_read = document.querySelector('#view_read');
        this.hide_content = document.querySelector('#hide_content');
        this.hide_image = document.querySelector('#hide_image');
        this.view_notification = document.querySelector('#view_notification');


        this.bind();
        this.restoreSettings();

        this.init_accounts();

    }; 

    this.add_api = function(id, text, form)
    {
        var layer = document.querySelector('#register_layer');
        var select = document.querySelector('#api');
        var option = document.createElement('option');
        option.value=id;
        option.innerHTML=text;
        select.appendChild(option);
        layer.insertBefore(form, layer.firstChild);
    };

    this.init_accounts=function()
    {
        var self=this;
        var promises =  [];
        this.controllers.forEach(function(controller)
        {
            promises.push(
                    controller.init().then(self.init_account.bind(self,controller))
            );
        });
        Promise.all(promises)
            .then(function()
            {
                if(!self.loggedin)
                {
                    self.controllers.forEach(function(_controller)
                    {
                        self.set_api(_controller.type);
                    });
                    Array.forEach(document.querySelectorAll('.loggedout'),function(item) { item.classList.remove('hidden'); });
                    Array.forEach(document.querySelectorAll('.loggedin'),function(item) { item.classList.add('hidden'); });
                    layout.display_right();
                }
                else
                {
                    layout.clear();
                    Array.forEach(document.querySelectorAll('.loggedout'),function(item) {  item.classList.add('hidden'); });
                    Array.forEach(document.querySelectorAll('.loggedin'),function(item) {  item.classList.remove('hidden'); });
                }
            });
    };

    this.set_update_time=function(time)
    {
        var options=[];
        var select = document.querySelector('#update_time');
        Array.forEach(select.options, function(option)
        {
            options.push(option.value);
        });
        select.selectedIndex = options.indexOf(time+'');

        clearInterval(this.update_time_timer);
        this.update_time_timer=null;
        localStorage.setItem('updateTime', time);
        if(time>0)
        {
            this.update_time_timer = setInterval(layout.clearAndLoadItems.bind(layout),  time*60*1000);
        }
    };

    this.set_api=function(api)
    {
        console.log('set api ',api);
        var layer = document.querySelector('#register_layer');
        var select = document.querySelector('#api');
        var options=[];
        Array.forEach(select.options, function(option)
        {
            options.push(option.value);
        });
        select.selectedIndex = options.indexOf(api);
        Array.forEach(layer.querySelectorAll('#register_layer>form'), function(form)
        {
            if(form.id!==api)
            {
                form.classList.add('hidden');
            }
            else
            {
                form.classList.remove('hidden');
            }
        });
    };

    this.init_account=function(_controller)
    {
        var self=this;

        return new Promise(function(ok, reject)
        {
            var list_accounts = _controller.getAccount(function(list)
            {
                if(list)
                {
                    self.loggedin=true;

                    // Send controller to objects
                    layout.setController(_controller);
                    // Set selected item
                    self.set_api(_controller.type);

                    // Save used current controller
                    self.controller  = _controller;

                    _controller.loggedin();
                    layout.display_center();

                    layout.updateLeftList()
                        .then(layout.displayDefaultLabel.bind(layout));

                    _controller.fullupdate()
                        .then(layout.updateLeftList.bind(layout));
                    ok();
                }
                else
                {
                    ok();
                }
            });
        });
    };

    this.bind= function()
    {
        var self=this;
        this.view_read.addEventListener('click', function(e) { return self.toggleViewRead(e); });
        this.hide_content.addEventListener('click', function(e) { return self.toggleHideContent(e); });
        this.hide_image.addEventListener('click', function(e) { return self.toggleHideImage(e); });
        this.view_notification.addEventListener('click', function(e) { return self.toggleViewNotification(e); });

        document.querySelector('#api').addEventListener('change', function(e) { return self.set_api(e.target.value); });
        document.querySelector('#update_time').addEventListener('change', function(e) { return self.set_update_time(e.target.value); });
    };

    this.restoreSettings= function()
    {
        if(this.getViewRead())
        {
            this.view_read.classList.remove('fa-toggle-off');
            this.view_read.classList.add('fa-toggle-on');
        }
        else
        {
            this.view_read.classList.add('fa-toggle-off');
            this.view_read.classList.remove('fa-toggle-on');
        }

        if(this.getHideContent())
        {
            this.hide_content.classList.remove('fa-toggle-off');
            this.hide_content.classList.add('fa-toggle-on');
        }
        else
        {
            this.hide_content.classList.add('fa-toggle-off');
            this.hide_content.classList.remove('fa-toggle-on');
        }
        if(this.getHideImage())
        {
            this.hide_image.classList.remove('fa-toggle-off');
            this.hide_image.classList.add('fa-toggle-on');
        }
        else
        {
            this.hide_image.classList.add('fa-toggle-off');
            this.hide_image.classList.remove('fa-toggle-on');
        }

        if(this.getViewNotification())
        {
            this.view_notification.classList.remove('fa-toggle-off');
            this.view_notification.classList.add('fa-toggle-on');
        }
        else
        {
            this.view_notification.classList.add('fa-toggle-off');
            this.view_notification.classList.remove('fa-toggle-on');
        }

        this.set_update_time(this.getUpdateTime());
    };

    this.logout= function(e)
    {
        this.loggedin=false;
        layout.reset();
        this.init_accounts();
    };

    this.register= function(e)
    {
        window.open(this.controller.getRegisterLink());
        e.preventDefault();
        return false;
    };

    this.toggleViewRead= function(e)
    {
        console.log('set  to ', this.view_read.classList.contains('fa-toggle-off'));
        localStorage.setItem('viewRead', this.view_read.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.toggleHideContent= function(e)
    {
        console.log('set  to ', this.hide_content.classList.contains('fa-toggle-off'));
        localStorage.setItem('hideContent', this.hide_content.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.toggleHideImage= function(e)
    {
        console.log('set  to ', this.hide_image.classList.contains('fa-toggle-off'));
        localStorage.setItem('hideImage', this.hide_image.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.toggleViewNotification= function(e)
    {
        console.log('set  to ', this.view_notification.classList.contains('fa-toggle-off'));
        localStorage.setItem('viewNotification', this.view_notification.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.isLoggedIn = function()
    {
        return this.controller ? this.controller.isLoggedIn() : false;
    };

    this.getViewRead = function()
    {
        var value= localStorage.getItem('viewRead');
        if(value!==null) { return value==='true' ? true : false; }
        return true; // default value, checked
    };
    this.getHideContent = function()
    {
        var value= localStorage.getItem('hideContent');
        if(value!==null) { return value==='true' ? true : false; }
        return false; // default value, unchecked
    };
    this.getHideImage = function()
    {
        var value= localStorage.getItem('hideImage');
        if(value!==null) { return value==='true' ? true : false; }
        return false; // default value, unchecked
    };
    this.getViewNotification = function()
    {
        var value= localStorage.getItem('viewNotification');
        if(value!==null) { return value==='true' ? true : false; }
        return true; // default value, checked
    };
    this.getUpdateTime = function()
    {
        return localStorage.getItem('updateTime') || 15;
    };

};
