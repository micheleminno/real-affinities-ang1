angular
		.module('twitter-service', [])
		.service(
				'TwitterService',
				function($q, $rootScope, $route) {

					var authorizationResult = false;

					var twitterServiceFunctions = {

						initialize : function() {

							authorizationResult = true;
						},
						isReady : function() {
							return (authorizationResult);
						},
						connectTwitter : function($scope) {

							var deferred = $q.defer();
							deferred.resolve("connected");
							return deferred.promise;
						},
						getScreenName : function() {

							var deferred = $q.defer();
							var user_info = {
								"raw" : {
									"screen_name" : "micheleminno"
								}
							};
							deferred.resolve(user_info);
							return deferred.promise;
						},
						clearCache : function() {
							authorizationResult = false;
						},
						getLatestTweets : function(screenName) {

							var deferred = $q.defer();
							var tweetList = [];
							var tweet = {};
							tweet["text"] = "Text in a tweet";
							var i = 1;
							tweet["user"] = {
									"screen_name" : screenName,
									"name" : "Profile " + screenName,
									"profile_image_url" : "js/fake-twitter-thumbnails/"
											+ i + ".jpeg",
									"followers_count" : 1000 % i,
									"friends_count" : i,
									"statuses_count" : 100 % i,
									"url" : "http://www." + screenName + ".com",
									"location" : "location of " + screenName,
									"description" : "This is the description of " + screenName
								};
							tweetList.push(tweet);
							deferred.resolve(tweetList);
							return deferred.promise;
						},
						getFollowing : function(screenName, cursor) {

							var deferred = $q.defer();
							var followingList = [];
							followingList["users"] = [];

							for ( var i = 0; i < 20; i++) {

								var imgIndex = i % 5 + 1;
								followingList["users"][i] = {
									"screen_name" : "profile" + i,
									"name" : "Profile " + i,
									"profile_image_url" : "js/fake-twitter-thumbnails/"
											+ imgIndex + ".jpeg",
									"followers_count" : 1000 % i,
									"friends_count" : i,
									"statuses_count" : 100 % i,
									"url" : "http://www.profile" + i + ".com",
									"location" : "location" + i,
									"description" : "This is the description of profile" + i
								};
							}

							followingList["next_cursor"] = 1;

							deferred.resolve(followingList);
							return deferred.promise;
						},
						getListMembers : function(screenName, listName) {

							var deferred = $q.defer();
							if (screenName && listName) {

								OAuth.popup('twitter', {
									cache : true
								}, function(error, result) {
									if (!error) {
										authorizationResult = result;
										var promise = authorizationResult.get(
												'1.1/lists/members.json?slug='
														+ listName
														+ '&owner_screen_name='
														+ screenName).done(
												function(data) {
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
						},
						getLists : function(screenName) {

							var deferred = $q.defer();
							if (screenName) {
								OAuth.popup('twitter', {
									cache : true
								}, function(error, result) {
									if (!error) {
										authorizationResult = result;
										var promise = authorizationResult.get(
												'1.1/lists/ownerships.json?screen_name='
														+ screenName).done(
												function(data) {
													deferred.resolve(data);
												});

									} else {
										console.log('error during getLists');
									}
								});
							}

							return deferred.promise;
						},
						addMemberToList : function(ownerScreenName, listName,
								accountToAdd) {

							var deferred = $q.defer();
							if (ownerScreenName && listName && accountToAdd) {
								OAuth
										.popup(
												'twitter',
												{
													cache : true
												},
												function(error, result) {
													if (!error) {
														authorizationResult = result;
														var promise = authorizationResult
																.post(
																		'1.1/lists/members/create.json',
																		{
																			data : {
																				slug : listName,
																				owner_screen_name : ownerScreenName,
																				screen_name : accountToAdd
																			}
																		})
																.done(
																		function(
																				response) {
																			deferred
																					.resolve();
																		})
																.fail(
																		function(
																				error) {
																			deferred
																					.resolve(error.status);
																		});
													}
												});
							}

							return deferred.promise;
						},
						removeMemberFromList : function(ownerScreenName,
								listName, accountToRemove) {

							var deferred = $q.defer();
							if (ownerScreenName && listName && accountToRemove) {
								OAuth
										.popup(
												'twitter',
												{
													cache : true
												},
												function(error, result) {
													if (!error) {
														authorizationResult = result;
														var promise = authorizationResult
																.post(
																		'1.1/lists/members/destroy.json',
																		{
																			data : {
																				slug : listName,
																				owner_screen_name : ownerScreenName,
																				screen_name : accountToRemove
																			}
																		})
																.done(
																		function(
																				response) {
																			deferred
																					.resolve();
																		})
																.fail(
																		function(
																				error) {

																		});

													} else {

													}
												});
							}

							return deferred.promise;
						},

						createList : function(list) {

							var deferred = $q.defer();
							if (list) {

								var promise = authorizationResult.post(
										'1.1/lists/create.json', {
											data : {
												name : list
											}
										}).done(function(response) {
									deferred.resolve(response);
								}).fail(function(error) {
									deferred.resolve(error);
								});

							}

							return deferred.promise;
						},
						removeList : function(listId) {

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
											}).done(function(response) {
										// alert("list " + list + " removed!");
										deferred.resolve();
									}).fail(function(error) {

									});

								} else {

								}
							});

							return deferred.promise;
						},
						follow : function(accountToFollow) {

							var deferred = $q.defer();
							if (accountToFollow) {
								OAuth
										.popup(
												'twitter',
												{
													cache : true
												},
												function(error, result) {
													if (!error) {
														authorizationResult = result;
														var promise = authorizationResult
																.post(
																		'1.1/friendships/create.json',
																		{
																			data : {
																				screen_name : accountToFollow
																			}
																		})
																.done(
																		function(
																				response) {
																			deferred
																					.resolve();
																		})
																.fail(
																		function(
																				error) {

																		});

													} else {

													}
												});
							}

							return deferred.promise;
						},
						unfollow : function(accountToUnfollow) {

							var deferred = $q.defer();
							if (accountToUnfollow) {
								OAuth
										.popup(
												'twitter',
												{
													cache : true
												},
												function(error, result) {
													if (!error) {
														authorizationResult = result;
														var promise = authorizationResult
																.post(
																		'1.1/friendships/destroy.json',
																		{
																			data : {
																				screen_name : accountToUnfollow
																			}
																		})
																.done(
																		function(
																				response) {
																			deferred
																					.resolve();
																		})
																.fail(
																		function(
																				error) {

																		});

													} else {

													}
												});
							}

							return deferred.promise;
						}
					};

					return twitterServiceFunctions;

				});