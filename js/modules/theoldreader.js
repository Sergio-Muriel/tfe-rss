var TheOldReader = function()
{
    var self=this;
    this.type='theoldreader';
    this.typename='The Old Reader';
    this.username = null;
    this.password = null;

    this.all_id  = 'user/-/state/com.google/reading-list';
    this.starred_id  = 'user/-/state/com.google/starred';
    this.liked_id = 'user/-/state/com.google/like';
    this.shared_id = 'user/-/state/com.google/broadcast';


    this.host = 'https://theoldreader.com/';

    // Init XHR object
    this.xhr = new XMLHttpRequest({ mozSystem: true });

    // Init indexed DB
    var db_request = indexedDB.open('theoldreader');
    db_request.onsuccess = function (e) { self.db = e.target.result; };
    db_request.onerror = function (e) { console.log(e); };
};


TheOldReader.prototype.create_form = function()
{
    var form = document.createElement('form');
    form.id=this.type;
    form.innerHTML=
        '<p class="form_text loggedin">'+translate('connected_with')+' '+this.typename+' /  <span id="loggedin_email"></span></p>'+
        '<p class="form_text loggedout" value="'+translate('enter_account_information')+'"></p>'+
        '<p>'+
        '<input type="email" name="email" placeholder="'+translate('form_email')+'" required>'+
        '<input type="password" name="password" placeholder="'+translate('form_password')+'" required>'+
        '</p>'+
        '<p><button class="login_link bb-button bb-recommend">'+translate('login_link')+'</button></p>'+
        '<p><button class="logout_link bb-button bb-danger">'+translate('logout_link')+'</button></p>'+
        '<p><button class="register_link bb-button">'+translate('register_link')+'</button></p>';
    return form;
};

TheOldReader.prototype.init = function()
{
    var self=this;
    if(!self.inited)
    {
        // Bind buttons
        this.form = this.create_form();
        this.login_link = this.form.querySelector('.login_link');
        this.logout_link = this.form.querySelector('.logout_link');
        this.register_link = this.form.querySelector('.register_link');
        this.email = this.form.querySelector('input[name=email]');
        this.password = this.form.querySelector('input[name=password]');

        this.form.addEventListener('submit', function(e) { return self.login(e); }, false);
        this.login_link.addEventListener('submit', function(e) { return self.login.bind(self)(e); }, false);
        this.logout_link.addEventListener('click', function(e) { return self.logout.bind(self)(e); }, false);
        this.register_link.addEventListener('click', function(e) { return self.register.bind(self)(e); });

        settings.add_api(this.type, this.typename, this.form);
    }
    self.inited=1;

    return Promise.all([
            this.initDb()
    ]);
};

TheOldReader.prototype.logout = function(e)
{
    this.deleteAccount(this.loggedout.bind(this));
    settings.logout();
    e.preventDefault();
};

TheOldReader.prototype.login= function(e)
{
    var self=this;
    if(this.form.checkValidity())
    {
        e.preventDefault();

        this._login(this.email.value,this.password.value)
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

TheOldReader.prototype.initDb = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var request = indexedDB.open('theoldreader_db',2.3);
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
TheOldReader.prototype._login = function(email, password)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        settings.alert(translate('connecting_to_the_account'));
        var r = self.xhr;
        r.open("POST", self.host+"/accounts/ClientLogin", true);
        r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        r.onreadystatechange = function () {
            if (r.readyState == 4)
            {
                var auth_token;
                if(r.status == 200 && (auth_token = r.responseText.match(/Auth=(.*)/)))
                {
                    // Save token and call callbak
                    self.create_account(email,auth_token[1])
                        .then(ok);
                }
                else if(r.status===0)
                {
                    reject();
                }
                else
                {
                    // Bad identification, return callback
                    reject();
                }
            }
        };

        // Send xhr request
        r.send('client=Rssclient&'+
                'accountType=HOSTED_OR_GOOGLE&'+
                'service=reader&'+
                'Email='+encodeURIComponent(email)+'&'+
                'Passwd='+encodeURIComponent(password)
        );
    });
};

TheOldReader.prototype.loggedin = function()
{
    this.form.querySelector('#loggedin_email').innerHTML= this.getEmail();
    this.form.classList.add("loggedin");
    this.email.disabled=true;
};

TheOldReader.prototype.loggedout = function()
{
    this.form.querySelector('#loggedin_email').innerHTML= '';
    this.form.classList.remove("loggedin");
    this.email.disabled=false;
};

TheOldReader.prototype.create_account = function(email, token)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var transaction = self.db.transaction([ 'accounts' ], 'readwrite');
        //Create the Object to be saved i.e. our Note
        var value = {};
        value.email = email;
        value.token = token;

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

TheOldReader.prototype.getAccount = function(callback)
{
    var account = null;
    var self=this;

    var transaction = this.db.transaction([ 'accounts' ]);
    var dbaccounts = transaction.objectStore('accounts');

    // open a cursor to retrieve all items from the 'notes' store
    dbaccounts.openCursor().onsuccess = function (e) {
        var cursor = e.target.result;
        if (cursor) {
            self.account = cursor.value;
            cursor.continue();
        }
        else
        {
            callback(self.account);
        }
    };
};

TheOldReader.prototype.getEmail = function()
{
    return this.account  ? this.account.email : '';
};


TheOldReader.prototype.getRegisterLink = function()
{
    return 'https://theoldreader.com/#sign_up';
};


TheOldReader.prototype.deleteAccount = function(callback)
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

TheOldReader.prototype.isLoggedIn = function(callback)
{
    if(!this.account)
    {
        return false;
    }
    return true;
};

TheOldReader.prototype._query = function(method,url,data,callback)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        if(!self.account || !self.account.token)
        {
            reject();
        }

        // Init XHR object
        var r = new XMLHttpRequest({ mozSystem: true });
        r.open(method, url, true);
        r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        r.setRequestHeader("authorization","GoogleLogin auth="+self.account.token);

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
            else
            {
            }
        };
        r.send(data);
    });
};



TheOldReader.prototype.updateSubscriptionList = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/subscription/list?output=json';
        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    self.addSubscriptions(data.subscriptions)
                        .then(ok, reject);
                }
                else
                {
                    reject();
                }   
            }, reject);
    });
};

TheOldReader.prototype.addSubscriptions = function(subscriptions)
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
        subscriptions.forEach(function(data)
        {
            var feeds = transaction_feeds.objectStore('feeds');
            data.category = data.categories.length>0 ?  data.categories[0].id : '';
            data.iconUrl = 'https://'+data.iconUrl;
            var request = feeds.add(data);
        });
    });
};

TheOldReader.prototype.updateLabelsList = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/tag/list?output=json';
        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    self.addLabels(data.tags)
                        .then(ok, reject);
                }
                else
                {
                    reject();
                }
            }, reject);
    });
};

TheOldReader.prototype.addLabels = function(labels)
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
            var request = labels.add(data);
        });
    });
};

TheOldReader.prototype.updateCount = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/unread-count?output=json';
        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    self.addCounts(data.unreadcounts)
                        .then(ok, reject);
                }
                else
                {
                    reject();
                }
            }, reject);
    });
};

TheOldReader.prototype.addCounts = function(counts)
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

        counts.forEach(function(data)
        {
            var counts = transaction_counts.objectStore('counts');
            var request = counts.add(data);
        });
    });
};

TheOldReader.prototype.fullupdate = function()
{
    return Promise.all([
            this.updateSubscriptionList(),
            this.updateLabelsList(),
            this.updateCount()
    ]);
};

TheOldReader.prototype.getFeeds = function()
{
    var self=this;
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
                if(!/sponsored/.test(cursor.value.id))
                {
                    feeds.push(cursor.value);
                }
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

TheOldReader.prototype.getLabels = function()
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
                if(/label/.test(cursor.value.id))
                {
                    labels.push(cursor.value);
                }
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

TheOldReader.prototype.getCounts = function()
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

TheOldReader.prototype.getItems = function(id, viewRead, next)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var items=[];
        var ids=[];
        var url = self.host+'/reader/api/0/stream/items/ids?output=json&s='+id;
        if(!viewRead)
        {
            url+='&xt=user/-/state/com.google/read';
        }
        if(next)
        {
            url+='&c='+next;
        }

        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var items = JSON.parse(text);
                if(items)
                {
                    var itemids = items.itemRefs;
                    var url = self.host+'/reader/api/0/stream/items/contents?output=json';
                    itemids.forEach(function(item)
                    {
                        url+='&i='+item.id;
                    });
                    console.log('fetch ',url);
                    self._query.bind(self)("GET", url, null)
                        .then(function(text)
                        {
                            var data = JSON.parse(text);
                            if(data)
                            {
                                data.continuation = items.continuation;
                                if(data.items)
                                {
                                    Array.forEach(data.items, function(item)
                                    {
                                        item.starred = item.categories.indexOf('user/-/state/com.google/starred')!==-1;
                                        item.liked = item.categories.indexOf('user/-/state/com.google/like')!==-1;
                                        item.unread = item.categories.indexOf('user/-/state/com.google/fresh')!==-1;
                                    });
                                }
                                ok(data);
                            }
                            else
                            {
                                reject();
                            }
                        }, reject);

                }
                else
                {
                    reject();
                }
            }, reject);
    });
};

TheOldReader.prototype.markRead= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/edit-tag?output=json';

        var data='i='+item_id;
        data+= (state ? '&a=' : '&r=');
        data+= 'user/-/state/com.google/read';
        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};
TheOldReader.prototype.deleteFeed= function(item_id)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/subscription/edit';

        var data= 'ac=unsubscribe&s='+item_id;
        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

TheOldReader.prototype.markLike= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/edit-tag?output=json';

        var data='i='+item_id;
        data+= (state ? '&a=' : '&r=');
        data+= 'user/-/state/com.google/like';
        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

TheOldReader.prototype.markStar= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/edit-tag?output=json';

        var data='i='+item_id;
        data+= (state ? '&a=' : '&r=');
        data+= 'user/-/state/com.google/starred';
        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

TheOldReader.prototype.readAll= function(item_id)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/mark-all-as-read';

        var data='s='+item_id;
        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

TheOldReader.prototype.addFeed= function(url)
{
    var self=this;
    var addurl = url;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/subscription/quickadd';
        var data = 'quickadd='+encodeURIComponent(addurl);

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

