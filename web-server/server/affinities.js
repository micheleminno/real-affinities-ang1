var Twit = require('twit');
var fs = require('fs');
var async = require('async');

var db = require('./db');

var OK = 200;
var NOK = 404;

exports.interesting = function(req, res) {

	var offset = req.query.offset;
	var amount = req.query.amount;

	db.select('id').
		from('affinity')
		.orderByRaw('followed_by DESC, follows DESC')
		.limit(amount).offset(offset)
		.then(function(rows) {

				var ids = [];
				for ( var rowIndex in rows) {

					ids.push(rows[rowIndex]["id"]);
				}

				res.status(OK).json('interesting', {
					interestingIds : ids
				});
		});
};

var userAccounts = process.env.accounts;

var relationTypes = [ 'followers', 'friends' ];
var result = {};

function getTwitter(userIndex) {

	return new Twit({
		consumer_key : userAccounts[userIndex]["consumer"],
		consumer_secret : userAccounts[userIndex]["consumerSecret"],
		access_token : userAccounts[userIndex]["token"],
		access_token_secret : userAccounts[userIndex]["tokenSecret"],
	});
}

function updateAffinityValues(ids, relationType, add, callback) {

	var followsIncrement = 0;
	var followedByIncrement = 0;
	var initialFollowsValue = 0;
	var initialFollowedByValue = 0;

	if (add) {

		if (relationType === "followers") {

			initialFollowsValue++;
			followsIncrement++;

		} else if (relationType === "friends") {

			initialFollowedByValue++;
			followedByIncrement++;
		}
	} else { // remove, initial values are 0

		if (relationType === "followers") {

			followsIncrement--;

		} else if (relationType === "friends") {

			followedByIncrement--;
		}
	}

	console.log(ids.length + " ids to update with relation type "
			+ relationType);

	async.each(ids, function(id, done) {

		var query = "INSERT INTO affinity VALUES (" + id + ", "
				+ initialFollowsValue + ", " + initialFollowedByValue
				+ ") ON DUPLICATE KEY UPDATE " + "follows = follows + "
				+ followsIncrement + ", followed_by = followed_by + "
				+ followedByIncrement;

		db.raw(query).then(function(response) {

			done(null);
		});
	}, function(err) {

		if (err) {

			console.log('A query failed to be executed');

		} else {

			callback();
		}
	});
}

function sendResult(userId, nextPage, cursor, relationType, callback) {

	var lastRetrievedPage = nextPage - 1;
	console.log("Last retrieved page: " + lastRetrievedPage);

	result[relationType]["page"] = lastRetrievedPage;
	result[relationType]["cursor"] = cursor;

	// If both loaded
	if (Object.keys(result["followers"]).length > 0
			&& Object.keys(result["friends"]).length > 0) {

		console.log("\nAll results fetched for user " + userId);
		callback(result);
	}
}

function updateAffinities(userId, nextPage, lastPageToFetch, cursor,
		credentialsIndex, relationType, add, callback) {

	if (nextPage <= lastPageToFetch && cursor !== 0) {

		var twitter = getTwitter(credentialsIndex);
		twitter
				.get(
						'application/rate_limit_status',
						{
							resources : relationType
						},
						function(err, data, response) {

							var results = data.resources[relationType]['/'
									+ relationType + '/ids'];
							var remainingCalls = results['remaining'];
							var resetDate = results['reset'];

							if (remainingCalls > 0) {

								twitter
										.get(
												relationType + '/ids',
												{
													user_id : userId,
													cursor : cursor
												},
												function(err, data, response) {

													if (err) {

														console
																.log("Error: "
																		+ JSON
																				.stringify(err));

														if(err.code === 34) {

														    //User id doesn't exist
														    console.log("User with id " + userId + " doesn't exist");
														    var result = {"userId": null};
														    callback(result);
														}
														else {
    														console
    																.log("Affinities not updated for user: "
    																		+ userId
    																		+ ", page: "
    																		+ nextPage);

    														return updateAffinities(
    																userId,
    																nextPage,
    																lastPageToFetch,
    																cursor,
    																credentialsIndex,
    																relationType,
    																add,
    																callback);
    												   }
													} else {

														cursor = data.next_cursor;

														updateAffinityValues(
																data.ids,
																relationType,
																add,
																function() {

																	console
																			.log("\nAffinities updated for user: "
																					+ userId
																					+ ", page: "
																					+ nextPage);

																	console
																			.log('Page n. '
																					+ nextPage
																					+ ' - '
																					+ nextPage
																					* 5000
																					+ ' '
																					+ relationType
																					+ ' ids of user '
																					+ userId
																					+ ' retrieved');

																	return updateAffinities(
																			userId,
																			++nextPage,
																			lastPageToFetch,
																			cursor,
																			credentialsIndex,
																			relationType,
																			add,
																			callback);
																});
													}
												});
							} else {

								console
										.log('\nRate limits reached for call /'
												+ relationType
												+ '/ids and credentials of '
												+ userAccounts[credentialsIndex]["screenName"]);
								var now = new Date();
								var millisecs = now.getTime();
								var lapseOfSeconds = resetDate
										- Math.floor(millisecs / 1000);
								console
										.log('These credentials will be available again for '
												+ relationType
												+ ' in '
												+ lapseOfSeconds + ' seconds');
								credentialsIndex++;
								if (credentialsIndex < userAccounts.length) {

									return updateAffinities(userId, nextPage,
											lastPageToFetch, cursor,
											credentialsIndex, relationType,
											add, callback);
								} else {

									console
											.log("\nAll credentials exploited for relation type "
													+ relationType);
									sendResult(userId, nextPage, cursor,
											relationType, callback);
								}
							}
						});

	} else {

		console.log("\nAll requested data fetched for relation type "
				+ relationType + " and user " + userId);

		sendResult(userId, nextPage, cursor, relationType, callback);
	}
}



exports.add = function(userId, callback) {

	result = {
		"userId" : userId,
		"followers" : {},
		"friends" : {}
	};

	relationTypes.forEach(function(relationType) {

		updateAffinities(userId, 1, 15, -1, 0, relationType, true,
				callback);
	});
};

exports.remove = function(userId, callback) {

	result = {
		"userId" : userId,
		"followers" : {},
		"friends" : {}
	};

	db.from('users')
		.where('id', userId)
		.then(function(rows) {

			if (rows.length > 0) {

				var followersPagesAmount = rows[0]["last_followers_page"];
				var friendsPagesAmount = rows[0]["last_friends_page"];

				var fetchLimits = {
					"followers" : followersPagesAmount,
					"friends" : friendsPagesAmount
				};

				relationTypes.forEach(function(relationType) {

					updateAffinities(userId, 1, fetchLimits[relationType], -1,
							0, relationType, false, callback);
				});

			} else {
				// User doesn't exist, nothing to do
			}
	});
};
