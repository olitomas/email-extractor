var Crawler = require('crawler');
var url = require('url');

var emailsFound = [];
var websiteUrl = process.argv[2];

var extractor = function(startUrl, callback, maxConnections) {
    var host = url.parse(startUrl).hostname;
    var crawler = new Crawler({
        maxConnections: maxConnections || 10,
        callback: function(err, result, $) {
            if (!err && result && result.headers && result.headers['content-type'].toLowerCase().indexOf("text/html") >= 0) {
                $("a").each(function(index, a) {
                    var toQueueUrl = $(a).attr('href');
                    if (toQueueUrl) {
                        var parsedUrl = url.parse(toQueueUrl);
                        if (parsedUrl.hostname === null || parsedUrl === host) {
                            toQueueUrl = url.resolve(startUrl, toQueueUrl);
                        }
                        crawler.queue(toQueueUrl);
                    }
                });

                var body = $("body").html();
                if (body) {
                    (body.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) || []).forEach(function(email) {
                        var isImage = false;
                        if(email){
                            var ending = email.substr(email.length - 4, email.length);
                            if(ending === '.png' || ending === 'jpg'){
                                isImage = true;
                            }
                        }
                        if (callback && !isImage) callback(result.options.uri, email);
                    });
                }
            }
        }
    });
    crawler.queue(startUrl);
    return crawler;
}

extractor(websiteUrl, function(uri, email) {
    var alreadyFound = (emailsFound.indexOf(email) > -1);

    if(!alreadyFound){
        emailsFound.push(email);
        console.log(email, uri);
    }
});
