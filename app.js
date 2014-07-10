var http = require('http');
var url = require('url');
var fs = require('fs');
var crypto = require('crypto');

var words;
// Set up wordlist
fs.readFile('words.txt', function(err, data) {
  words = data.toString().split(/\n/);
});

var getURL = function(key) {
  // Get url from datastore
  return "https://www.github.com";
}

var handle = function(req, res) {
  var path = url.parse(req.url).path;
  if (path === "/new") {
    // Get url from req params
    // Store url=> phrase in datastore
    res.write(createPhrase());
    res.end();
  }
  var redirect = getURL(path.slice(1, path.length));
  res.writeHead(302, {"Location": redirect});
  res.end();
}

var createPhrase = function() {
  // Pick a random combination of 4 words
  var picks = [];
  for (var i = 0; i < 4; i++) {
    picks.push(pickRandomWord());
  };
  var phrase = picks.join("-");
  // Hash it
  var shasum = crypto.createHash('sha1');
  shasum.update(phrase);
  var hash = shasum.digest('hex');
  // Check that hash is unique
  // ???
  return phrase;
}

var pickRandomWord = function() {
  var i = Math.round(Math.random()*words.length);
  return words[i];
}

var server = http.createServer(handle);
server.listen(8888);
console.log("Server listening on port 8888");