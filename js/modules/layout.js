var Layout = function()
{
    var mover = document.querySelector('.slides_move');
    var buttons=  document.querySelectorAll('.header button');
    var left = document.querySelector('.slide.left .slide_content')

    this.init = function(controller)
    {
        this.controller = controller;
        this.bind();
    };

    this.display_left= function()
    {
        if(mover.classList.contains('left_visible'))
        {
            return this.display_center();
        }
        mover.className='slides_move left_visible';
        Array.forEach( buttons, function(button)
        {
            button.classList.remove('selected');
        });
        document.querySelector('.button_left').classList.add('selected');
    };

    this.display_right= function()
    {
        if(mover.classList.contains('right_visible'))
        {
            return this.display_center();
        }
        mover.className='slides_move right_visible';
        Array.forEach( buttons, function(button)
        {
            button.classList.remove('selected');
        });
        document.querySelector('.button_right').classList.add('selected');
    };

    this.display_center= function()
    {
        mover.className='slides_move center_visible';
        Array.forEach( buttons, function(button)
        {
            button.classList.remove('selected');
        });
    };

    this.bind =  function()
    {
        document.querySelector('.header h1').addEventListener('click', this.display_center.bind(this));
        document.querySelector('.header .button_left').addEventListener('click', this.display_left.bind(this));
        document.querySelector('.header .button_right').addEventListener('click', this.display_right.bind(this));
    };


    this.update_leftlist= function()
    {
        console.log('update left list');

        var feeds=  this.controller.getFeeds()
            .then(function(feeds)
                {
                    // Empty previous list
                    while (left.firstChild) {
                        left.removeChild(left.firstChild);
                    }
                    // Append all items
                    var ul= document.createElement('ul');
                    Array.forEach(feeds, function(feed)
                    {
                        var li = document.createElement('li');
                        li.innerHTML= ' \
                                <p class="left_title">'+feed.title+'</p>\
                                ';
                        ul.appendChild(li);
                    });
                    console.log('update feeds layout');
                    left.appendChild(ul);
                });

    };
};

