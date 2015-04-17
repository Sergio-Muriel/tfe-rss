var TheOldReader = function()
{
    var self=this;
    this.username = null;
    this.password = null;
    this.token = null;

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
        if (self.db.objectStoreNames.contains("accounts")) {
            self.db.deleteObjectStore("accounts");
        }
        // Remove feeds
        if (self.db.objectStoreNames.contains("feeds")) {
            self.db.deleteObjectStore("feeds");
        }

        var objectStore = self.db.createObjectStore('accounts', { keyPath: 'id', autoIncrement: true });
        var objectStore = self.db.createObjectStore('feeds', { keyPath: 'id', autoIncrement: true });
        console.log("Object Store has been created");
    };

};

// Methodes
TheOldReader.prototype.login = function(email, password, callback)
{
    var self=this;
    var r = this.xhr;
    r.open("POST", "https://theoldreader.com/accounts/ClientLogin", true);
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
            else
            {
                console.log('callback ',callback);
                alert(navigator.mozL10n.get('account_created'));
                // Bad identification, return callback
                return callback(false);
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
        alert(navigator.mozL10n.get('account_created'));
    };
    request.onerror = function (e) {
        alert("Error in saving the note. Reason : " + e.value);
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
    console.log('token ',this.token);
    return true;
};
