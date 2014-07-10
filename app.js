var http = require('http');
var url = require('url');
var fs = require('fs');
var redis = require('redis');
var client = redis.createClient();

// Set up wordlist
var words;
fs.readFile('words.txt', function(err, data) {
  words = data.toString().split(/\n/);
});

var handle = function(req, res) {
  var url_obj = url.parse(req.url);
  var path = url_obj.pathname;
  if (path === "/new") {
    handleNew(req, res);
    return;
  }
  handleRedirect(req, res);
};

var handleRedirect = function(req, res) {
  var path = url.parse(req.url).pathname;
  var phrase = path.slice(1, path.length);
  client.get(phrase, function(err, redirect) {
    res.writeHead(302, {"Location": redirect});
    res.end();
  });
};

var handleNew = function(req, res) {
  var qry = url.parse(req.url).query;
  if (qry === undefined) {
    res.end();
    return;
  }
  var orig_url = qry.match(/url=(.+)/);
  if (orig_url === null) {
    res.end();
    return;
  }
  orig_url = orig_url[1];
  (function storeURL() {
    var phrase = createPhrase();
    client.exists(phrase, function(err,exists) {
      if (exists === 0) {
        client.set(phrase, orig_url);
        res.end(phrase);
      }
      else {
        storeURL();
      }
    });
  })();
};

var createPhrase = function() {
  // Pick a random combination of 4 words
  var picks = [];
  for (var i = 0; i < 4; i++) {
    picks.push(pickRandomWord());
  }
  var phrase = picks.join("-");
  return phrase;
};

var pickRandomWord = function() {
  var i = Math.round(Math.random()*words.length);
  return words[i];
};

var server = http.createServer(handle);
server.listen(8888);
console.log("Server listening on port 8888");
