var Layout = function()
{
    var buttons=  document.querySelectorAll('.header button');

    var center = document.querySelector('.slide.center');
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

    this.bind =  function()
    {
        document.querySelector('.header h1').addEventListener('click', this.display_center.bind(this));
        document.querySelector('.header .button_left').addEventListener('click', this.display_left.bind(this));
        document.querySelector('.header .button_right').addEventListener('click', this.display_right.bind(this));
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


    this.toggleLabel=function(e)
    {
        e.preventDefault();
        var span = e.target;
        var li = e.target;
        while(li && li.tagName!=='LI')
        {
            li = li.parentNode;
        }
        var subitems = li.querySelector('.leftlist_items');
        if(!subitems.classList.contains('visible'))
        {
            subitems.classList.add("visible");
            span.setAttribute('data-icon', 'minus');
        }
        else
        {
            subitems.classList.remove("visible");
            span.setAttribute('data-icon', 'add');
        }
        return true;
    };

    this.markReadClick=function(e)
    {
        var span = e.target;
        var li = e.target;
        while(li && li.tagName!=='LI')
        {
            li = li.parentNode;
        }
        var item_id = li.getAttribute('data-id');
        span.classList.add('updating');
        if(span.classList.contains('ko'))
        {
            span.classList.remove('ko');
        }
        else
        {
            span.classList.add('ko');
        }
        this.controller.markRead(item_id, !span.classList.contains('ko'))
            .then(function(result)
            {
                span.classList.remove('updating');
                console.log('result',result);
            });

        console.log('mark read ',item_id);
        return true;
    };
    this.markStarClick=function(e)
    {
        var span = e.target;
        var li = e.target;
        while(li && li.tagName!=='LI')
        {
            li = li.parentNode;
        }
        var item_id = li.getAttribute('data-id');
        span.classList.add('updating');
        if(span.classList.contains('ko'))
        {
            span.classList.remove('ko');
        }
        else
        {
            span.classList.add('ko');
        }
        this.controller.markStar(item_id, !span.classList.contains('ko'))
            .then(function(result)
            {
                span.classList.remove('updating');
                console.log('result',result);
            });

        console.log('mark read ',item_id);
        return true;
    };
    this.markLikeClick=function(e)
    {
        var span = e.target;
        var li = e.target;
        while(li && li.tagName!=='LI')
        {
            li = li.parentNode;
        }
        var item_id = li.getAttribute('data-id');
        span.classList.add('updating');
        if(span.classList.contains('ko'))
        {
            span.classList.remove('ko');
        }
        else
        {
            span.classList.add('ko');
        }
        this.controller.markLike(item_id, !span.classList.contains('ko'))
            .then(function(result)
            {
                span.classList.remove('updating');
                console.log('result',result);
            });

        console.log('mark read ',item_id);
        return true;
    };

    this.displayDefaultLabel = function()
    {
        var li = document.querySelector('.leftlist_item');
        this.display_id = li.getAttribute('data-id');
        return this.displayItems();
    };

    this.updateLeftList= function()
    {
        var self=this;
        var translate = navigator.mozL10n.get;

        return Promise.all([ this.controller.getFeeds(), this.controller.getLabels()])
        .then(function(values)
        {
            var feeds = values[0];
            var labels = values[1];
            var counts = values[2];

            // @TODO do not remove all, only update...
            leftlist.innerHTML='';

            // All items
            var li = document.createElement('li');
            li.className='leftlist_item';
            li.setAttribute('data-id','user/-/state/com.google/reading-list');
            var label_toggle = document.createElement('p');
            label_toggle.className='label_toggle';
            label_toggle.innerHTML ='<span data-icon="browsing"></span>';
            li.appendChild(label_toggle);
            var label = document.createElement('p');
            label.className='label';
            label.innerHTML = translate('state_reading_list');
            label.addEventListener('click', layout.displayItemsClick.bind(layout));
            li.appendChild(label);
            var label_num = document.createElement('p');
            label_num.className='label_num';
            li.appendChild(label_num);
            leftlist.appendChild(li);

            // Starred items
            var li = document.createElement('li');
            li.className='leftlist_item';
            li.setAttribute('data-id','user/-/state/com.google/starred');
            var label_toggle = document.createElement('p');
            label_toggle.className='label_toggle';
            label_toggle.innerHTML ='<span data-icon="star-full"></span>';
            li.appendChild(label_toggle);
            var label = document.createElement('p');
            label.className='label';
            label.innerHTML = translate('state_starred');
            label.addEventListener('click', layout.displayItemsClick.bind(layout));
            li.appendChild(label);
            var label_num = document.createElement('p');
            label_num.className='label_num';
            li.appendChild(label_num);
            leftlist.appendChild(li);

            // Liked items
            var li = document.createElement('li');
            li.className='leftlist_item';
            li.setAttribute('data-id','user/-/state/com.google/like');
            var label_toggle = document.createElement('p');
            label_toggle.className='label_toggle';
            label_toggle.innerHTML ='<span data-icon="feedback"></span>';
            li.appendChild(label_toggle);
            var label = document.createElement('p');
            label.className='label';
            label.innerHTML = translate('state_liked');
            label.addEventListener('click', layout.displayItemsClick.bind(layout));
            li.appendChild(label);
            var label_num = document.createElement('p');
            label_num.className='label_num';
            li.appendChild(label_num);
            leftlist.appendChild(li);

            // Shared items
            var li = document.createElement('li');
            li.className='leftlist_item';
            li.setAttribute('data-id','user/-/state/com.google/broadcast');
            var label_toggle = document.createElement('p');
            label_toggle.className='label_toggle';
            label_toggle.innerHTML ='<span data-icon="email-forward"></span>';
            li.appendChild(label_toggle);
            var label = document.createElement('p');
            label.className='label';
            label.innerHTML = translate('state_shared');
            label.addEventListener('click', layout.displayItemsClick.bind(layout));
            li.appendChild(label);
            var label_num = document.createElement('p');
            label_num.className='label_num';
            li.appendChild(label_num);
            leftlist.appendChild(li);


            // Append all items
            Array.forEach(labels, function(label)
            {
                // Add only real labels
                if(/label/.test(label.id))
                {
                    var li = document.createElement('li');
                    var name = label.id.replace(/.*label\//,'');
                    li.className='leftlist_item';
                    li.setAttribute('data-id',label.id);

                    var label_toggle = document.createElement('p');
                    label_toggle.className='label_toggle';
                    label_toggle.innerHTML ='<span data-icon="add"></span>';
                    label_toggle.addEventListener('click',self.toggleLabel.bind(self), false);
                    li.appendChild(label_toggle);

                    var label = document.createElement('p');
                    label.className='label';
                    label.innerHTML = name;
                    label.addEventListener('click', layout.displayItemsClick.bind(layout));
                    li.appendChild(label);

                    var label_num = document.createElement('p');
                    label_num.className='label_num';
                    li.appendChild(label_num);

                    var list = document.createElement('div');
                    list.className='leftlist_items';
                    li.appendChild(list);

                    leftlist.appendChild(li);
                }
            });
            Array.forEach(feeds, function(feed)
            {
                var name = feed.category;//replace(/.*label\//,'')
                var feed_id = feed.id;//replace(/.*feeds\//,'')
                var re = ".leftlist_item[data-id=\'"+name+"\'] .leftlist_items";
                var items = document.querySelector(re);

                if(items)
                {
                    var div  =document.createElement('div');
                    div.className='leftlist_item';
                    div.setAttribute('data-id', feed_id);

                    var feed_icon = document.createElement('p');
                    feed_icon.className='feed_icon';
                    feed_icon.innerHTML = '<img src="https://'+feed.iconUrl+'" alt="" />';
                    div.appendChild(feed_icon);

                    var feed_name = document.createElement('p');
                    feed_name.className='feed_name';
                    feed_name.innerHTML = feed.title;
                    feed_name.addEventListener('click', layout.displayItemsClick.bind(layout));
                    div.appendChild(feed_name);

                    var label_num = document.createElement('p');
                    label_num.className='label_num';
                    div.appendChild(label_num);

                    items.appendChild(div);
                }
            });
            console.log('update feeds layout');
            self.updateCount();
        });

    };
    this.updateCount = function()
    {
        var viewRead = settings.getViewRead();

        this.controller.getCounts()
            .then(function(counts)
            {
                counts.forEach(function(count)
                {
                    var name = count.id;//replace(/.*label\//,'')

                    var re = ".leftlist_item[data-id=\'"+name+"\']";
                    var item = document.querySelector(re);
                    if(item)
                    {
                        if(!viewRead && count.count===0)
                        {
                            item.classList.add("hidden");
                        }
                        else
                        {
                            item.classList.remove("hidden");
                            var label = item.querySelector('.label_num');
                            label.innerHTML= count.count;
                        }
                    }
                });
            });
    };

    this.displayItemsClick = function(e)
    {
        var li = e.target;
        this.display_center();
        while(li && !li.classList.contains('leftlist_item'))
        {
            li = li.parentNode;
        }
        this.display_id = li.getAttribute('data-id');
        return this.displayItems();
    };

    this.gotoTop=function()
    {
        center.querySelector('.slide_content').scrollTop=0;
    };

    this.displayItems = function()
    {
        var translate = navigator.mozL10n.get;
        var viewTitleOnly = settings.getViewTitleOnly();
        var viewRead = settings.getViewRead();
        var id = this.display_id;

        this.gotoTop();

        var ul = center.querySelector('.slide_content ul');
        ul.innerHTML='';

        var li = document.createElement('li');
        li.className='no_items';
        li.innerHTML=translate('loading_items');
        ul.appendChild(li);
        
        this.controller.getItems(id, viewRead)
            .then(function(r)
            {
                var ul = center.querySelector('.slide_content ul');
                var items = r.items;
                ul.innerHTML='';

                // Build new list of items
                var ul = center.querySelector('.slide_content ul');
                ul.innerHTML='';

                console.log(r);
                // Clear previous list
                if(!items)
                {
                    // No items (returned error...)
                    var li = document.createElement('li');
                    li.className='no_items';
                    li.innerHTML=translate('no_items');
                    ul.appendChild(li);
                    return;

                }
                items.forEach(function(item)
                {
                        var li = document.createElement('li');
                        li.setAttribute('data-id',item.id);

                        var div = document.createElement('div');
                        div.className='feed_header';
                        li.appendChild(div);

                        var p = document.createElement('p');
                        p.className='feed_title';
                        p.innerHTML = item.title;
                        div.appendChild(p);

                        p = document.createElement('p');
                        p.className='feed_origin';
                        p.innerHTML = item.origin.title;
                        div.appendChild(p);

                        p = document.createElement('p');
                        p.className='feed_time';
                        p.innerHTML = (new Date(item.updated/1000)).toLocaleString();
                        div.appendChild(p)

                        p = document.createElement('p');
                        p.className='feed_flags';
                        li.appendChild(p)

                        var flag_read = document.createElement('span');
                        flag_read.innerHTML='<span class="flag_read '+(item.categories.indexOf('user/-/state/com.google/fresh')===-1?'ko':'')+'" data-icon="gmail"></span>';
                        flag_read.addEventListener('click', layout.markReadClick.bind(layout));
                        p.appendChild(flag_read);

                        var flag_star = document.createElement('span');
                        flag_star.innerHTML ='<span class="flag_star '+(item.categories.indexOf('user/-/state/com.google/starred')===-1?'ko':'')+'" data-icon="star-full"></span>';
                        flag_star.addEventListener('click', layout.markStarClick.bind(layout));
                        p.appendChild(flag_star);

                        var flag_like = document.createElement('span');
                        flag_like.innerHTML='<span class="flag_like '+(item.categories.indexOf('user/-/state/com.google/like')===-1?'ko':'')+'" data-icon="feedback"></span>';
                        flag_like.addEventListener('click', layout.markLikeClick.bind(layout));
                        p.appendChild(flag_like);

                        if(!viewTitleOnly)
                        {
                            var div = document.createElement('div');
                            div.className='feed_content';

                            var content = item.summary.content;
                            content = content.replace(/(<a[^>]+)>/ig,'$1 target="_blank">');
                            content = content.replace(/<\/script[^>]*>/,'');
                            div.innerHTML = content;
                            li.appendChild(div);
                        }

                        ul.appendChild(li);
                });
            });
    };
};

