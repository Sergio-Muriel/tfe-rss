var TheOldReader = function()
{
    var self=this;
    this.username = null;
    this.password = null;
    this.token = null;

    this.host = 'https://theoldreader.com/';

    // Init XHR object
    this.xhr = new XMLHttpRequest({ mozSystem: true });

    // Init indexed DB
    var db_request = indexedDB.open('theoldreader');
    db_request.onsuccess = function (e) { self.db = e.target.result; };
    db_request.onerror = function (e) { console.log(e); };
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
        }
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

            var objectStore = self.db.createObjectStore('feeds', { keyPath: 'id', autoIncrement: true });

            var objectStore = self.db.createObjectStore('counts', { keyPath: 'id', autoIncrement: true });

            var objectStore = self.db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });

            var objectStore = self.db.createObjectStore('labels', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex("sortid", "sortid", { unique: false });
            objectStore.createIndex("id", "id", { unique: false });
        };
    });

};

// Methodes
TheOldReader.prototype.login = function(email, password)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
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
                    self.token = auth_token[1];
                    self.create_account(email,self.token)
                        .then(ok);
                }
                else if(r.status===0)
                {
                    alert(navigator.mozL10n.get('network_error'));
                    reject();
                }
                else
                {
                    alert(navigator.mozL10n.get('login_fail'));
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
        }
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
}

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
        }
        this.account=null;
    }
};

TheOldReader.prototype.isLoggedIn = function(callback)
{
    if(!this.account)
    {
        return false;
    }
    console.log('token ',this.account.token);
    return true;
};

TheOldReader.prototype._query = function(method,url,data,callback)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
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
                else if(r.status===0)
                {
                    alert(navigator.mozL10n.get('network_error'));
                    return reject(null);
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
}
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
            });
    });
}
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
            });
    });
}

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
}

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
}

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
        console.log('fetch ',url);

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
                    self._query.bind(self)("GET", url, null)
                        .then(function(text)
                        {
                            var data = JSON.parse(text);
                            if(data)
                            {
                                data.continuation = items.continuation;
                                ok(data);
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
}

TheOldReader.prototype.markRead= function(item_id, state)
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        var url = self.host+'/reader/api/0/edit-tag?output=json';

        var data='i='+item_id;
        data+= (state ? '&r=' : '&a=');
        data+= 'user/-/state/com.google/read';
        self._query.bind(self)("POST", url, data)
            .then(function(text)
            {
                ok(text);
            }, reject);
    });
}
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
}
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
}

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
}

