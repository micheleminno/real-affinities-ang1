app.service('TwitterService', function($q, $rootScope, $http, $route) {

	var authorizationResult = false;
	var publicKey = 'RoQr3fNKjAtO2ALl30PdIC_r21g';

	this.initialize = function() {

		OAuth.initialize(publicKey, {
			cache : true
		});
		authorizationResult = OAuth.create('twitter');
	};

	this.isReady = function() {

		return (authorizationResult);
	};

	this.connectTwitter = function($scope) {

		var deferred = $q.defer();
		// cache means to execute the callback if the tokens
		// are already present
		OAuth.popup('twitter', {
			cache : true
		}, function(error, result) {
			if (!error) {
				authorizationResult = result;
				$route.reload();
			}
		});
		return deferred.promise;
	};

	this.getScreenName = function() {
		var deferred = $q.defer();
		// cache means to execute the callback if the tokens
		// are already present
		OAuth.popup('twitter', {
			cache : true
		}, function(error, result) {
			if (!error) {
				authorizationResult = result;
				authorizationResult.me().done(function(user_info) {
					deferred.resolve(user_info);
				}).fail(function(error) {

				});
			}
		});

		return deferred.promise;
	};

	this.clearCache = function() {

		OAuth.clearCache('twitter');
		authorizationResult = false;
	};

	this.getLatestTweets = function(screenName, index) {

		var deferred = $q.defer();

		var promise = authorizationResult
				.get('1.1/statuses/user_timeline.json?screen_name='
						+ screenName);

		promise.done(function(data) {
			// https://dev.twitter.com/docs/api/1.1/get/statuses/user_timeline
			deferred.resolve([ data, index ]);
		});

		return deferred.promise;
	};

	this.lookupUsers = function(ids) {

		var deferred = $q.defer();

		var idsParam = ids.join();
		var promise = authorizationResult.get('1.1/users/lookup.json?user_id='
				+ idsParam);

		promise.done(function(data) {

			deferred.resolve(data);
		});

		return deferred.promise;
	};

	this.getFollowing = function(screenName, cursor) {

		var deferred = $q.defer();

		// https://api.twitter.com/1.1/friends/list.json
		var promise = authorizationResult
				.get('1.1/friends/list.json?screen_name=' + screenName
						+ "&cursor=" + cursor);

		promise.done(function(data) {

			deferred.resolve(data);
		});

		return deferred.promise;
	};

	this.searchUsers = function(userQuery, page) {

		var deferred = $q.defer();
		// https:api.twitter.com/1.1/users/search.json

		var promise = authorizationResult.get('1.1/users/search.json?q='
				+ userQuery + '&page=' + page);

		promise.done(function(data) {

			deferred.resolve(data);
		});

		return deferred.promise;
	};

	this.getFollowingIds = function(screenName) {

		var deferred = $q.defer();
		// https://api.twitter.com/1.1/friends/ids.json
		var promise = authorizationResult
				.get('1.1/friends/ids.json?screen_name=' + screenName);

		promise.done(function(data) {

			deferred.resolve(data);
		});

		return deferred.promise;
	};

	this.getListMembers = function(screenName, listName) {

		var deferred = $q.defer();
		if (screenName && listName) {

			OAuth.popup('twitter', {
				cache : true
			}, function(error, result) {
				if (!error) {
					authorizationResult = result;
					var promise = authorizationResult
							.get('1.1/lists/members.json?slug=' + listName
									+ '&owner_screen_name=' + screenName);

					promise.done(function(data) {
						deferred.resolve(data);
					}).fail(function(error) {
						if (error.status == '404') {

							var data = {};
							data.users = [];
							deferred.resolve(data);
						}
					});
				}
			});
		}

		return deferred.promise;
	};

	this.getLists = function(screenName) {

		var deferred = $q.defer();
		if (screenName) {
			OAuth.popup('twitter', {
				cache : true
			}, function(error, result) {
				if (!error) {
					authorizationResult = result;
					var promise = authorizationResult
							.get('1.1/lists/ownerships.json?screen_name='
									+ screenName);

					promise.done(function(data) {
						deferred.resolve(data);
					});

				} else {
					console.log('error during getLists');
				}
			});
		}

		return deferred.promise;
	};

	this.addMemberToList = function(ownerScreenName, listName, accountToAdd) {

		var deferred = $q.defer();
		if (ownerScreenName && listName && accountToAdd) {
			OAuth.popup('twitter', {
				cache : true
			}, function(error, result) {
				if (!error) {
					authorizationResult = result;
					var promise = authorizationResult.post(
							'1.1/lists/members/create.json', {
								data : {
									slug : listName,
									owner_screen_name : ownerScreenName,
									screen_name : accountToAdd
								}
							});

					promise.done(function(response) {
						deferred.resolve();
					}).fail(function(error) {
						deferred.resolve(error.status);
					});
				}
			});
		}

		return deferred.promise;
	};

	this.removeMemberFromList = function(ownerScreenName, listName,
			accountToRemove) {

		var deferred = $q.defer();
		if (ownerScreenName && listName && accountToRemove) {
			OAuth.popup('twitter', {
				cache : true
			}, function(error, result) {
				if (!error) {
					authorizationResult = result;
					var promise = authorizationResult.post(
							'1.1/lists/members/destroy.json', {
								data : {
									slug : listName,
									owner_screen_name : ownerScreenName,
									screen_name : accountToRemove
								}
							});

					promise.done(function(response) {
						deferred.resolve();
					}).fail(function(error) {

					});

				} else {

				}
			});
		}

		return deferred.promise;
	};

	this.createList = function(list) {

		var deferred = $q.defer();
		if (list) {

			var promise = authorizationResult.post('1.1/lists/create.json', {
				data : {
					name : list
				}
			});

			promise.done(function(response) {
				deferred.resolve(response);
			}).fail(function(error) {
				deferred.resolve(error);
			});

		}

		return deferred.promise;
	};

	this.removeList = function(listId) {

		var deferred = $q.defer();
		OAuth.popup('twitter', {
			cache : true
		}, function(error, result) {
			if (!error) {
				authorizationResult = result;
				var promise = authorizationResult.post(
						'1.1/lists/destroy.json', {
							data : {
								list_id : listId,
							}
						});

				promise.done(function(response) {
					// alert("list " + list + " removed!");
					deferred.resolve();
				}).fail(function(error) {

				});

			} else {

			}
		});

		return deferred.promise;
	};

	this.follow = function(accountToFollow) {

		var deferred = $q.defer();
		if (accountToFollow) {
			OAuth.popup('twitter', {
				cache : true
			}, function(error, result) {
				if (!error) {
					authorizationResult = result;
					var promise = authorizationResult.post(
							'1.1/friendships/create.json', {
								data : {
									screen_name : accountToFollow
								}
							});

					promise.done(function(response) {
						deferred.resolve();
					}).fail(function(error) {

					});

				} else {

				}
			});
		}

		return deferred.promise;
	};

	this.unfollow = function(accountToUnfollow) {

		var deferred = $q.defer();
		if (accountToUnfollow) {
			OAuth.popup('twitter', {
				cache : true
			}, function(error, result) {
				if (!error) {
					authorizationResult = result;
					var promise = authorizationResult.post(
							'1.1/friendships/destroy.json', {
								data : {
									screen_name : accountToUnfollow
								}
							});

					promise.done(function(response) {
						deferred.resolve();
					}).fail(function(error) {

					});

				} else {

				}
			});
		}

		return deferred.promise;
	};
});