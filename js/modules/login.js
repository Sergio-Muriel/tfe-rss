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
        this.register_link = document.querySelector('.register_link');

        this.form.addEventListener('submit', function(e) { return self.login(e); }, false);
        this.register_link.addEventListener('click', function(e) { e.preventDefault(); return false;}, false);
    }; 
    this.login= function(e)
    {
        if(this.form.checkValidity())
        {
            this.controller.login(
                    this.form.querySelector('input[name=email]').value,
                    this.form.querySelector('input[name=password]').value,
                    this.login_callback
            );
            e.preventDefault();
        }
        else
        {
            e.preventDefault();
            return false;
        }
    };

    this.login_callback= function(login_status)
    {
        console.log('login result', login_status);
    };
};
