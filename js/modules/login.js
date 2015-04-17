var Login = function()
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


        this.bind();
        this.init_account();
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

                self.controller.fullupdate();
                //layout.loadfeeds();
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
    };
    this.logout= function(e)
    {
        console.log('logout');
        this.controller.deleteAccount(this.loggedout.bind(this));
        e.preventDefault();
    };

    this.register= function(e)
    {
        window.open(self.controller.getRegisterLink());
        e.preventDefault();
        return false;
    };

    this.login= function(e)
    {
        if(this.form.checkValidity())
        {
            this.controller.login(
                    this.email.value,
                    this.password.value,
                    this.init_account.bind(this)
            );
            e.preventDefault();
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
};
