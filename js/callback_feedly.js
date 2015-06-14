var reCode = /code=([^&]+)/;
var reError = /error=([^&]+)/;

if(window.openerx)
{
    opener.feedly.callback(location.href);
    window.close();
}
else
{
    location.href='/index.html'+location.search;
}

