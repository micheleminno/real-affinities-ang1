var Twit = require('twit');
var fs = require("fs");
var bigInt = require("big-integer");
var natural = require('natural'), TfIdf = natural.TfIdf, tfidf;

var OK = 200;
var ERROR = 400;
var TOO_MANY_REQUESTS = 429;

var userAccounts = JSON.parse(fs
		.readFileSync("./twitter-accounts.json", "utf8"));

function getTwitter(userIndex) {

	return new Twit({
		consumer_key : userAccounts[userIndex]["consumer"],
		consumer_secret : userAccounts[userIndex]["consumerSecret"],
		access_token : userAccounts[userIndex]["token"],
		access_token_secret : userAccounts[userIndex]["tokenSecret"],
	});
}

function getSortedKeys(obj) {

	var keys = [];
	for ( var key in obj) {

		keys.push(key);
	}
	return keys.sort(function(a, b) {
		return obj[b] - obj[a];
	});
};

function sendResponse(wordOccurrences, response) {

	var sortedItems = getSortedKeys(wordOccurrences);
	var text = '';
	for (sortedItemIndex in sortedItems) {

		if (sortedItemIndex < 200) {
			text += sortedItems[sortedItemIndex] + ' ';
		} else {
			break;
		}
	}
	
	text = text.substring(0, text.length - 1);

	console.log("\nResult: " + text);
	response.status(OK).json('data', {value: text});
};

function isStopword(word, lang) {

	var stopwords = JSON.parse(fs.readFileSync("./stopwords.json", "utf8"));
	if (stopwords[lang]) {
		return stopwords[lang].indexOf(word) > -1;
	}

	return false;
};

function callTweetSearch(method, options, credentialIndex, response, docIndex,
		wordOccurrences, tweetAmount) {

	console.log("call " + method + " with options " + JSON.stringify(options)
			+ ", credentials index =  " + credentialIndex + " and doc index "
			+ docIndex);

	var twitter = getTwitter(credentialIndex);
	twitter
			.get(
					method,
					options,
					function(err, data, twitterResponse) {

						var credentialsUser = userAccounts[credentialIndex]["screenName"];
						if (err) {

							if (err.code == 88) {
								console.log("Rate limits exceeded for call "
										+ method + " and credentials of "
										+ credentialsUser);
								credentialIndex++;
								if (userAccounts.length > credentialIndex) {

									credentialsUser = userAccounts[credentialIndex]["screenName"];
									console.log("Trying with credentials of "
											+ credentialsUser);

									callTweetSearch(method, options,
											credentialIndex, response,
											docIndex, wordOccurrences, tweetAmount);

								} else {
									console.log("All credentials used");
									response.status(TOO_MANY_REQUESTS);
								}
							} else {
								response.status(ERROR);
							}
						} else {

							console.log("Call " + method
									+ " done with credentials of "
									+ credentialsUser);

							var tweetsInfo = [];

							var tweets = data.statuses;

							if (tweets.length == 0) {

								sendResponse(wordOccurrences, response);

							} else {

								var minId = bigInt(tweets[0].id_str);

								console.log(tweets[0].created_at);
								
								for (tweetIndex in tweets) {

									var createdAt = tweets[tweetIndex].created_at;
									var stringId = tweets[tweetIndex].id_str;

									var id = bigInt(stringId);
									if (id.compareTo(minId) < 0) {
										minId = id;
									}

									var text = tweets[tweetIndex].text;

									console.log("Tweet text: " + text);
									
									tweetsInfo.push({
										id : stringId,
										date : createdAt,
										text : text
									});

									tfidf.addDocument(text);
									var currentDocIndex = parseInt(docIndex)
											+ parseInt(tweetIndex);
									tfidf
											.listTerms(currentDocIndex)
											.forEach(

													function(item) {

														if (!isStopword(
																item.term,
																options.lang)) {
															if (wordOccurrences[item.term]) {
																wordOccurrences[item.term] = wordOccurrences[item.term]
																		+ item.tfidf;
															} else {
																wordOccurrences[item.term] = item.tfidf;
															}
														}
													});
								}

								var amount = tweetsInfo.length;

								newDocIndex = docIndex + amount;

								var nextMaxId = minId.prev();
								options.max_id = nextMaxId.toString();

								if (newDocIndex < tweetAmount) {

									callTweetSearch(method, options,
											credentialIndex, response,
											newDocIndex, wordOccurrences, tweetAmount);
								} else {
									sendResponse(wordOccurrences, response);
								}
							}
						}
					});
}

exports.searchTweets = function(req, res) {

	var q = req.query.q;
	var lang = req.query.lang;
	var tweetAmount = req.query.amount;

	console.log("Searching up to " + tweetAmount + " tweets");
	
	var method = 'search/tweets';
	var options = {
		q : q,
		count : 100,
		lang : lang
	};

	tfidf = new TfIdf();
	callTweetSearch(method, options, 0, res, 0, {}, tweetAmount);
};

function call(method, options, credentialIndex, response) {

	console.log("call " + method + " with credentials index =  "
			+ credentialIndex);

	var twitter = getTwitter(credentialIndex);
	twitter
			.get(
					method,
					options,
					function(err, data, twitterResponse) {

						console.log(JSON.stringify(options));

						var credentialsUser = userAccounts[credentialIndex]["screenName"];
						if (err) {

							if (err.code == 88) {
								console.log("Rate limits exceeded for call "
										+ method + " and credentials of "
										+ credentialsUser);
								credentialIndex++;
								if (userAccounts.length > credentialIndex) {

									credentialsUser = userAccounts[credentialIndex]["screenName"];
									console.log("Trying with credentials of "
											+ credentialsUser);
									call(method, options, credentialIndex,
											response);

								} else {
									console.log("All credentials used");
									response.status(TOO_MANY_REQUESTS);
								}
							} else {

								console.log(JSON.stringify(err));
								response.status(ERROR).json('data', []);
							}
						} else {

							console.log("Call " + method
									+ " done with credentials of "
									+ credentialsUser);

							response.status(OK).json('data', data);
						}
					});
}

exports.searchUsers = function(req, res) {

	var q = req.query.q;
	var page = req.query.page;
	var count = req.query.count;

	var method = 'users/search';
	var options = {
		q : q,
		count : count,
		page : page
	};

	call(method, options, 0, res);
};

exports.userTweets = function(req, res) {

	var user = req.query.user;

	var method = 'statuses/user_timeline';
	var options = {
		screen_name : user,
		count: 100
	};

	call(method, options, 0, res);
};

exports.users = function(req, res) {

	var ids = req.query.ids;

	var method = 'users/lookup';
	var options = {
		user_id : ids
	};

	call(method, options, 0, res);
};
