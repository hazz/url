var http = require('http');
var url = require('url');
var fs = require('fs');
var redis = require('redis');
var client = redis.createClient();

var ROOT = "http://localhost:8888/";

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
  if (path === "/") {
    handlePage(req, res, "index.html");
    return;
  }
  if (path === "/favicon.ico") {
    res.end();
    return;
  }
  handleRedirect(req, res);
};

var handlePage = function(req, res, filename) {
  console.log("PAGE "+filename);
  fs.readFile(filename, function(err, data) {
    res.end(data);
  });
};

var handleRedirect = function(req, res) {
  var path = url.parse(req.url).pathname;
  var phrase = path.slice(1, path.length);
  client.get(phrase, function(err, redirect) {
    console.log("REDIRECT "+phrase+" --> "+redirect);
    res.writeHead(302, {"Location": redirect});
    res.end();
  });
};

var handleNew = function(req, res) {
  var qry = decodeURIComponent(url.parse(req.url).query);
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
  url_obj = url.parse(orig_url);
  if (url_obj.protocol === undefined) {
    orig_url = "http://"+url_obj.href;
  }
  // Check if URL is already stored
  client.exists(orig_url, function(err, exists) {
    if (exists === 1) {
      console.log("DUPE: "+orig_url);
      client.get(orig_url, function(err, phrase) {
        res.end(ROOT+phrase);
      });
      return;
    }
    console.log("NEW: "+orig_url);
    (function storeURL() {
      var phrase = createPhrase();
      client.exists(phrase, function(err,exists) {
        if (exists === 0) {
          client.set(phrase, orig_url);
          client.set(orig_url, phrase);
          res.end(ROOT+phrase);
        }
        else {
          storeURL();
        }
      });
    })();
  });
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
