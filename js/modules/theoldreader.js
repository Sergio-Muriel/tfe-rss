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

    this.initDb();
};

TheOldReader.prototype.initDb = function()
{
    var self=this;
    console.log('call init db');

    var request = indexedDB.open('theoldreader_db',2);
    request.onsuccess = function (e) {
        self.db = e.target.result;
    }
    request.onerror = function (e) {
        console.log(e);
    };
    request.onupgradeneeded = function (e) {
        self.db = e.target.result;

        // Remove accounts
        if (self.db.objectStoreNames.contains("labels")) {
            self.db.deleteObjectStore("labels");
        }
        if (self.db.objectStoreNames.contains("accounts")) {
            self.db.deleteObjectStore("accounts");
        }
        // Remove feeds
        if (self.db.objectStoreNames.contains("feeds")) {
            self.db.deleteObjectStore("feeds");
        }

        var objectStore = self.db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
        var objectStore = self.db.createObjectStore('feeds', { keyPath: 'id', autoIncrement: true });
        var objectStore = self.db.createObjectStore('labels', { keyPath: 'id', autoIncrement: true });
    };

};

// Methodes
TheOldReader.prototype.login = function(email, password, callback)
{
    var self=this;
    var r = this.xhr;
    r.open("POST", this.host+"/accounts/ClientLogin", true);
    r.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    r.onreadystatechange = function () {
        if (r.readyState == 4)
        {
            var auth_token;
            if(r.status == 200 && (auth_token = r.responseText.match(/Auth=(.*)/)))
            {
                // Save token and call callbak
                self.token = auth_token[1];
                self.create_account(email,self.token);
                return callback(true);
            }
            else if(r.status===0)
            {
                alert('ici 1');
                alert(navigator.mozL10n.get('network_error'));
                return false;
            }
            else
            {
                alert(navigator.mozL10n.get('login_fail'));
                // Bad identification, return callback
                return false;
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
};

TheOldReader.prototype.create_account = function(email, token)
{
    console.log('adding new element');
    var transaction = this.db.transaction([ 'accounts' ], 'readwrite');
    //Create the Object to be saved i.e. our Note
    var value = {};
    value.email = email;
    value.token = token;

    var accounts = transaction.objectStore('accounts');
    var request = accounts.add(value);
    request.onsuccess = function (e) {
    };
    request.onerror = function (e) {
    }
};

TheOldReader.prototype.getAccount = function(callback)
{
    var account = null;
    var self=this;

    // If database not init already
    if(!this.db)
    {
        return window.setTimeout(function() { self.getAccount(callback) }, 100);
    }

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
        var r = self.xhr;
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


TheOldReader.prototype.clearFeeds = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        console.log('clearing feeds');
        var transaction = self.db.transaction([ 'feeds' ], 'readwrite');
        var feeds = transaction.objectStore('feeds');

        var request = feeds.clear();
        request.onsuccess = function()
        {
            ok();
        };
        request.onerror = function()
        {
            reject();
        };
    });
};
TheOldReader.prototype.clearLabels = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        console.log('clearing labels');
        var transaction = self.db.transaction([ 'labels' ], 'readwrite');
        var feeds = transaction.objectStore('labels');

        var request = feeds.clear();
        request.onsuccess = function()
        {
            ok();
        };
        request.onerror = function()
        {
            reject();
        };
    });
};

TheOldReader.prototype.updateSubscriptionList = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        console.log('Fetching subscription list');
        var url = self.host+'/reader/api/0/subscription/list?output=json';
        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    var prom = self.clearFeeds();

                    Array.forEach(data.subscriptions, function(subscription)
                    {
                        prom=prom.then(self.addSubscription(subscription));
                    });
                    prom.then(ok, reject);
                }
                else
                {
                    reject();
                }   
            }, reject);
    });
}
TheOldReader.prototype.addSubscription = function(data)
{
    var self=this;
    return function()
    {
        return new Promise(function(ok, reject)
        {
            var transaction_feeds = self.db.transaction([ 'feeds' ], 'readwrite');
            //Create the Object to be saved i.e. our Note

            var feeds = transaction_feeds.objectStore('feeds');
            var request = feeds.add(data);
            request.onsuccess = function (e) {
                ok();
            };
            request.onerror = function (e) {
                reject();
            }
        });
    };
};

TheOldReader.prototype.updateLabelsList = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        console.log('Fetching labels list');
        var url = self.host+'/reader/api/0/tag/list?output=json';
        self._query.bind(self)("GET", url, null)
            .then(function(text)
            {
                var data = JSON.parse(text);
                if(data)
                {
                    var prom = self.clearLabels();

                    Array.forEach(data.tags, function(tag)
                    {
                        prom=prom.then(self.addLabel(tag), reject);
                    });
                    prom.then(ok, reject);
                }
                else
                {
                    reject();
                }
            });
    });
}
TheOldReader.prototype.addLabel = function(data)
{
    var self=this;
    return function()
    {
        return new Promise(function(ok, reject)
        {
            var transaction_labels = self.db.transaction([ 'labels' ], 'readwrite');
            //Create the Object to be saved i.e. our Note

            var labels = transaction_labels.objectStore('labels');
            var request = labels.add(data);
            request.onsuccess = function (e) {
                ok();
            };
            request.onerror = function (e) {
                reject();
            }
        });
    };
};

TheOldReader.prototype.fullupdate = function()
{
    var self=this;
    return new Promise(function(ok, reject)
    {
        self.updateSubscriptionList()
            .then(function()
                    {
                        console.log('done feeds');
                    })
            .then(self.updateLabelsList.bind(self))
            .then(function()
                    {
                        console.log('done labels');
                    });
    });
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
