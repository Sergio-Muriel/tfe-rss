var Layout = function()
{
    var translate = navigator.mozL10n.get;
    var buttons=  document.querySelectorAll('.header button');

    var center = document.querySelector('.slide.center');
    var left = document.querySelector('.slide.left')
    var right = document.querySelector('.slide.right')

    var full_container = document.querySelector('.feed_fullscreen-container')
    var center_menu_single = document.querySelector('.center_menu_single')
    var center_menu_all = document.querySelector('.center_menu_all')

    var slides = document.querySelector('.slides');
    var button_left = document.querySelector('.button_left');
    var button_right = document.querySelector('.button_right');

    var leftlist = document.querySelector('.leftlist');
    var feed_contents = [];

    this.init = function(controller)
    {
        this.controller = controller;
        this.bind();
    };

    this.setController= function(_controller)
    {
        this.controller = _controller;
    };

    this.bind =  function()
    {
        document.querySelector('.header h1').addEventListener('click', this.display_center.bind(this));
        document.querySelector('.header .button_left').addEventListener('click', this.display_left.bind(this));
        document.querySelector('.header .button_right').addEventListener('click', this.display_right.bind(this));

        document.querySelector('.readall_btn').addEventListener('click', this.readall.bind(this));
        document.querySelector('.update_btn').addEventListener('click', this.clearAndLoadItems.bind(this));

        document.querySelector('.next_btn').addEventListener('click', this.openNext.bind(this));
        document.querySelector('.prev_btn').addEventListener('click', this.openPrev.bind(this));
        document.querySelector('.close_btn').addEventListener('click', this.closeItem.bind(this));

        document.querySelector('.addfeed_btn').addEventListener('click', this.addFeed.bind(this));
    };

    this.addFeed = function()
    {
        var url = prompt(translate('add_feed'));
        var self=this;
        if(url)
        {
            this.controller.addFeed(url)
            .then(
            function(result)
            {
                var translate = navigator.mozL10n.get;
                self.controller.fullupdate()
                    .then(layout.updateLeftList.bind(layout));

                alert(translate('feed_added'));
            },
            function(result)
            {
                var translate = navigator.mozL10n.get;
                alert(translate('feed_added_error'));
            });
        }
    };

    this.openNext = function(e)
    {
        var next;
        if(!this.opened_item)
        {
            next = document.querySelector('.feed_item');
        }
        else
        {
            next = this.opened_item.nextElementSibling;
        }

        if(this.opened_item!=next && next.classList.contains('feed_item'))
        {
            this.openItem({ target: next});
        }
        else
        {
            this.closeItem();
        }
    };
    this.openPrev = function(e)
    {
        var next;
        if(!this.opened_item)
        {
            next = document.querySelector('.feed_item');
        }
        else
        {
            next = this.opened_item.previousElementSibling ||  document.querySelector('.feed_item');
        }
        if(this.opened_item!=next && next.classList.contains('feed_item'))
        {
            this.openItem({ target: next});
        }
        else
        {
            this.closeItem();
        }
    };

    this.readall= function(e)
    {
        var self=this;
        var span = e.target;
        if(!confirm(translate('confirm_read_all')))
        {
            return;
        }
        span.classList.add('updating');

        this.controller.readAll(this.display_id)
            .then(function(result)
            {
                span.classList.remove('updating');
                self.clearAndLoadItems();
            });
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
            span.classList.remove('fa-folder');
            span.classList.add('fa-folder-open');
        }
        else
        {
            subitems.classList.remove("visible");
            span.classList.remove('fa-folder-open');
            span.classList.add('fa-folder');
        }
        return true;
    };

    this.markRead=function(li,item_id)
    {
        li.classList.add('updating');
        this.controller.markRead(item_id, true)
            .then(function(result)
            {
                li.classList.remove('fresh_item');
            });

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
            span.classList.remove('fa-star-o');
            span.classList.add('fa-star');
        }
        else
        {
            span.classList.remove('fa-star');
            span.classList.add('ko')
            span.classList.add('fa-star-o');
        }
        this.controller.markStar(item_id, !span.classList.contains('ko'))
            .then(function(result)
            {
                span.classList.remove('updating');
            });

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
            });

        return true;
    };

    this.displayDefaultLabel = function()
    {
        var li = document.querySelector('.leftlist_item');
        this.display_id = li.getAttribute('data-id');
        this.display_name = li.querySelector('.label').innerHTML;
        return this.clearAndLoadItems();
    };

    this.updateLeftList= function()
    {
        var self=this;

        return Promise.all([ this.controller.getFeeds(), this.controller.getLabels()])
        .then(function(values)
        {
            var feeds = values[0];
            var labels = values[1];
            var counts = values[2];

            // @TODO do not remove all, only update...
            self.clearLeft();

            // All items
            var li = document.createElement('li');
            li.className='leftlist_item';
            li.setAttribute('data-id', self.controller.all_id);
            var label_toggle = document.createElement('p');
            label_toggle.className='label_toggle fa fa-home';
            li.appendChild(label_toggle);
            var label = document.createElement('p');
            label.className='label';
            label.innerHTML = translate('state_reading_list');
            label.addEventListener('click', layout.loadFeed.bind(layout));
            li.appendChild(label);
            var label_num = document.createElement('p');
            label_num.className='label_num';
            li.appendChild(label_num);
            leftlist.appendChild(li);

            if(self.controller.starred_id)
            {
                // Starred items
                var li = document.createElement('li');
                li.className='leftlist_item';
                li.setAttribute('data-id', self.controller.starred_id);
                var label_toggle = document.createElement('p');
                label_toggle.className='label_toggle fa fa-star';
                li.appendChild(label_toggle);
                var label = document.createElement('p');
                label.className='label';
                label.innerHTML = translate('state_starred');
                label.addEventListener('click', layout.loadFeed.bind(layout));
                li.appendChild(label);
                var label_num = document.createElement('p');
                label_num.className='label_num';
                li.appendChild(label_num);
                leftlist.appendChild(li);
            }

            if(self.controller.liked_id)
            {
                // Liked items
                var li = document.createElement('li');
                li.className='leftlist_item';
                li.setAttribute('data-id',self.controller.liked_id);
                var label_toggle = document.createElement('p');
                label_toggle.className='label_toggle fa fa-heart';
                li.appendChild(label_toggle);
                var label = document.createElement('p');
                label.className='label';
                label.innerHTML = translate('state_liked');
                label.addEventListener('click', layout.loadFeed.bind(layout));
                li.appendChild(label);
                var label_num = document.createElement('p');
                label_num.className='label_num';
                li.appendChild(label_num);
                leftlist.appendChild(li);
            }

            if(self.controller.shared_id)
            {
                // Shared items
                var li = document.createElement('li');
                li.className='leftlist_item';
                li.setAttribute('data-id',self.controller.shared_id);
                var label_toggle = document.createElement('p');
                label_toggle.className='label_toggle fa fa-share-alt';
                li.appendChild(label_toggle);
                var label = document.createElement('p');
                label.className='label';
                label.innerHTML = translate('state_shared');
                label.addEventListener('click', layout.loadFeed.bind(layout));
                li.appendChild(label);
                var label_num = document.createElement('p');
                label_num.className='label_num';
                li.appendChild(label_num);
                leftlist.appendChild(li);
            }


            // Append all items
            Array.forEach(labels, function(label)
            {
                // Add only real labels
                if(/(label|user)/.test(label.id))
                {
                    var li = document.createElement('li');
                    var name = label.label || label.id.replace(/.*label\//,'');
                    li.className='leftlist_item';
                    li.setAttribute('data-id',label.id);

                    var label_toggle = document.createElement('p');
                    label_toggle.className='label_toggle fa fa-folder';
                    label_toggle.innerHTML ='';
                    label_toggle.addEventListener('click',self.toggleLabel.bind(self), false);
                    li.appendChild(label_toggle);

                    var label = document.createElement('p');
                    label.className='label';
                    label.innerHTML = name;
                    label.addEventListener('click', layout.loadFeed.bind(layout));
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
                var items;
                
                if(name)
                {
                    items = document.querySelector(re);
                }
                else
                {
                    items = leftlist;
                }


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
                feed_name.addEventListener('click', layout.loadFeed.bind(layout));
                div.appendChild(feed_name);

                var label_num = document.createElement('p');
                label_num.className='label_num';
                div.appendChild(label_num);

                items.appendChild(div);
            });
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


    this.clearLeft = function()
    {
        leftlist.innerHTML='';
    };

    this.loadMore = function(e)
    {
        var li = e.target;
        return this.displayItems(li.getAttribute('data-continuation'));
    };

    this.gotoTop=function()
    {
        center.querySelector('.slide_content').scrollTop=0;
    };

    this.loadFeed = function(e)
    {
        var li = e.target;
        this.display_center();
        while(li && li.tagName!=='LI' && li.tagName!=='DIV')
        {
            li = li.parentNode;
        }
        this.display_id = li.getAttribute('data-id');
        this.display_name = li.querySelector('.label, .feed_name').innerHTML;
        return this.clearAndLoadItems();
    }

    this.clear= function()
    {
        this.closeItem();
        this.wait_loading = 0;
        this.opened_item=null;
        this.feed_contents=[];
        var ul = center.querySelector('.slide_content ul');
        ul.innerHTML='';
    };

    this.clearAndLoadItems = function()
    {
        this.clear();
        this.gotoTop();
        this.displayItems();
    },

    this.displayItems = function(continuation)
    {
        var self=this;
        this.controller.updateCount()
        .then(function()
        {
            self.updateCount();
        });

        var viewRead = settings.getViewRead();
        var viewList = settings.getViewList();
        var id = this.display_id;

        var ul = center.querySelector('.slide_content ul');
        var li;

        // Remove previous load more  if present
        if(!(li=ul.querySelector('li.no_items')))
        {
            li = document.createElement('li');
            li.className='no_items';
            ul.appendChild(li);
        }
        li.innerHTML=translate('loading_items');
        
        this.controller.getItems(id, viewRead, continuation)
            .then(function(r)
            {
                var ul = center.querySelector('.slide_content ul');

                // Remove previous loading item
                if(remove = ul.querySelector('li.no_items'))
                {
                    ul.removeChild(remove);
                }
                var items = r.items;

                // Build new list of items
                var ul = center.querySelector('.slide_content ul');

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
                        var content = item.summary.content;
                        content = content.replace(/(<a[^>]+)>/ig,'$1 target="_blank">');
                        content = content.replace(/<\/script[^>]*>/,'');
                        var first_image =null;
                        if(re=content.match(/<img[^>]+src=["']([^"']+)/))
                        {
                            first_image=re[1];
                        }

                        var li = document.createElement('li');
                        li.setAttribute('feed_link', item.canonical[0].href);
                        li.className='feed_item';
                        if(item.categories.indexOf('user/-/state/com.google/fresh')!==-1)
                        {
                            li.className='fresh_item';
                        }
                        li.setAttribute('data-id',item.id);

                        var div = document.createElement('div');
                        div.className='feed_header';
                        li.appendChild(div);

                        var p = document.createElement('p');
                        p.className='feed_title '+(viewList?'view_list':'view_full');
                        p.innerHTML = item.title;
                        p.addEventListener('click', layout.openItem.bind(layout));
                        div.appendChild(p);

                        p = document.createElement('p');
                        p.className='feed_origin';
                        p.innerHTML = item.origin.title;
                        div.appendChild(p);

                        if(viewList)
                        {
                            p = document.createElement('p');
                            p.className='feed_image';
                            p.style.backgroundImage = 'url('+first_image+')';
                            div.appendChild(p);
                        }
                        else
                        {
                            div_content = document.createElement('div');
                            div_content.className='feed_content';
                            div_content.innerHTML = content;
                            li.appendChild(div_content);
                        }

                        p = document.createElement('p');
                        p.className='feed_flags';
                        div.appendChild(p)

                        var flag_star = document.createElement('span');
                        flag_star.className='flag_star fa '+(item.categories.indexOf('user/-/state/com.google/starred')===-1?'ko fa-star-o':'fa-star');
                        flag_star.addEventListener('click', layout.markStarClick.bind(layout));
                        p.appendChild(flag_star);

                        var flag_like = document.createElement('span');
                        flag_like.className='flag_like fa '+(item.categories.indexOf('user/-/state/com.google/like')===-1?'ko fa-thumbs-o-up':'fa-thumbs-up');
                        p.appendChild(flag_like);

                        var flag_share = document.createElement('span');
                        flag_share.className='flag_share fa fa-share ko';
                        p.appendChild(flag_share);


                        self.feed_contents[item.id] = content;
                        ul.appendChild(li);
                });

                if(r.continuation)
                {
                    // Add load more items
                    var li = document.createElement('li');
                    li.className='no_items';
                    li.innerHTML=translate('load_more');
                    li.setAttribute('data-continuation', r.continuation);
                    li.addEventListener('click', layout.loadMore.bind(layout));
                    ul.appendChild(li);
                }
            });
    };

    this.closeItem = function()
    {
        center_menu_all.classList.remove('hidden');
        center_menu_single.classList.add('hidden');

        var check = document.querySelector('.feed_fullscreen');
        if(check)
        {
            check.parentNode.removeChild(check);
        }
    };

    this.openItem = function(e)
    {
        center_menu_all.classList.add('hidden');
        center_menu_single.classList.remove('hidden');

        var target=e.target;
        var li = e.target;

        while(li && li.tagName!=='LI')
        {
            li = li.parentNode;
        }
        this.opened_item = li;

        var id  = li.getAttribute('data-id');

        if(li.classList.contains('fresh_item'))
        {
            layout.markRead(li,id);
            li.classList.remove('fresh_item');
        }

        // Close previous opened item
        var check = document.querySelector('.feed_fullscreen');
        if(check)
        {
            check.parentNode.removeChild(check);
        }

        var newLi = li.cloneNode(true);
        newLi.querySelector('.flag_star').addEventListener('click', layout.markStarClick.bind(layout));
        newLi.querySelector('.flag_like').addEventListener('click', layout.markLikeClick.bind(layout));
        newLi.querySelector('.flag_share').addEventListener('click', function(e)
        {
            new MozActivity({
                name: "new",
                data: {
                    number: 1,
                    url: "mailto:?subject="+encodeURIComponent(li.querySelector('.feed_title').innerHTML)+
                        "&body=" + encodeURIComponent(li.getAttribute('feed_link'))
                }
            });
        });
        newLi.querySelector('.feed_title').addEventListener('click', function(e)
        {
            window.open(li.getAttribute('feed_link'));
        });

        newLi.className='feed_fullscreen';
        full_container.appendChild(newLi);

        if(!newLi.querySelector('.feed_content'))
        {
            var div = document.createElement('div');
            div.className='feed_content';
            div.innerHTML = this.feed_contents[id];
            newLi.appendChild(div);
        }
    };
};

