var express = require('express');
var connection = require('express-myconnection');
var mysql = require('mysql');

var config = require('./config.js');
var target = require('./target.js');
var affinities = require('./affinities.js');
var twitter = require('./twitter.js');
var utilities = require('./utilities.js');


app = express();

var allowCrossDomain = function(req, res, next) {

	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods',
			'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers',
			'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);

	next();
};

app.use(allowCrossDomain);

var connectionConfig = {

	host : config.mysql.host,
	user : config.mysql.user,
	password : config.mysql.password,
	database : config.mysql.database
};

var connection = connection(mysql, connectionConfig, 'request');

app.use(connection);

app.get('/', function(req, res) {
	res.send('Welcome');
});

app.get('/target', target.list);
app.get('/target/add', target.add);
app.get('/target/remove', target.remove);
app.get('/target/delete', target.removeAll);
app.get('/target/contains', target.contains);

app.get('/affinities/interesting', affinities.interesting);

app.get('/twitter/search/users', twitter.searchUsers);
app.get('/twitter/search/tweets', twitter.searchTweets);
app.get('/twitter/tweets', twitter.userTweets);
app.get('/twitter/users', twitter.users);

app.get('/utilities/url-exists', utilities.checkUrl);

var server = app.listen(config.app.port, function() {

	console.log("Listening to port %s", server.address().port);

});
