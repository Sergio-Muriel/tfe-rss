var Owncloud = function()
{
    var self=this;
    this.type='owncloud';
    this.typename='Owncloud News';
    this.username = null;
    this.password = null;

    this.all_id  = 'FEED:-4';
    //this.starred_id  = 'user/-/state/com.google/starred';
    //this.liked_id = 'user/-/state/com.google/like';
    //this.shared_id = 'user/-/state/com.google/broadcast';


    // Init XHR object
    this.xhr = new XMLHttpRequest({ mozSystem: true });

    // Init indexed DB
    var db_request = indexedDB.open('owncloud');
    db_request.onsuccess = function (e) { self.db = e.target.result; };
    db_request.onerror = function (e) { console.log(e); };
};


Owncloud.prototype.create_form = function()
{
    var form = document.createElement('form');
    form.id=this.type;
    form.innerHTML=
        '<p class="form_text loggedin">'+translate('connected_with')+' '+this.typename+' /  <span id="loggedin_user"></span></p>'+
        '<p class="form_text loggedout" value="'+translate('enter_account_information')+'"></p>'+
        '<p>'+
        '<span class="form_help">'+translate('form_url_owncloud_help')+'</span>'+
        '<input type="url" name="url" placeholder="'+translate('form_url_owncloud')+'" required>'+
        '<input type="text" name="user" placeholder="'+translate('form_user')+'" required>'+
        '<input type="password" name="password" placeholder="'+translate('form_password')+'" required>'+
        '</p>'+
        '<p><button class="login_link bb-button bb-recommend">'+translate('login_link')+'</button></p>'+
        '<p><button class="logout_link bb-button bb-danger">'+translate('logout_link')+'</button></p>';
    return form;
};

Owncloud.prototype.init = function()
{
    var self=this;
    if(!self.inited)
    {
        this.form = this.create_form();
        this.login_link = this.form.querySelector('.login_link');
        this.logout_link = this.form.querySelector('.logout_link');
        this.user = this.form.querySelector('input[name=user]');
        this.url = this.form.querySelector('input[name=url]');
        this.password = this.form.querySelector('input[name=password]');
        // Bind buttons
        this.form.addEventListener('submit', function(e) { return self.login(e); }, false);
        this.login_link.addEventListener('submit', function(e) { return self.login.bind(self)(e); }, false);
        this.logout_link.addEventListener('click', function(e) { return self.logout.bind(self)(e); }, false);
        settings.add_api(this.type, this.typename, this.form);
    }
    self.inited=1;

    return Promise.all([
            this.initDb()
    ]);
};

Owncloud.prototype.logout = function(e)
{
    this.deleteAccount(this.loggedout.bind(this));
    settings.logout();
    e.preventDefault();
};

Owncloud.prototype.login= function(e)
{
    var self=this;
    if(this.form.checkValidity())
    {
        e.preventDefault();

        this._login(this.user.value,this.password.value)
            .then(
                settings.init_accounts.bind(settings),
                function()
                {
                    settings.alert(translate('login_fail'));
                });
    }
    else
    {
        e.preventDefault();
        return false;
    }
};

Owncloud.prototype.initDb = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var request = indexedDB.open('owncloud_db',2.3);
        request.onsuccess = function (e) {
            self.db = e.target.result;
            ok();
        };
        request.onerror = function (e) {
            console.log(e);
            reject();
        };
        request.onupgradeneeded = function (e) {
            self.db = e.target.result;

            if (self.db.objectStoreNames.contains("labels")) {
                self.db.deleteObjectStore("labels");
            }
            if (self.db.objectStoreNames.contains("accounts")) {
                self.db.deleteObjectStore("accounts");
            }
            if (self.db.objectStoreNames.contains("feeds")) {
                self.db.deleteObjectStore("feeds");
            }
            if (self.db.objectStoreNames.contains("counts")) {
                self.db.deleteObjectStore("counts");
            }
            if (self.db.objectStoreNames.contains("items")) {
                self.db.deleteObjectStore("items");
            }

            var objectStore = self.db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });

            objectStore = self.db.createObjectStore('feeds', { keyPath: 'id', autoIncrement: true });

            objectStore = self.db.createObjectStore('counts', { keyPath: 'id', autoIncrement: true });

            objectStore = self.db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });

            objectStore = self.db.createObjectStore('labels', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex("sortid", "sortid", { unique: false });
            objectStore.createIndex("id", "id", { unique: false });
        };
    });

};

// Methodes
Owncloud.prototype._login = function(user, password)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        settings.alert(translate('connecting_to_the_account'));
        var r = self.xhr;
        r.open("GET", self.url.value+'/api/v1-2/feeds', true);
        r.setRequestHeader("Authorization","Basic "+btoa(user+":"+password));
        r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        r.onreadystatechange = function () {
            if (r.readyState == 4)
            {
                var data;
                try
                {
                    data = JSON.parse(r.responseText);
                }
                catch(err)
                {
                    settings.alert('ERROR: '+r.responseText);
                    reject();
                    return;
                }
                self.create_account(self.url.value, user, password)
                    .then(ok);
            }
        };

        // Send xhr request
        r.send(JSON.stringify({ op : 'login', user: user, password: password }));
    });
};

Owncloud.prototype.loggedin = function()
{
    this.user.value = this.getUser();
    this.url.value = this.getHost();
    this.form.querySelector('#loggedin_user').innerHTML= this.getUser();
    this.form.classList.add("loggedin");
    this.user.disabled=true;
    this.url.disabled=true;
};

Owncloud.prototype.loggedout = function()
{
    this.form.querySelector('#loggedin_user').innerHTML= '';
    this.form.classList.remove("loggedin");
    this.user.disabled=false;
    this.url.disabled=false;
};

Owncloud.prototype.create_account = function(host, user, password)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var transaction = self.db.transaction([ 'accounts' ], 'readwrite');
        //Create the Object to be saved i.e. our Note
        var value = {};
        value.host = host;
        value.user = user;
        value.password = password;

        var accounts = transaction.objectStore('accounts');
        var request = accounts.add(value);
        request.onsuccess = function (e) {
            ok();
        };
        request.onerror = function (e) {
            reject();
        };
    });
};

Owncloud.prototype.getAccount = function(callback)
{
    var account = null;
    var self=this;

    var transaction = this.db.transaction([ 'accounts' ]);
    var dbaccounts = transaction.objectStore('accounts');
    var received=false;

    // open a cursor to retrieve all items from the 'notes' store
    dbaccounts.openCursor().onsuccess = function (e) {
        var cursor = e.target.result;
        if (cursor) {
            received=true;
            self.account = cursor.value;
            self.host =  self.account.host;
            cursor.continue();
            // Test connection
            var url = self.host+'/api/';
            callback(self.account);
        }
        else if(!received)
        {
            callback(null);
        }
    };
};

Owncloud.prototype.getUser = function()
{
    return this.account  ? this.account.user : '';
};
Owncloud.prototype.getHost = function()
{
    return this.account  ? this.account.host : '';
};




Owncloud.prototype.deleteAccount = function(callback)
{
    if(this.account)
    {
        var request = this.db.transaction(["accounts"], "readwrite")
            .objectStore("accounts")
            .delete(this.account.id);
        request.onsuccess = function(event) {
            callback();
        };
        this.account=null;
    }
};

Owncloud.prototype.isLoggedIn = function(callback)
{
    if(!this.account)
    {
        return false;
    }
    return true;
};

Owncloud.prototype._query = function(method,url,data,callback)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        // Init XHR object
        var r = new XMLHttpRequest({ mozSystem: true });
        r.open(method, url, true);

        if(self.account)
        {
            r.setRequestHeader("Authorization","Basic "+btoa(self.account.user+":"+self.account.password));
        }
        if(!data || typeof data ==='string')
        {
            r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        }
        else
        {
            data = JSON.stringify(data);
            r.setRequestHeader("Content-type","application/json");
        }

        r.onreadystatechange = function () {
            if (r.readyState == 4)
            {
                if(r.status == 200)
                {
                    return ok(r.responseText);
                }
                else
                {
                    return reject(null);
                }
            }
        };
        r.send(data);
    });
};



Owncloud.prototype.updateSubscriptionList = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/v1-2/feeds';
        self._query.bind(self)("GET", url)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    self.addSubscriptions(data.feeds)
                        .then(ok, reject);
                }
                else
                {
                    reject();
                }   
            }, reject);
    });
};

Owncloud.prototype.addSubscriptions = function(subscriptions)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var transaction_feeds = self.db.transaction([ 'feeds' ], 'readwrite');
        transaction_feeds.oncomplete= ok;
        transaction_feeds.onerror= reject;

        // Remove previous feeds
        var allfeeds = transaction_feeds.objectStore('feeds');
        allfeeds.clear();

        //Create the Object to be saved i.e. our Note
        subscriptions.forEach(function(feed)
        {
            var feeds = transaction_feeds.objectStore('feeds');
            feed.category = 'CAT:'+feed.folderId;
            if(feed.faviconLink)
            {
                feed.iconUrl = feed.faviconLink;
            }
            var request = feeds.add(feed);
        });
    });
};

Owncloud.prototype.updateLabelsList = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/v1-2/folders';
        self._query.bind(self)("GET", url)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    self.addLabels(data.folders)
                        .then(ok, reject);
                }
                else
                {
                    reject();
                }
            }, reject);
    });
};

Owncloud.prototype.addLabels = function(labels)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var transaction_labels = self.db.transaction([ 'labels' ], 'readwrite');
        //Create the Object to be saved i.e. our Note
        transaction_labels.oncomplete= ok;
        transaction_labels.onerror= reject;

        // Remove previous labels
        var alllabels = transaction_labels.objectStore('labels');
        alllabels.clear();

        labels.forEach(function(data)
        {
            var labels = transaction_labels.objectStore('labels');
            data.label = data.name;
            data.id ='CAT:'+data.id;
            var request = labels.add(data);
        });
    });
};

Owncloud.prototype.updateCount = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/v1-2/feeds';
        self._query.bind(self)("GET", url)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    self.addCounts(data.feeds)
                        .then(ok, reject);
                }
                else
                {
                    reject();
                }
            }, reject);
    });
};

Owncloud.prototype.addCounts = function(counts)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var transaction_counts = self.db.transaction([ 'counts' ], 'readwrite');
        //Create the Object to be saved i.e. our Note
        transaction_counts.oncomplete= ok;
        transaction_counts.onerror= reject;

        // Remove previous counts
        var allcounts = transaction_counts.objectStore('counts');
        allcounts.clear();

        var sum_cats = {};
        var total=0;
        counts.forEach(function(data)
        {
            if(!sum_cats[data.folderId])
            {
                sum_cats[data.folderId]= 0;
            }
            total+=data.unreadCount;
            sum_cats[data.folderId]+= data.unreadCount;

            var counts_save = transaction_counts.objectStore('counts');
            var save_data={};
            save_data.count = data.unreadCount;
            save_data.id=data.id;
            var request = counts_save.add(save_data);
        });
        // add global coutn
        var counts_save = transaction_counts.objectStore('counts');
        var save_data={};
        save_data.count = total;
        save_data.id=self.all_id;
        var request = counts_save.add(save_data);

        // add cat sums
        for(var label in sum_cats)
        {
            var counts_save = transaction_counts.objectStore('counts');
            var save_data={};
            save_data.count = sum_cats[label];
            save_data.id='CAT:'+label;
            var request = counts_save.add(save_data);
        }
    });
};

Owncloud.prototype.fullupdate = function()
{
    return Promise.all([
            this.updateSubscriptionList(),
            this.updateLabelsList(),
            this.updateCount()
    ]);
};

Owncloud.prototype.getFeeds = function()
{
    var self=this;
    self.feed_cache = {};
    return new Promise(function(ok, reject)
    {
        var feeds = [];

        var transaction = self.db.transaction([ 'feeds' ]);
        var dbfeeds = transaction.objectStore('feeds');

        // open a cursor to retrieve all items from the 'notes' store
       var c = dbfeeds.openCursor();
       c.onsuccess = function (e) {
            var cursor = e.target.result;
            if (cursor) {
                feeds.push(cursor.value);
                self.feed_cache[cursor.value.id] = cursor.value;
                cursor.continue();
            }
            else
            {
                ok(feeds);
            }
        };
       c.onerror = reject;
    });
};

Owncloud.prototype.getLabels = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var labels = [];

        var transaction = self.db.transaction([ 'labels' ]);
        var dblabels = transaction.objectStore('labels');
        var index = dblabels.index('id');

        // open a cursor to retrieve all items from the 'notes' store
       var c = index.openCursor();
       c.onsuccess = function (e) {
            var cursor = e.target.result;
            if (cursor) {
                labels.push(cursor.value);
                cursor.continue();
            }
            else
            {
                ok(labels);
            }
        };
       c.onerror = reject;
    });
};

Owncloud.prototype.getCounts = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var counts = [];

        var transaction = self.db.transaction([ 'counts' ]);
        var dbcounts = transaction.objectStore('counts');

        // open a cursor to retrieve all items from the 'notes' store
       var c = dbcounts.openCursor();
       c.onsuccess = function (e) {
            var cursor = e.target.result;
            if (cursor) {
                counts.push(cursor.value);
                cursor.continue();
            }
            else
            {
                ok(counts);
            }
        };
       c.onerror = reject;
    });
};

Owncloud.prototype.getItems = function(id, viewRead, next, limit)
{
    var self=this;

    return new Promise(function(ok, reject)
    {
        if(!next) { next= 0; }
        if(!limit) { limit= 20; }
        var items=[];
        var ids=[];
        var url = self.host+'/api/v1-2/items?';

        var is_cat= /CAT/.test(id);
        var url_id = id;

        var url_type = "3";
        if(is_cat)
        {
            url_type="1";
        }
        else if(url_id==self.all_id)
        {
            url_id="3";
        }

        url+= 
            'batchSize=20&'+
            'type='+(url_type)+'&'+
            'id='+url_id.replace(/FEED:|CAT:/,'')+'&'+
            'getRead='+(viewRead ? 1:0)+'&'+
            (next ? 'offset='+next+'&' : '')
        ;
        console.log('url ',url);
        self._query.bind(self)("GET", url)
            .then(function(text)
            {
                var received = JSON.parse(text);
                if(received)
                {
                    var data;
                    if(received.items)
                    {
                        data = { continuation: (received.items.length==20 ? received.items[received.items.length-1].id : null), items: [] }; 
                        Array.forEach(received.items, function(item)
                        {
                            var newitem= {
                                readall_key : item.id,
                                category:  id,
                                id: item.id,
                                published: item.pubDate,
                                updated: item.pubDate,
                                title: item.title,
                                summary : { content: item.body },
                                canonical: [ { href: item.url } ],
                                unread: item.unread,
                                origin: { title:  self.feed_cache[item.feedId] ?  self.feed_cache[item.feedId].title : '?' },
                                starred: item.starred,
                                liked: false
                            };
                            data.items.push(newitem);
                        });
                    }
                    else
                    {
                        data = { error: 'x' };
                    }
                    ok(data);
                }
                else
                {
                    reject();
                }
            }, reject);
    });
};

Owncloud.prototype.markRead= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/';
        var data= {
            op: 'updateArticle',
            article_ids: item_id,
            mode: state ? 0 : 1,
            field: 2 // unread
        };

        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Owncloud.prototype.deleteFeed= function(item_id)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/';
        var data= {
            op: 'unsubscribeFeed',
            feed_id: item_id.replace(/(CAT|FEED):/,''),
        };
        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Owncloud.prototype.markLike= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/';
        var data= {
            op: 'updateArticle',
            article_ids: item_id,
            mode: state ? 1 : 0,
            field:  1 // like (published)
        };

        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Owncloud.prototype.markStar= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/';
        var data= {
            op: 'updateArticle',
            article_ids: item_id,
            mode: state ? 1 : 0,
            field:  0 // star
        };

        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Owncloud.prototype.readAll= function(item_id)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/';
        var data= {
            op: 'catchupFeed',
            feed_id: item_id.replace(/(CAT|FEED):/,''),
            is_cat: /CAT/.test(item_id)
        };

        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Owncloud.prototype.addFeed= function(url)
{
    var self=this;
    var addurl = url;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/api/';
        var data = { op: 'subscribeToFeed',  category_id: 0, feed_url: addurl, login: 'tfe', password: 'tfe' } ;

        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data.error)
                {
                    reject(data);
                }
                else
                {
                    ok(data);
                }
            }, reject);
    });
};

