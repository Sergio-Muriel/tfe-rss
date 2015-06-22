var Feedly = function()
{
    var self=this;
    this.type='feedly';
    this.typename='Feedly';
    this.username = null;
    this.password = null;
    this.token = null;



    this.host = 'https://feedly.com/';
    this.clientid ='tferss';
    this.clientsecret ='FE01PN2RZ308KLZ07NAV5SWAF8UR';
    this.redirect_url ='http://localhost/';

    // Init XHR object
    this.xhr = new XMLHttpRequest({ mozSystem: true });

    // Init indexed DB
    var db_request = indexedDB.open('feedly');
    db_request.onsuccess = function (e) { self.db = e.target.result; };
    db_request.onerror = function (e) { console.log(e); };
};


Feedly.prototype.create_form = function()
{
    var form = document.createElement('form');
    form.id=this.type;
    form.innerHTML=
        '<p class="form_text loggedin">'+translate('connected_with')+' '+this.typename+' /  <span id="loggedin_email"></span></p>'+
        '<p class="loggedin" value="'+translate('login_feedly_text')+'"></p>'+
        '<p><button class="login_link bb-button bb-recommend">'+translate('login_with_feedly')+'</button></p>'+
        '<p><button class="logout_link bb-button bb-danger">'+translate('logout_link')+'</button></p>';

    if(location.search)
    {
        this.callback(location.href);
    }
    return form;
};

Feedly.prototype.init = function()
{
    var self=this;
    if(!self.inited)
    {
        this.form = this.create_form();
        this.login_link = this.form.querySelector('.login_link');
        this.logout_link = this.form.querySelector('.logout_link');

        // Bind
        self.form.querySelector('.login_link').addEventListener('click', this.login.bind(this));
        this.logout_link.addEventListener('click', function(e) { return self.logout(e); }, false);
        settings.add_api(this.type, this.typename, this.form);
    }
    self.inited=1;

    return Promise.all([
            this.initDb()
    ]);
};

Feedly.prototype.logout = function(e)
{
    this.deleteAccount(this.loggedout.bind(this));
    clearInterval(self.refresh_interval);

    settings.logout();
    e.preventDefault();
};

Feedly.prototype.login= function(e)
{
    var url=this.host+'/v3/auth/auth';
    url+='?response_type=code&';
    url+='client_id='+this.clientid+'&';
    url+='redirect_uri='+encodeURIComponent('http://localhost')+'&';
    url+='scope='+encodeURIComponent('https://cloud.feedly.com/subscriptions')+'&';

    window.open(url);
    e.preventDefault();
    return false;
};

Feedly.prototype.refresh_token= function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        if(!self.account)
        {
            reject();
        }

        var data  = 'refresh_token='+encodeURIComponent(self.account.refresh_token)+'&';
        data += 'client_id='+encodeURIComponent(self.clientid)+'&';
        data += 'client_secret='+encodeURIComponent(self.clientsecret)+'&';
        data += 'grant_type='+encodeURIComponent('refresh_token');
        self._query.bind(self)("POST", self.host+'/v3/auth/token', data)
        .then(function(text)
        {
            var data = JSON.parse(text);
            console.log('refresh token: ',data);
            self.update_account(data.access_token.replace(':'+self.clientid,''))
                .then(ok, reject);
        }, reject);
    });
};


Feedly.prototype.callback = function(url)
{
    var self=this;
    console.log('Callback url: ',url);
    var reCode = /code=([^&]+)/;
    var reError = /error=([^&]+)/;
    if((result = url.match(reError)))
    {
        alert(translate('login_feedly_error'));
    }
    else if((result = url.match(reCode)))
    {
        var code=result[1];
        var data  = 'code='+encodeURIComponent(code)+'&';
        data += 'client_id='+encodeURIComponent(this.clientid)+'&';
        data += 'client_secret='+encodeURIComponent(this.clientsecret)+'&';
        data += 'redirect_uri='+encodeURIComponent(this.redirect_url)+'&';
        data += 'state=1&';
        data += 'grant_type='+encodeURIComponent('authorization_code');

        this.getToken(data).
            then(this.getProfile.bind(this));
        console.log('received',data);
    }
};

Feedly.prototype.getToken = function(data)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        self._query.bind(self)("POST", self.host+'/v3/auth/token', data)
        .then(function(text)
        {
            var data = JSON.parse(text);
            console.log('received token ',data);
            self.account=data;
            self.getProfile()
            .then(self.create_account.bind(self,data.access_token.replace(':'+self.clientid,''), data.refresh_token))
            .then(settings.init_accounts.bind(settings))
            .then(ok);
        }, reject);
    });
};

Feedly.prototype.getProfile = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        self._query.bind(self)("GET", self.host+'/v3/profile', null)
        .then(function(text)
        {
            var data = JSON.parse(text);
            self.userid = data.id;
            self.email = data.email;
            ok();
        }, reject);
    });
};

Feedly.prototype.initDb = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var request = indexedDB.open('feedly_db',2.3);
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

Feedly.prototype.loggedin = function()
{
    this.form.querySelector('#loggedin_email').innerHTML= this.getEmail();
    this.form.classList.add("loggedin");
};

Feedly.prototype.loggedout = function()
{
    this.form.querySelector('#loggedin_email').innerHTML= '';
    this.form.classList.remove("loggedin");
};

Feedly.prototype.create_account = function(access_token, refresh_token)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var transaction = self.db.transaction([ 'accounts' ], 'readwrite');
        //Create the Object to be saved i.e. our Note
        var value = {};
        value.access_token = access_token;
        value.refresh_token = refresh_token;
        value.userid = self.userid;
        value.email = self.email;

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

Feedly.prototype.update_account = function(token)
{
    var account = null;
    var self=this;

    return new Promise(function(ok, reject)
    {
        var objectStore = self.db.transaction(["accounts"], "readwrite").objectStore("accounts");
        var request = objectStore.get(self.account.id);
        request.onerror = reject;
        request.onsuccess = function(event) {
            var data = request.result;
            data.access_token = token;

            // Put this updated object back into the database.
            var requestUpdate = objectStore.put(data);
            requestUpdate.onerror = reject;
            requestUpdate.onsuccess = ok;
        };
    });
};

Feedly.prototype.getAccount = function(callback)
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
            self.all_id = 'user/'+self.account.userid+'/category/global.all';
            self.starred_id = 'user/'+self.account.userid+'/tag/global.must';
            self.liked_id = 'user/'+self.account.userid+'/tag/global.saved';
            cursor.continue();
        }
        else
        {
            self.refresh_token().then(callback, callback);
            // Make Loop to refresh token every hour
            self.refresh_interval=window.setInterval(function()
            {
                self.refresh_token().then(function(){});
            }, 1000*3600 /* hour */);
        }
    };
};

Feedly.prototype.getEmail = function()
{
    return this.account  ? this.account.email : '';
};


Feedly.prototype.getRegisterLink = function()
{
    return 'https://theoldreader.com/#sign_up';
};


Feedly.prototype.deleteAccount = function(callback)
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

Feedly.prototype.isLoggedIn = function(callback)
{
    if(!this.account)
    {
        return false;
    }
    return true;
};

Feedly.prototype._query = function(method,url,data,callback)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        // Init XHR object
        var r = new XMLHttpRequest({ mozSystem: true });
        r.open(method, url, true);
        if(!data || typeof data ==='string')
        {
            r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        }
        else
        {
            data = JSON.stringify(data);
            r.setRequestHeader("Content-type","application/json");
        }
        if(self.account)
        {
            r.setRequestHeader("authorization","OAuth "+self.account.access_token);
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



Feedly.prototype.updateSubscriptionList = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/v3/subscriptions';
        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    self.addSubscriptions(data)
                        .then(ok, reject);
                }
                else
                {
                    reject();
                }   
            }, reject);
    });
};

Feedly.prototype.addSubscriptions = function(subscriptions)
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
            var request = feeds.add(data);
        });
    });
};

Feedly.prototype.updateLabelsList = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/v3/categories';
        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    // Modify to fit theoldreader
                    self.addLabels(data)
                        .then(ok, reject);
                }
                else
                {
                    reject();
                }
            } ,reject);
    });
};

Feedly.prototype.addLabels = function(labels)
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

Feedly.prototype.updateCount = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/v3/markers/counts';
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

Feedly.prototype.addCounts = function(counts)
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

Feedly.prototype.fullupdate = function()
{
    return Promise.all([
            this.updateSubscriptionList(),
            this.updateLabelsList(),
            this.updateCount()
    ]);
};

Feedly.prototype.getFeeds = function()
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
                feeds.push(cursor.value);
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

Feedly.prototype.getLabels = function()
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

Feedly.prototype.getCounts = function()
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

Feedly.prototype.getItems = function(id, viewRead, next)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var items=[];
        var ids=[];
        var url = self.host+'/v3/streams/ids?streamId='+id;
        if(!viewRead)
        {
            url+='&unreadOnly=true';
        }
        if(next)
        {
            url+='&continuation='+next;
        }
        console.log('fetch ',url);

        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var items = JSON.parse(text);
                if(items)
                {
                    var itemids = items.ids;
                    var url = self.host+'/v3/entries/.mget';
                    self._query.bind(self)("POST", url, itemids)
                        .then(function(text)
                        {
                            var data = JSON.parse(text);
                            if(data)
                            {
                                Array.forEach(data, function(item)
                                {
                                    item.liked=false;
                                    item.starred=false;
                                    if(item.updated)
                                    {
                                        item.updated = item.updated/1000;
                                    }
                                    else
                                    {
                                        item.published = item.published/1000;
                                        item.updated = item.published/1000;
                                    }
                                    if(!item.summary)
                                    {
                                        item.summary = { content : '' };
                                    }
                                    if(!item.canonical)
                                    {
                                        item.canonical = [ {href : item.originId} ];
                                    }
                                    if(item.tags)
                                    {
                                        item.tags.forEach(function(tag)
                                        {
                                            if(/global.must/.test(tag.id))
                                            {
                                                item.starred=true;
                                            }
                                            if(/global.saved/.test(tag.id))
                                            {
                                                item.liked=true;
                                            }
                                        });
                                    }
                                });
                                ok({ items:data, continuation: items.continuation});
                            }
                            else
                            {
                                reject();
                            }
                        });

                }
                else
                {
                    reject();
                }
            }, reject);
    });
};

Feedly.prototype.markRead= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var tag = encodeURIComponent('user/'+self.account.userid+'/tag/global.read');
        var url = self.host+'/v3/tags/'+tag+'/'+encodeURIComponent(item_id);

        var command = state ? 'PUT' : 'DELETE';
        var params = state ? { entryId : item_id } : null;
        self._query.bind(self)(command, url, params)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Feedly.prototype.markLike= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var tag = encodeURIComponent('user/'+self.account.userid+'/tag/global.saved');
        var url = self.host+'/v3/tags/'+tag+'/'+encodeURIComponent(item_id);

        var command = state ? 'PUT' : 'DELETE';
        var params = state ? { entryId : item_id } : null;
        self._query.bind(self)(command, url, params)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Feedly.prototype.markStar= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var tag = encodeURIComponent('user/'+self.account.userid+'/tag/global.must');
        var url = self.host+'/v3/tags/'+tag+'/'+encodeURIComponent(item_id);

        var command = state ? 'PUT' : 'DELETE';
        var params = state ? { entryId : item_id } : null;
        self._query.bind(self)(command, url, params)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Feedly.prototype.readAll= function(item_id)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/v3/markers';

        var data= { action : "markAsRead", categoryIds : [item_id], type: 'categories' };
        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

Feedly.prototype.addFeed= function(url)
{
    var self=this;
    var addurl = url;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/v3/subscriptions';
        var data = {  id : 'feed/'+addurl, categories:  [  ], title: addurl.replace(/.*\/\/([^\/]+).*/,'$1') };

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

Feedly.prototype.deleteFeed= function(item_id)
{
    var self=this;
    console.log('create deletefeed ',item_id, 'promise')
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/v3/subscriptions/:'+item_id;

        console.log('delete ',url);
        self._query.bind(self)("DELETE", url, null)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
};

