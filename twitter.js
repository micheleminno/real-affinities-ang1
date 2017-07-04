var Twit = require('twit');
var fs = require("fs");
var bigInt = require("big-integer");

var natural = require('natural');
var TfIdf = natural.TfIdf, tfidf;
var NGrams = natural.NGrams;

var OK = 200;
var ERROR = 400;
var TOO_MANY_REQUESTS = 429;

var HASHTAGS_REGEXP = /(?:^|\W)#(\w+)(?!\w)/g;
var MENTIONS_REGEXP = /(?:^|\W)@(\w+)(?!\w)/g;
var URLS_REGEXP = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
var NUMBERS_REGEXP = /\b(\d+)\b/g;

var HASHTAGS = 'HASHTAGS';
var MENTIONS = 'MENTIONS';
var URLS = 'URLS';
var RETWEETS = 'RETWEETS';
var UNIGRAMS = 'UNIGRAMS';
var BIGRAMS = 'BIGRAMS';
var TRIGRAMS = 'TRIGRAMS';

var HASHTAGS_AMOUNT = 20;
var MENTIONS_AMOUNT = 10;
var URLS_AMOUNT = 3;
var RETWEETS_AMOUNT = 3;
var UNIGRAMS_AMOUNT = 100;
var BIGRAMS_AMOUNT = 20;
var TRIGRAMS_AMOUNT = 20;

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

function sendResponse(resultBox, response) {

	console.log("\n\n*******" + HASHTAGS + "*******\n");
	var hashtagsText = getText(resultBox[HASHTAGS], HASHTAGS_AMOUNT);

	console.log("\n\n*******" + MENTIONS + "*******\n");
	var mentionsText = getText(resultBox[MENTIONS], MENTIONS_AMOUNT);

	console.log("\n\n*******" + RETWEETS + "*******\n");
	var retweetsText = getText(resultBox[RETWEETS], RETWEETS_AMOUNT);

	console.log("\n\n*******" + URLS + "*******\n");
	var urlsText = getText(resultBox[URLS], URLS_AMOUNT);

	console.log("\n\n*******" + UNIGRAMS + "*******\n");
	var unigramsText = getText(resultBox[UNIGRAMS], UNIGRAMS_AMOUNT);

	console.log("\n\n*******" + BIGRAMS + "*******\n");
	var bigramsText = getText(resultBox[BIGRAMS], BIGRAMS_AMOUNT);

	console.log("\n\n*******" + TRIGRAMS + "*******\n");
	var trigramsText = getText(resultBox[TRIGRAMS], TRIGRAMS_AMOUNT);

	var text = hashtagsText + " " + mentionsText + " " + retweetsText + " "
			+ urlsText + " " + unigramsText + " " + bigramsText + " "
			+ trigramsText;

	console.log("\nResult: " + text);

	response.status(OK).json('data', {
		value : text
	});
};

function getText(occurrences, amount) {

	var sortedItems = getSortedKeys(occurrences);
	var text = '';
	for (sortedItemIndex in sortedItems) {

		if (sortedItemIndex < amount) {

			text += sortedItems[sortedItemIndex] + ' ';
			console.log(sortedItems[sortedItemIndex]);

		} else {
			break;
		}
	}

	text = text.substring(0, text.length - 1);

	return text;
};

function isStopword(word, lang) {

	var stopwords = JSON.parse(fs.readFileSync("./stopwords.json", "utf8"));
	if (stopwords[lang]) {
		return stopwords[lang].indexOf(word) > -1;
	}

	return false;
};

function getEntities(text, label) {

	var match, matches = [];

	if (label === RETWEETS) {

		if (text.indexOf('RT') === 0) {

			var user = text.substring(3, text.indexOf(':'));
			if (user.indexOf('@') === 0) {
				user = user.substring(1);
			}

			matches.push(user);
		}
	} else {

		var regExp = eval(label + "_REGEXP");
		while (match = regExp.exec(text)) {
			matches.push(match[1]);
		}
	}

	return matches;
}

function updateEntities(newElements, resultBox, text, label) {

	// console.log(label + ": " + newElements);

	newElements.forEach(

	function(item) {

		if (resultBox[label][item]) {

			resultBox[label][item]++;

		} else {

			resultBox[label][item] = 1;
		}

		text = text.replace(new RegExp(item, "g"), '');
	});

	return text;
}

function updateUnigrams(tfidf, language, docIndex, resultBox) {

	tfidf
			.listTerms(docIndex)
			.forEach(

					function(item) {

						if (!isStopword(item.term, language)) {

							if (resultBox[UNIGRAMS][item.term]) {

								resultBox[UNIGRAMS][item.term] = resultBox[UNIGRAMS][item.term]
										+ item.tfidf;
							} else {

								resultBox[UNIGRAMS][item.term] = item.tfidf;
							}
						}
					});
}

function getNGrams(text, label) {

	var result = [];

	if (label === BIGRAMS) {

		result = NGrams.bigrams(text);
	} else if (label === TRIGRAMS) {

		result = NGrams.trigrams(text);
	}

	return result;
}

function updateResults(tfidf, language, docIndex, text, resultBox) {

	console.log("\nTweet: " + text);

	text = updateEntities(getEntities(text, HASHTAGS), resultBox, text,
			HASHTAGS);

	text = updateEntities(getEntities(text, RETWEETS), resultBox, text,
			RETWEETS);

	text = updateEntities(getEntities(text, MENTIONS), resultBox, text,
			MENTIONS);

	text = updateEntities(getEntities(text, URLS), resultBox, text, URLS);

	if (resultBox[RETWEETS].length == 1) {

		if (resultBox[MENTIONS].length > 0) {

			resultBox[MENTIONS].shift();
		}
	}

	text = text.replace(NUMBERS_REGEXP, '');

	tfidf.addDocument(text);

	updateUnigrams(tfidf, language, docIndex, resultBox);
	//updateEntities(getNGrams(text, BIGRAMS), resultBox, text, BIGRAMS);
	//updateEntities(getNGrams(text, TRIGRAMS), resultBox, text, TRIGRAMS);
}

function callTweetSearch(method, options, credentialIndex, response, docIndex,
		resultBox, tweetAmount) {

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
											docIndex, resultBox, tweetAmount);

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

								sendResponse(resultBox, response);

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

									tweetsInfo.push({
										id : stringId,
										date : createdAt,
										text : text
									});

									var currentDocIndex = parseInt(docIndex)
											+ parseInt(tweetIndex);

									updateResults(tfidf, options.lang,
											currentDocIndex, text, resultBox);
								}

								var amount = tweetsInfo.length;

								newDocIndex = docIndex + amount;

								var nextMaxId = minId.prev();
								options.max_id = nextMaxId.toString();

								if (newDocIndex < tweetAmount) {

									callTweetSearch(method, options,
											credentialIndex, response,
											newDocIndex, resultBox, tweetAmount);
								} else {

									sendResponse(resultBox, response);
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
	var emptyResultBox = {

		HASHTAGS : [],
		RETWEETS : [],
		MENTIONS : [],
		URLS : [],
		UNIGRAMS : [],
		BIGRAMS : [],
		TRIGRAMS : []
	};

	callTweetSearch(method, options, 0, res, 0, emptyResultBox, tweetAmount);
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
		count : 100
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
