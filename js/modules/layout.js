var Layout = function()
{
    var buttons=  document.querySelectorAll('.header button');

    var center = document.querySelector('.slide.center');
    var left = document.querySelector('.slide.left');
    var right = document.querySelector('.slide.right');
    var center_scroll_container = center.querySelector('.slide_content');
    var center_scroll = center.querySelector('.slide_content ul');

    var alert_container = center.querySelector('.alert_container');
    var alert_msg = center.querySelector('.alert');

    var full_container = document.querySelector('.feed_fullscreen-container');
    var center_menu_single = document.querySelector('.center_menu_single');
    var center_menu_all = document.querySelector('.center_menu_all');

    var slides = document.querySelector('.slides');
    var button_left = document.querySelector('.button_left');
    var button_right = document.querySelector('.button_right');

    var leftlist = document.querySelector('.leftlist');
    var feed_contents = [];

    this.init = function(controller)
    {
        this.controller = controller;
        this.bind();
        this.init_scroll();
    };

    this.init_scroll= function()
    {
        center_scroll_container.addEventListener('scroll', this.onscroll.bind(this));
    };

    this.onscroll= function(e)
    {
        if(center_scroll_container.scrollTop + window.outerHeight > center_scroll.offsetHeight)
        {
            this.loadMore();
        }
    };

    this.alert=function(msg,time)
    {
        if(!time) { time= 2000; }
        alert_msg.innerHTML=msg;
        alert_container.classList.add('visible');
        clearTimeout(this.alert_timeout);
        this.alert_timeout = setTimeout(this.alert_hide.bind(this), time);
    };
    this.alert_hide = function()
    {
        alert_container.classList.remove('visible');
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
        document.querySelector('.top_btn').addEventListener('click', this.gotoTop.bind(this));
        document.querySelector('.update_btn').addEventListener('click', this.clearAndLoadItems.bind(this));

        document.querySelector('.next_btn').addEventListener('click', this.openNext.bind(this));
        document.querySelector('.prev_btn').addEventListener('click', this.openPrev.bind(this));
        document.querySelector('.close_btn').addEventListener('click', this.closeItem.bind(this));

        document.querySelector('.addfeed_btn').addEventListener('click', this.addFeed.bind(this));
        document.querySelector('.check_btn').addEventListener('click', this.toggleEditFeeds.bind(this));

        // Swipe init on fullscreen
        document.addEventListener('touchstart', this.startSwipe.bind(this), false);
        document.addEventListener('touchend', this.endSwipe.bind(this), false);

        // Search bar
        document.querySelector('.search_bar form').addEventListener('submit', this.search.bind(this));
        document.querySelector('.search_close').addEventListener('click', this.close_search.bind(this));
        document.querySelector('.search_btn').addEventListener('click', this.open_search.bind(this));
    };

    this.open_search= function(e)
    {
        if(this.search_opened)
        {
            return this.close_search();
        }
        this.search_opened=1;
        document.querySelector('.slide.center .slide_content').classList.add('search_opened');

        document.querySelector('.search_bar').classList.add('opened');
        document.querySelector('.search_btn').classList.add('opened');
        document.querySelector('.search_bar input').focus();
    };

    this.close_search= function(e)
    {
        this.search_opened=0;
        var need_clear= this.search_value!== undefined && this.search_value!== '';
        this.search_value='';
        document.querySelector('.search_bar input').value='';
        document.querySelector('.search_bar').classList.remove('opened');
        document.querySelector('.search_btn').classList.remove('opened');
        document.querySelector('.slide.center .slide_content').classList.remove('search_opened');

        if(need_clear)
        {
            this.clearAndLoadItems();
        }
    };

    this.search= function(e)
    {
        var self=this;
        if(e.preventDefault) { e.preventDefault(); }
        if(e.stopPropagation) { e.stopPropagation(); }

        this.search_value= document.querySelector('.search_bar input').value.toLowerCase();
        document.querySelector('.search_bar input').blur();
        this.clearAndLoadItems();
    };

    this.delete_feed= function(e)
    {
        var self=this;
        if(e.preventDefault) { e.preventDefault(); }
        if(e.stopPropagation) { e.stopPropagation(); }
        var label = e.target;
        var li = e.target;
        while(li && !li.classList.contains('leftlist_item'))
        {
            li = li.parentNode;
        }
        var original_li = li;
        var ids=[];
        var promises=[];
        var childs = li.querySelectorAll('.leftlist_item');
        if(childs.length>0)
        {
            if(!confirm(translate('delete_category'))) { return; }
            Array.forEach(childs, function(li)
            {
                var id  = li.getAttribute('data-id');
                promises.push(self.controller.deleteFeed(id, true));
            });
        }
        else
        {
            if(!confirm(translate('delete_feed'))) { return; }
            var id  = li.getAttribute('data-id');
            promises.push(this.controller.deleteFeed(id, true));
        }

        label.classList.add('updating');
        Promise.all(promises)
            .then(function()
            {
                original_li.parentNode.removeChild(original_li);
            }, function()
            {
                label.classList.remove('updating');
                self.alert(translate('network_error'));
            });
    };

    this.toggleEditFeeds = function()
    {
        if(this.edit_opened)
        {
            this.edit_opened=0;
            Array.forEach(document.querySelectorAll('.label_num'), function(label)
            {
                label.classList.remove('hidden');
            });
            Array.forEach(document.querySelectorAll('.label_delete'), function(label)
            {
                label.classList.add('hidden');
            });
        }
        else
        {
            this.edit_opened=1;
            Array.forEach(document.querySelectorAll('.label_num'), function(label)
            {
                label.classList.add('hidden');
            });
            Array.forEach(document.querySelectorAll('.label_delete'), function(label)
            {
                label.classList.remove('hidden');
            });
        }
    };

    this.startSwipe = function(evt)
    {
        if(!evt.changedTouches || evt.changedTouches.length===0) { return; }
        this.swipe_x = evt.changedTouches[0].clientX;
        this.swipe_y = evt.changedTouches[0].clientY;
        this.swipe_fromtop = center_scroll_container.scrollTop;
    };

    this.endSwipe = function(evt)
    {
        if(!evt.changedTouches || evt.changedTouches.length===0) { return; }
        var end_swipe_x = evt.changedTouches[0].clientX;
        var end_swipe_y = evt.changedTouches[0].clientY;

        var xDiff = this.swipe_x - end_swipe_x;
        var yDiff = this.swipe_y - end_swipe_y;

        if(this.opened_item)
        {
            // Swipe left right for previous and next items
            if ( Math.abs( xDiff ) > Math.abs( yDiff ) && Math.abs(xDiff)>20)
            {
                 if ( xDiff > 0 )
                 {
                     this.openNext();
                 }
                 else
                 {
                     this.openPrev();
                 }
            }
        }

        // Swipe top to refresh
        else
        {
            if(this.swipe_fromtop ===0 && center_scroll_container.scrollTop===0 &&  Math.abs( xDiff ) < Math.abs( yDiff ) &&  Math.abs( yDiff )>20)
            {
                this.clearAndLoadItems();
            }
        }
    };

    this.addFeed = function()
    {
        var self=this;
        var url = prompt(translate('add_feed'));

        // Do nothing if not logged in
        if(!settings.loggedin)
        {
            return;
        }
        if(url)
        {
            this.controller.addFeed(url)
            .then(
            function(result)
            {
                self.controller.fullupdate()
                    .then(self.updateLeftList.bind(self));

                alert(translate('feed_added'));
            },
            function(result)
            {
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
            if(next && !next.classList.contains('feed_item'))
            {
                next = next.nextElementSibling;
            }
        }

        if(next && this.opened_item!=next && next.classList.contains('feed_item'))
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
            if(next && !next.classList.contains('feed_item'))
            {
                next = next.previousElementSibling;
            }
        }
        if(next && this.opened_item!=next && next.classList.contains('feed_item'))
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

        var readall_key = center.querySelector('.feed_item').getAttribute('readall_key');
        // Last item
        this.controller.readAll(this.display_id, readall_key)
            .then(function(result)
            {
                span.classList.remove('updating');
                if(selected = document.querySelector('.leftlist_item.selected'))
                {
                    selected.classList.remove('with_unread');
                }

                // auto focus next label with unread items
                if(next = document.querySelector('.leftlist_item.with_unread:not(.leftlist_default)'))
                {
                    console.log('next! ',next);
                    self.loadFeed({ target: next} );
                    next.click();
                }
                else
                {
                    self.clearAndLoadItems();
                }
            });
    };


    this.display_left= function()
    {
        if(!settings.isLoggedIn())
        {
            return;
        }
        if(button_left.classList.contains('selected'))
        {
            return this.display_center();
        }
        slides.className='slides left_selected left_visible';

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
        slides.className='slides right_selected right_visible';
        Array.forEach( buttons, function(button)
        {
            button.classList.remove('selected');
        });
        document.querySelector('.button_right').classList.add('selected');
    };

    this.display_center= function()
    {
        if(!settings.isLoggedIn())
        {
            return;
        }
        Array.forEach( buttons, function(button)
        {
            button.classList.remove('selected');
        });
        slides.classList.remove('right_selected');
        slides.classList.remove('left_selected');
    };


    this.toggleLabel=function(e)
    {
        if(e.preventDefault) { e.preventDefault(); }
        if(e.stopPropagation) { e.stopPropagation(); }
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
        var self=this;
        li.classList.add('updating');
        this.controller.markRead(item_id, true)
            .then(function(result)
            {
                li.classList.remove('updating');
                li.classList.remove('fresh_item');
            }, function()
            {
                li.classList.remove('updating');
                self.alert(translate('network_error'));
            });

        return true;
    };

    this.markStarClick=function(e)
    {
        var self=this;
        if(e.preventDefault) { e.preventDefault(); }
        if(e.stopPropagation) { e.stopPropagation(); }
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
            Array.forEach(document.querySelectorAll("li[data-id='"+item_id+"']"), function(li)
            {
                var span = li.querySelector('.flag_star');
                span.classList.remove('ko');
                span.classList.remove('fa-star-o');
                span.classList.add('fa-star');
            });
        }
        else
        {
            Array.forEach(document.querySelectorAll("li[data-id='"+item_id+"']"), function(li)
            {
                var span = li.querySelector('.flag_star');
                span.classList.remove('fa-star');
                span.classList.add('ko');
                span.classList.add('fa-star-o');
            });
        }
        this.controller.markStar(item_id, !span.classList.contains('ko'))
            .then(function(result)
            {
                Array.forEach(document.querySelectorAll("li[data-id='"+item_id+"']"), function(li)
                {
                    var span = li.querySelector('.flag_star');
                    span.classList.remove('updating');
                });
            }, function()
            {
                Array.forEach(document.querySelectorAll("li[data-id='"+item_id+"']"), function(li)
                {
                    var span = li.querySelector('.flag_star');
                    span.classList.remove('updating');
                });
                self.alert(translate('network_error'));
            });

        return true;
    };

    this.markReadClick=function(e)
    {
        var self=this;
        if(e.preventDefault) { e.preventDefault(); }
        if(e.stopPropagation) { e.stopPropagation(); }
        var span = e.target;
        var li = e.target;
        while(li && li.tagName!=='LI')
        {
            li = li.parentNode;
        }
        var item_id = li.getAttribute('data-id');

        span.classList.add('updating');
        var read_state = !span.classList.contains('ko');

        if(read_state)
        {
            Array.forEach(document.querySelectorAll("li[data-id='"+item_id+"']"), function(li)
            {
                var span = li.querySelector('.flag_read');
                span.classList.add('ko');
                span.classList.remove('fa-check-square-o');
                span.classList.add('fa-square-o');
            });
        }
        else
        {
            Array.forEach(document.querySelectorAll("li[data-id='"+item_id+"']"), function(li)
            {
                var span = li.querySelector('.flag_read');
                span.classList.remove('fa-square-o');
                span.classList.remove('ko');
                span.classList.add('fa-check-square-o');
            });
        }
        this.controller.markRead(item_id, !read_state)
            .then(function(result)
            {
                Array.forEach(document.querySelectorAll("li[data-id='"+item_id+"']"), function(li)
                {
                    var span = li.querySelector('.flag_read');
                    span.classList.remove('updating');
                    if(read_state)
                    {
                        li.classList.add('fresh_item');
                    }
                    else
                    {
                        li.classList.remove('fresh_item');
                    }

                });
            }, function()
            {
                Array.forEach(document.querySelectorAll("li[data-id='"+item_id+"']"), function(li)
                {
                    var span = li.querySelector('.flag_read');
                    span.classList.remove('updating');
                });
                self.alert(translate('network_error'));
            });

        return true;
    };

    this.markLikeClick=function(e)
    {
        var self=this;
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
            }, function()
            {
                span.classList.remove('updating');
                self.alert(translate('network_error'));
            });

        return true;
    };

    this.displayDefaultLabel = function()
    {
        if(selected =document.querySelector('.leftlist_item.selected'))
        {
            selected.classList.remove('selected');
        }

        var li = document.querySelector('.leftlist_item');
        li.classList.add('selected');
        this.display_id = li.getAttribute('data-id');
        this.display_name = li.querySelector('.label').innerHTML;
        return this.clearAndLoadItems();
    };

    this.updateLeftList= function()
    {
        var self=this;

        return Promise.all([ this.controller.getFeeds(), this.controller.getLabels(), this.controller.getCounts() ])
        .then(function(values)
        {
            var feeds = values[0];
            var labels = values[1];
            var counts = values[2];

            // @TODO do not remove all, only update...
            self.clearLeft();

            // All items
            var li = document.createElement('li');
            li.className='leftlist_item leftlist_default';
            li.setAttribute('data-id', self.controller.all_id);
            var label_toggle = document.createElement('p');
            label_toggle.className='label_toggle fa fa-home';
            li.appendChild(label_toggle);
            var label = document.createElement('p');
            label.className='label';
            label.innerHTML = translate('state_reading_list');
            label.addEventListener('click', self.loadFeed.bind(self));
            li.appendChild(label);

            var label_num = document.createElement('p');
            label_num.className='label_num';
            li.appendChild(label_num);


            leftlist.appendChild(li);

            if(self.controller.starred_id)
            {
                // Starred items
                li = document.createElement('li');
                li.className='leftlist_item leftlist_default';
                li.setAttribute('data-id', self.controller.starred_id);
                label_toggle = document.createElement('p');
                label_toggle.className='label_toggle fa fa-star';
                li.appendChild(label_toggle);

                label = document.createElement('p');
                label.className='label';
                label.innerHTML = translate('state_starred');
                label.addEventListener('click', self.loadFeed.bind(self));
                li.appendChild(label);

                label_num = document.createElement('p');
                label_num.className='label_num';
                li.appendChild(label_num);

                leftlist.appendChild(li);
            }

            if(self.controller.liked_id)
            {
                // Liked items
                li = document.createElement('li');
                li.className='leftlist_item leftlist_default';
                li.setAttribute('data-id',self.controller.liked_id);

                label_toggle = document.createElement('p');
                label_toggle.className='label_toggle fa fa-heart';
                li.appendChild(label_toggle);

                label = document.createElement('p');
                label.className='label';
                label.innerHTML = translate('state_liked');
                label.addEventListener('click', self.loadFeed.bind(self));
                li.appendChild(label);

                label_num = document.createElement('p');
                label_num.className='label_num';
                li.appendChild(label_num);
                leftlist.appendChild(li);
            }

            if(self.controller.shared_id)
            {
                // Shared items
                li = document.createElement('li');
                li.className='leftlist_item leftlist_default';
                li.setAttribute('data-id',self.controller.shared_id);

                label_toggle = document.createElement('p');
                label_toggle.className='label_toggle fa fa-share-alt';
                li.appendChild(label_toggle);

                label = document.createElement('p');
                label.className='label';
                label.innerHTML = translate('state_shared');
                label.addEventListener('click', self.loadFeed.bind(self));
                li.appendChild(label);

                label_num = document.createElement('p');
                label_num.className='label_num';
                li.appendChild(label_num);
                leftlist.appendChild(li);
            }


            // Append all items
            Array.forEach(labels, function(label)
            {
                // Add only real labels
                if(/(label|user|CAT)/.test(label.id))
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

                    label = document.createElement('p');
                    label.className='label';
                    label.innerHTML = name;
                    label.addEventListener('click', self.loadFeed.bind(self));
                    li.appendChild(label);

                    var label_num = document.createElement('p');
                    label_num.className='label_num';
                    li.appendChild(label_num);

                    var label_delete = document.createElement('p');
                    label_delete.className='label_delete fa fa-remove hidden';
                    label_delete.addEventListener('click', self.delete_feed.bind(self));
                    li.appendChild(label_delete);

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
                    if(!items)
                    {
                        console.log('faile search ',re);
                        items = leftlist;
                    }
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
                if(feed.iconUrl)
                {
                    feed_icon.innerHTML = '<img src="'+feed.iconUrl+'" alt="" />';
                }
                div.appendChild(feed_icon);

                var feed_name = document.createElement('p');
                feed_name.className='feed_name';
                feed_name.innerHTML = feed.title;
                feed_name.addEventListener('click', self.loadFeed.bind(self));
                div.appendChild(feed_name);

                var label_num = document.createElement('p');
                label_num.className='label_num';
                div.appendChild(label_num);

                var label_delete = document.createElement('p');
                label_delete.className='label_delete fa fa-remove hidden';
                label_delete.addEventListener('click', self.delete_feed.bind(self));
                div.appendChild(label_delete);

                items.appendChild(div);
            });
            self.updateCount();
        }, function()
        {
            self.alert(translate('network_error'));
        });
    };

    this.updateCount = function()
    {
        var self=this;
        var viewRead = settings.getViewRead();

        this.controller.getCounts()
            .then(function(counts)
            {
                var sum=0;
                counts.forEach(function(count)
                {
                    sum+= count.count;
                    var name = count.id;//replace(/.*label\//,'')

                    var re = ".leftlist_item[data-id=\'"+name+"\']";
                    var item = document.querySelector(re);
                    if(item)
                    {
                        if(!viewRead && count.count===0 && !item.classList.contains('leftlist_default'))
                        {
                            item.classList.add("hidden");
                            item.classList.remove('with_unread');
                        }
                        else
                        {
                            item.classList.remove("hidden");
                            var label = item.querySelector('.label_num');
                            label.innerHTML= count.count;
                            if(count.count>0)
                            {
                                item.classList.add('with_unread');
                            }
                            else
                            {
                                item.classList.remove('with_unread');
                            }
                        }
                    }
                });
                if(self.old_sum!==sum)
                {
                    self.old_sum=sum;
                    if(document.hidden && sum>0)
                    {
                        notif.send(translate('notif_unread_items'),'( '+sum+' )');
                    }
                }
            }, function()
            {
                self.alert(translate('network_error'));
            });
    };


    this.clearLeft = function()
    {
        leftlist.innerHTML='';
    };

    this.loadMore = function()
    {
        if(!this.loading_items)
        {
            var no_items = document.querySelector('.no_items');
            if(no_items && document.querySelector('.no_items').getAttribute('data-continuation'))
            {
                this.loading_items=1;
                return this.displayItems(document.querySelector('.no_items').getAttribute('data-continuation'));
            }
        }
    };

    this.gotoTop=function()
    {
        center_scroll_container.scrollTop=0;
    };

    this.loadFeed = function(e)
    {
        var li = e.target;
        this.display_center();
        while(li && li.tagName!=='LI' && li.tagName!=='DIV')
        {
            li = li.parentNode;
        }

        if(selected =document.querySelector('.leftlist_item.selected'))
        {
            selected.classList.remove('selected');
        }
        li.classList.add('selected');
        this.display_id = li.getAttribute('data-id');
        this.display_name = li.querySelector('.label, .feed_name').innerHTML;
        return this.clearAndLoadItems();
    };

    this.clear= function()
    {
        if(!navigator.mozL10n.ctx.isReady)
        {
            return setTimeout(this.clear.bind(this), 10);
        }
        this.closeItem();
        this.wait_loading = 0;
        this.displayed_date = null;
        this.opened_item=null;
        this.feed_contents=[];
        var ul = center_scroll;
        ul.innerHTML='';

        // If not loggedin, create empty item to advice
        if(!settings.loggedin)
        {
            li = document.createElement('li');
            li.className='not_loggedin';
            li.innerHTML=translate('login_to_use');
            li.addEventListener('click', this.display_right.bind(this));
            ul.appendChild(li);
        }
    };

    this.refresh = function()
    {
        if(this.loading_items) { return; }
        this.loading_items=1;
        this.displayItems(null,'refresh');
    };

    this.clearAndLoadItems = function()
    {
        if(this.loading_items) { return; }
        this.loading_items=1;

        this.displayitems_total=0;
        this.displayitems_ok=0;

        this.clear();
        this.displayItems();
        this.gotoTop();
        if(this.display_name)
        {
            document.querySelector('h1').innerHTML=this.display_name;
        }
        else
        {
            document.querySelector('h1').innerHTML=translate('app_title');
        }
    };
    this.reset=function()
    {
        this.display_id=null;
        this.display_name=null;

        this.clear();
        this.clearLeft();
        this.clearAndLoadItems();
    };

    this.displayItems = function(continuation, mode)
    {
        var self=this;
        // Do nothing if not logged in
        if(!settings.loggedin)
        {
            this.loading_items=0;
            return;
        }

        this.controller.updateCount()
        .then(function()
        {
            self.updateCount();
        }, function()
        {
            self.alert(translate('error_update_count'));
        });

        var viewRead = settings.getViewRead();
        var hideRegexText = settings.getHideRegex();
        var showContent = settings.getShowContent();
        var showImage = settings.getShowImage();
        var id = this.display_id;

        var ul = center_scroll;
        var li;

        // Create hide regex if needed
        var hideRegex=null;
        if(hideRegexText)
        {
            hideRegex= new RegExp(hideRegexText,'i');
            console.log('created regex ',hideRegex);
        }

        // Remove previous load more  if present
        if(!(li=ul.querySelector('li.no_items')))
        {
            li = document.createElement('li');
            li.className='no_items';
            ul.appendChild(li);
        }
        li.innerHTML='<span class="fa fa-spinner fa-spin"></span> '+translate('loading_items');
        
        this.controller.getItems(id, viewRead, continuation)
            .then(function(r)
            {
                var ul = center_scroll;

                // Remove previous loading item
                if((remove = ul.querySelector('li.no_items')))
                {
                    ul.removeChild(remove);
                }
                var items = r.items;

                // Clear previous list
                if(!items || items.length===0)
                {
                    // No items (returned error...)
                    var li = document.createElement('li');
                    li.className='no_items';
                    li.innerHTML=translate('no_items');
                    ul.appendChild(li);
                }
                else
                {
                    items.forEach(function(item)
                    {
                        var li;

                        var display_search =
                            !self.search_value ||
                            item.title.toLowerCase().indexOf(self.search_value)!==-1 ||
                            item.summary.content.toLowerCase().indexOf(self.search_value)!==-1;

                        // Filter hide regex on title
                        if(hideRegex && hideRegex.test(item.title))
                        {
                            display_search=false;
                        }

                        self.displayitems_total++;
                        // No search, or search match
                        if(display_search)
                        {
                            self.displayitems_ok++;
                            var item_date = new Date(item.updated*1000).toLocaleFormat(translate("fulldate_format"));
                            if(item_date!== self.displayed_date)
                            {
                                li = document.createElement('li');
                                li.className='feed_fulldate';
                                li.innerHTML=item_date;
                                if(mode && mode==='refresh')
                                {
                                    if(! ul.querySelector(".feed_item[data-id='"+item.id+"']"))
                                    {
                                        ul.insertBefore(li,ul.firstChild);
                                    }
                                }
                                else
                                {
                                    ul.appendChild(li);
                                }
                                self.displayed_date = item_date;
                            }

                            var content = item.summary.content;
                            content = content.replace(/(<a[^>]+)>/ig,'$1 target="_blank">');
                            content = content.replace(/<\/script[^>]*>/,'');
                            var first_image =null;
                            if((re=content.match(/<img[^>]+src=["']([^"']+)/)))
                            {
                                first_image=re[1];
                            }

                            li = document.createElement('li');
                            li.setAttribute('feed_link', item.canonical[0].href);
                            li.setAttribute('readall_key', item.readall_key);
                            li.className='feed_item';
                            if(item.unread)
                            {
                                li.className+=' fresh_item';
                            }
                            li.setAttribute('data-id',item.id);
                            li.addEventListener('click', self.openItem.bind(self), false);



                            var div = document.createElement('div');
                            div.className='feed_header';
                            li.appendChild(div);

                            if(first_image && showImage)
                            {
                                p = document.createElement('p');
                                // Preload image and display only if big enough
                                (function(p)
                                {
                                    var img = new Image();
                                    img.onload=function()
                                    {
                                        if(img.width>50 && img.height>50)
                                        {
                                            p.classList.remove('hidden');
                                            p.style.backgroundImage = 'url('+first_image+')';
                                        }
                                    };
                                    img.src = first_image;
                                })(p);
                                p.className='feed_image hidden';
                                div.appendChild(p);
                            }

                            var p = document.createElement('p');
                            p.className='feed_title';
                            p.innerHTML = item.title;
                            div.appendChild(p);

                            if(showContent)
                            {
                                p = document.createElement('p');
                                p.className='feed_smalldesc';
                                p.innerHTML = content.replace(/<[^>]+>/g,'').substr(0, 70)+'&hellip;';
                                div.appendChild(p);
                            }
                            
                            var headerintro = document.createElement('div');
                            headerintro.className='headerintro';
                            li.appendChild(headerintro);

                            p = document.createElement('p');
                            p.className='feed_date feed_smalldate';
                            p.innerHTML = new Date(item.updated*1000).toLocaleFormat(translate("date_format"));
                            headerintro.appendChild(p);

                            p = document.createElement('p');
                            p.className='feed_fulldate feed_date';
                            p.innerHTML = new Date(item.updated*1000).toLocaleFormat(translate("fulldate_format"));
                            headerintro.appendChild(p);


                            p = document.createElement('p');
                            p.className='feed_flags';
                            headerintro.appendChild(p);

                            var flag_read = document.createElement('span');
                            flag_read.className='flag_read fa '+(!item.unread ? 'fa-check-square-o':'ko fa-square-o');
                            flag_read.addEventListener('click', self.markReadClick.bind(self), false);
                            p.appendChild(flag_read);

                            var flag_star = document.createElement('span');
                            flag_star.className='flag_star fa '+(!item.starred?'ko fa-star-o':'fa-star');
                            flag_star.addEventListener('click', self.markStarClick.bind(self), false);
                            p.appendChild(flag_star);

                            if(!self.controller.disable_liked)
                            {
                                var flag_like = document.createElement('span');
                                flag_like.className='flag_like fa '+(!item.liked?'ko fa-thumbs-o-up':'fa-thumbs-up');
                                p.appendChild(flag_like);
                            }

                            var flag_share = document.createElement('span');
                            flag_share.className='flag_share fa fa-share ko';
                            p.appendChild(flag_share);

                            p = document.createElement('p');
                            p.className='feed_origin';
                            p.innerHTML = item.origin.title;
                            headerintro.appendChild(p);

                            self.feed_contents[item.id] = content;
                            if(mode && mode==='refresh')
                            {
                                if(! ul.querySelector(".feed_item[data-id='"+item.id+"']"))
                                {
                                    ul.insertBefore(li,ul.querySelector('.feed_fulldate').nextElementSibling);
                                }
                            }
                            else
                            {
                                ul.appendChild(li);
                            }
                        }
                    });
                    if(r.continuation)
                    {
                        // Add load more items
                        var loadi = document.createElement('li');
                        loadi.className='no_items';
                        loadi.innerHTML=translate('load_more');
                        loadi.setAttribute('data-continuation', r.continuation);
                        loadi.addEventListener('click', self.loadMore.bind(self));
                        ul.appendChild(loadi);
                    }
                }
                self.loading_items=0;
                document.querySelector('.search_nums').innerHTML= self.displayitems_ok+'/'+self.displayitems_total;

                // Auto load next pages for first (x) results
                if(self.displayitems_total<settings.getMaxSearchItems())
                {
                    self.onscroll();
                }
            }, function()
            {
                self.loading_items=0;
                self.alert(translate('error_get_items'));
            });
    };

    this.closeItem = function()
    {
        if(this.opened_item)
        {
            // Scroll to opened item before closing
            center_scroll_container.scrollTop=this.opened_item.offsetTop;
        }

        this.opened_item=null;
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
        if(e.preventDefault) { e.preventDefault(); }
        if(e.stopPropagation) { e.stopPropagation(); }

        var target=e.target;
        var li = e.target;

        while(li && li.tagName!=='LI')
        {
            li = li.parentNode;
        }
        this.opened_item = li;

        next = li.nextElementSibling;
        if(next && next.getAttribute('data-continuation'))
        {
            this.loadMore();
        }


        var id  = li.getAttribute('data-id');

        if(li.classList.contains('fresh_item'))
        {
            this.markRead(li,id);
            li.querySelector('.flag_read').classList.remove('fa-square-o');
            li.querySelector('.flag_read').classList.add('fa-check-square-o');
            li.querySelector('.flag_read').classList.add('ko');

            li.classList.remove('fresh_item');
        }


        // Close previous opened item
        var check = document.querySelector('.feed_fullscreen');
        if(check)
        {
            check.parentNode.removeChild(check);
        }

        var newLi = li.cloneNode(true);
        newLi.querySelector('.flag_read').addEventListener('click', this.markReadClick.bind(this), false);
        newLi.querySelector('.flag_star').addEventListener('click', this.markStarClick.bind(this), false);
        if(!this.controller.disable_liked)
        {
            newLi.querySelector('.flag_like').addEventListener('click', this.markLikeClick.bind(this));
        }
        newLi.querySelector('.flag_share').addEventListener('click', function(e)
        {
            new MozActivity({
                name: "new",
                data: {
                    type: ["websms/sms", "mail"],
                    body: li.querySelector('.feed_title').innerHTML+' '+li.getAttribute('feed_link'),
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
            div.innerHTML = this.feed_contents[id]+'<p><a target="_blank" href="'+li.getAttribute('feed_link')+'">'+translate("view_article_on_browser")+'</a></p>';
            newLi.appendChild(div);
        }

    };
};

