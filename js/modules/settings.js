var Settings = function()
{
    "use strict";
    this.form= null;
    this.controller = null;

    this.init =  function(controller)
    {
        var self=this;
        this.controller = controller;
        this.form = document.querySelector('#register_layer form');
        this.login_link = document.querySelector('.login_link');
        this.logout_link = document.querySelector('.logout_link');
        this.register_link = document.querySelector('.register_link');
        this.email = this.form.querySelector('input[name=email]');
        this.password = this.form.querySelector('input[name=password]');

        this.view_read = document.querySelector('#view_read');
        this.view_title_only = document.querySelector('#view_title_only');


        this.bind();
        this.restoreSettings();
        this.controller.initDb()
            .then(this.init_account.bind(this));
    }; 

    this.init_account=function()
    {
        var self=this;
        var list_accounts = this.controller.getAccount(function(list)
        {
            if(list)
            {
                self.loggedin();
                layout.display_center();

                layout.updateLeftList()
                    .then(layout.displayDefaultLabel.bind(layout));

                console.log('Start controller fullupdate');
                self.controller.fullupdate()
                    .then(function() { console.log('Done controller fullupdate'); })
                    .then(layout.updateLeftList.bind(layout));
            }
            else
            {
                self.loggedout();
                layout.display_right();
            }
        });
    };

    this.bind= function()
    {
        var self=this;
        this.form.addEventListener('submit', function(e) { return self.login(e); }, false);
        this.login_link.addEventListener('submit', function(e) { return self.login(e); }, false);
        this.logout_link.addEventListener('click', function(e) { return self.logout(e); }, false);
        this.register_link.addEventListener('click', function(e) { return self.register(e); });

        this.register_link.addEventListener('click', function(e) { return self.register(e); });
        this.view_read.addEventListener('click', function(e) { return self.toggleViewRead(e); });
        this.view_title_only.addEventListener('click', function(e) { return self.toggleViewTitleOnly(e); });
    };

    this.restoreSettings= function()
    {
        this.view_read.checked =  this.getViewRead();
        this.view_title_only.checked =  this.getViewTitleOnly();
    };

    this.logout= function(e)
    {
        console.log('logout');
        this.controller.deleteAccount(this.loggedout.bind(this));
        e.preventDefault();
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
        layout.updateCount();
        layout.displayItems();
        console.log('toggle view read');
    };
    this.toggleViewTitleOnly= function(e)
    {
        localStorage.setItem('viewTitleOnly', this.view_title_only.checked ? 1 : 0);
        layout.displayItems();
        console.log('toggle view title only');
    };

    this.login= function(e)
    {
        if(this.form.checkValidity())
        {
            e.preventDefault();

            this.controller.login(this.email.value,this.password.value)
                .then(this.init_account.bind(this));
        }
        else
        {
            e.preventDefault();
            return false;
        }
    };


    this.loggedin = function()
    {
        this._logged = true;
        this.email.value = this.controller.getEmail();
        this.form.classList.add("loggedin");
        this.email.disabled=true;
    };

    this.loggedout = function()
    {
        this._logged = false;
        this.form.classList.remove("loggedin");
        this.email.disabled=false;
    };

    this.isLoggedIn = function()
    {
        return this.controller ? this.controller.isLoggedIn() : false;
    };

    this.getViewRead = function()
    {
        return localStorage.getItem('viewRead') === "1" ? true : false;
    };
    this.getViewTitleOnly = function()
    {
        return localStorage.getItem('viewTitleOnly') !== "0" ? true : false;
    };

};
