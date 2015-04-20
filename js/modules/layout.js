var Layout = function()
{
    var buttons=  document.querySelectorAll('.header button');
    var left = document.querySelector('.slide.left')
    var right = document.querySelector('.slide.right')

    var slides = document.querySelector('.slides');
    var button_left = document.querySelector('.button_left');
    var button_right = document.querySelector('.button_right');

    var leftlist = document.querySelector('.leftlist');

    this.init = function(controller)
    {
        this.controller = controller;
        this.bind();
    };

    this.display_left= function()
    {
        if(button_left.classList.contains('selected'))
        {
            return this.display_center();
        }
        right.classList.add("hidden");
        left.classList.remove("hidden");
        slides.className='slides left_selected';

        Array.forEach( buttons, function(button)
        {
            button.classList.remove('selected');
        });
        button_left.classList.add('selected');
    };

    this.display_right= function()
    {
        if(button_right.classList.contains('selected'))
        {
            return this.display_center();
        }
        left.classList.add("hidden");
        right.classList.remove("hidden");
        slides.className='slides right_selected';
        Array.forEach( buttons, function(button)
        {
            button.classList.remove('selected');
        });
        document.querySelector('.button_right').classList.add('selected');
    };

    this.display_center= function()
    {
        Array.forEach( buttons, function(button)
        {
            button.classList.remove('selected');
        });
        slides.className='slides';
    };

    this.bind =  function()
    {
        document.querySelector('.header h1').addEventListener('click', this.display_center.bind(this));
        document.querySelector('.header .button_left').addEventListener('click', this.display_left.bind(this));
        document.querySelector('.header .button_right').addEventListener('click', this.display_right.bind(this));
    };


    this.updateLeftList= function()
    {
        var self=this;
        Promise.all([ this.controller.getFeeds(), this.controller.getLabels()])
        .then(function(values)
                {
                    var feeds = values[0];
                    var labels = values[1];
                    var counts = values[2];

                    // @TODO do not remove all, only update...
                    leftlist.innerHTML='';

                    // Append all items
                    Array.forEach(labels, function(label)
                    {
                        var li = document.createElement('li');

                        var name = label.id.replace(/.*label\//,'');
                        li.innerHTML= ' \
                                <p class="label_toggle"><span data-icon="add"></span></p>\
                                <p class="label_num" data-id="'+name+'"></p>\
                                <p class="label">'+name+'</p>\
                                <ul></ul>\
                                ';
                        var feedlist = li.querySelector('ul');

                        leftlist.appendChild(li);
                    });
                    console.log('update feeds layout');
                    self.updateCount();
                });

    };
    this.updateCount = function()
    {
        this.controller.getCounts()
            .then(function(counts)
            {
                console.log('received', counts);
                counts.forEach(function(count)
                {
                    var name = count.id.replace(/.*label\//,'')

                    var re = ".label_num[data-id=\'"+name+"\']";
                    console.log(re);
                    var item = document.querySelector(re);
                        console.log('item ', item);
                    if(item)
                    {
                        item.innerHTML= count.count;
                        console.log('item ', item);
                    }
                });
            });
    };
};

