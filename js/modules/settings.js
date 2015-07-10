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
        this.show_content = document.querySelector('#show_content');
        this.show_image = document.querySelector('#show_image');
        this.show_labels = document.querySelector('#show_labels');
        this.view_notification = document.querySelector('#view_notification');
        this.hide_regex = document.querySelector('#hide_regex');
        this.max_search_items = document.querySelector('#max_search_items');
        this.invalid_regex = document.querySelector('#invalid_regex');


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
        layer.appendChild(form);
        //layer.insertBefore(form, layer.firstChild);
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

    this.set_lang=function(lang, reload)
    {
        var options=[];
        var select = document.querySelector('#lang');
        Array.forEach(select.options, function(option)
        {
            options.push(option.value);
        });
        select.selectedIndex = options.indexOf(lang+'');

        if(reload)
        {
            localStorage.setItem('lang', lang);
            location.reload();
        }
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
            this.update_time_timer = setInterval(layout.refresh.bind(layout),  time*60*1000);
        }
    };

    this.set_api=function(api)
    {
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
        this.show_content.addEventListener('click', function(e) { return self.toggleShowContent(e); });
        this.show_image.addEventListener('click', function(e) { return self.toggleShowImage(e); });
        this.show_labels.addEventListener('click', function(e) { return self.toggleShowLabels(e); });
        this.view_notification.addEventListener('click', function(e) { return self.toggleViewNotification(e); });

        this.hide_regex.addEventListener('change', function(e) { return self.updateHideRegex(e,1); });
        this.hide_regex.addEventListener('keyup', function(e) { return self.updateHideRegex(e,0); });

        this.max_search_items.addEventListener('change', function(e) { return self.updateMaxSearchItems(e,1); });
        this.max_search_items.addEventListener('keyup', function(e) { return self.updateMaxSearchItems(e,0); });

        this.alert_container = document.querySelector('.slide.right .alert_container');
        this.alert_msg = document.querySelector('.slide.right .alert');

        document.querySelector('#api').addEventListener('change', function(e) { return self.set_api(e.target.value); });
        document.querySelector('#lang').addEventListener('change', function(e) { return self.set_lang(e.target.value, true); });
        document.querySelector('#update_time').addEventListener('change', function(e) { return self.set_update_time(e.target.value); });

        // Toggle labels
        Array.forEach(document.querySelectorAll('fieldset.toggle legend'), function(item)
        {
            item.addEventListener('click', self.toggle_legend.bind(self));
        });
    };

    this.alert=function(msg,time)
    {
        if(!time) { time= 2000; }
        this.alert_msg.innerHTML=msg;
        this.alert_container.classList.add('visible');
        clearTimeout(this.alert_timeout);
        this.alert_timeout = setTimeout(this.alert_hide.bind(this), time);
    };
    this.alert_hide = function()
    {
        this.alert_container.classList.remove('visible');
    };

    this.toggle_legend = function(item)
    {
        var fieldset = item.target;
        while(fieldset && fieldset.tagName!=='FIELDSET')
        {
            fieldset = fieldset.parentNode;
        }
        if(fieldset.classList.contains('opened'))
        {
            fieldset.classList.remove('opened')
        }
        else
        {
            fieldset.classList.add('opened')
        }
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

        if(this.getShowContent())
        {
            this.show_content.classList.remove('fa-toggle-off');
            this.show_content.classList.add('fa-toggle-on');
        }
        else
        {
            this.show_content.classList.add('fa-toggle-off');
            this.show_content.classList.remove('fa-toggle-on');
        }
        if(this.getShowLabels())
        {
            console.log('show labels');
            this.show_labels.classList.remove('fa-toggle-off');
            this.show_labels.classList.add('fa-toggle-on');
            Array.forEach(document.querySelectorAll('.center_menu'), function(item)
            {
                item.classList.add('with_labels');
            });
        }
        else
        {
            console.log('hide labels');
            this.show_labels.classList.add('fa-toggle-off');
            this.show_labels.classList.remove('fa-toggle-on');
            Array.forEach(document.querySelectorAll('.center_menu'), function(item)
            {
                item.classList.remove('with_labels');
            });
        }
        if(this.getShowImage())
        {
            this.show_image.classList.remove('fa-toggle-off');
            this.show_image.classList.add('fa-toggle-on');
        }
        else
        {
            this.show_image.classList.add('fa-toggle-off');
            this.show_image.classList.remove('fa-toggle-on');
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

        this.hide_regex.value= this.getHideRegex();
        this.max_search_items.value= this.getMaxSearchItems();


        this.set_update_time(this.getUpdateTime());
        this.set_lang(this.getLang());
    };

    this.getLang= function()
    {
        return localStorage.getItem('lang') || navigator.language;
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
        localStorage.setItem('viewRead', this.view_read.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.toggleShowContent= function(e)
    {
        localStorage.setItem('showContent', this.show_content.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.toggleShowLabels= function(e)
    {
        localStorage.setItem('showLabels', this.show_labels.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.toggleShowImage= function(e)
    {
        localStorage.setItem('showImage', this.show_image.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.toggleViewNotification= function(e)
    {
        localStorage.setItem('viewNotification', this.view_notification.classList.contains('fa-toggle-off'));
        layout.clearAndLoadItems();
        this.restoreSettings();
    };

    this.updateHideRegex= function(e, do_warn)
    {
        try
        {
            var re = new RegExp(this.hide_regex.value,'i');
            this.invalid_regex.classList.add('valid');
        }
        catch(err)
        {
            this.invalid_regex.classList.remove('valid');
            if(do_warn)
            {
               return this.alert(translate('invalid_regex'));
            }
        }

        if(do_warn)
        {
            localStorage.setItem('hideRegex', this.hide_regex.value);
            layout.clearAndLoadItems();
            this.restoreSettings();
        }
    };

    this.updateMaxSearchItems= function(e, do_warn)
    {
        var value = this.max_search_items.value;
        if(/^[1-9][0-9]*$/.test(value))
        {
            this.invalid_regex.classList.add('valid');
        }
        else
        {
            if(do_warn)
            {
                this.max_search_items.value= this.getMaxSearchItems();
            }
        }

        if(do_warn)
        {
            localStorage.setItem('maxSearchItems', this.max_search_items.value);
            this.restoreSettings();
        }
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
    this.getShowContent = function()
    {
        var value= localStorage.getItem('showContent');
        if(value!==null) { return value==='true' ? true : false; }
        return true; // default value, checked
    };
    this.getShowLabels = function()
    {
        var value= localStorage.getItem('showLabels');
        if(value!==null) { return value==='true' ? true : false; }
        return true; // default value, checked
    };
    this.getShowImage = function()
    {
        var value= localStorage.getItem('showImage');
        if(value!==null) { return value==='true' ? true : false; }
        return true; // default value, checked
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

    this.getHideRegex = function()
    {
        var value= localStorage.getItem('hideRegex');
        if(value!==null) { return value; }
        return 'sponsored'; // Default regex
    };

    this.getMaxSearchItems = function()
    {
        var value= localStorage.getItem('maxSearchItems');
        if(value!==null) { return value; }
        return 100; // Default regex
    };

};
