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
        this.view_list = document.querySelector('#view_list');


        this.bind();
        this.restoreSettings();

        this.init_accounts();

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
        layer.setAttribute('data-api', api);
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
        this.view_list.addEventListener('click', function(e) { return self.toggleViewList(e); });

        document.querySelector('#api').addEventListener('change', function(e) { return self.set_api(e.target.value); });
    };

    this.restoreSettings= function()
    {
        this.view_read.checked =  this.getViewRead();
        this.view_list.checked =  this.getViewList();
        this.view_list.checked =  this.getViewList();

        this.set_update_time(this.getUpdateTime());
    };

    this.logout= function(e)
    {
        this.loggedin=false;
        layout.clear();
        layout.clearLeft();
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
        localStorage.setItem('viewRead', this.view_read.checked ? 1 : 0);
        layout.clearAndLoadItems();
    };

    this.toggleViewList= function(e)
    {
        localStorage.setItem('viewList', this.view_list.checked ? 1 : 0);
        layout.clearAndLoadItems();
    };

    this.isLoggedIn = function()
    {
        return this.controller ? this.controller.isLoggedIn() : false;
    };

    this.getViewRead = function()
    {
        return localStorage.getItem('viewRead') !== "0" ? true : false;
    };
    this.getViewList = function()
    {
        return localStorage.getItem('viewList') !== "0" ? true : false;
    };
    this.getUpdateTime = function()
    {
        return localStorage.getItem('updateTime') || 15;
    };

};
