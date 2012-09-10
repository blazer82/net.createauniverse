
function log(text, important)
{
    if (debug)
    {
        console.log(text);
    }

    var $log = $('#log .content');
    var log  = $('#log .content')[0];

    if (important)
    {
        text = '<strong>'+text+'</strong>';
    }

    $log.append('<p>&gt;&nbsp;'+text+'</p>');

    $log.scrollTop(log.scrollHeight);
}

function clearLog()
{
    var $log = $('#log .content');
    var log  = $('#log .content')[0];

    $log.html('');
    $log.scrollTop(log.scrollHeight);
}