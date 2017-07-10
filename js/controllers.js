var controllers = angular.module('controllers', []);

var mainController = controllers
		.controller(
				"MainCtrl",
				function($scope, $location, HttpService, TwitterService,
						ElasticsearchService, MysqlService) {

					$scope.updateTarget = function(profile) {

						$scope.loading = true;

						// in order to restart from beginning to compute
						// interesting profiles
						$scope.mode.computed.items = 0;

						if (profile["inTarget"]) {

							MysqlService.removeFromTarget(profile.id).then(
									function(removed) {

										if (removed) {
											profile["inTarget"] = false;
										}

										$scope.loading = false;
									});
						} else {

							MysqlService.addToTarget(profile.id)
									.then(
											function(added) {

												if (added) {

													profile["inTarget"] = true;

													$scope.loading = false;

													ElasticsearchService
															.index(profile);
												}
											});
						}

					};

					$scope.showTarget = function() {

						$scope.loading = true;

						$scope.mode.active = "target";

						MysqlService
								.getTarget()
								.then(
										function(targetUserIds) {

											if (targetUserIds.length == 0) {

												$scope.profileList = [];
												$scope.loading = false;

											} else {
												ElasticsearchService
														.loadProfiles(
																targetUserIds)
														.then(
																function(
																		targetUsers) {

																	for ( var targetIndex in targetUsers) {

																		targetUsers[targetIndex]["inTarget"] = true;
																	}

																	$scope
																			.getLatestTweets(
																					targetUsers,
																					function(
																							users) {

																						$scope
																								.updateProfileList(users);

																						$scope.loading = false;

																						var requests = 0;

																						users
																								.forEach(function(
																										user) {

																									requests++;
																									ElasticsearchService
																											.index(
																													user)
																											.then(
																													function() {

																														requests--;
																														if (requests == 0) {

																															$scope
																																	.assignInterests(users);
																														}
																													});
																								});
																					});
																});
											}
										});
					};

					$scope.updateProfileImg = function(profileId,
							normalImageUrl) {

						var biggerImageUrl = normalImageUrl.substring(0,
								normalImageUrl.lastIndexOf("normal"));
						biggerImageUrl = biggerImageUrl + "400x400";
						var resultUrl = biggerImageUrl + ".jpg";

						HttpService
								.urlExists(resultUrl)
								.then(
										function(found) {

											if (!found) {

												resultUrl = biggerImageUrl
														+ ".jpeg";

												HttpService
														.urlExists(resultUrl)
														.then(
																function(found) {

																	if (!found) {

																		resultUrl = biggerImageUrl
																				+ ".png";
																	}

																	console
																			.log("Img url: "
																					+ resultUrl);

																	$scope.profileImages[profileId] = resultUrl;
																});
											} else {

												console.log("Img url: "
														+ resultUrl);

												$scope.profileImages[profileId] = resultUrl;
											}
										});

					};

					$scope.filter = function() {

						$scope.keywords = $scope.insertedKeywords;
					};

					$scope.style = function(profile) {

						var style = {};

						if (profile.inTarget) {

							style["background-color"] = "#F0DADA";
						} else if (profile.origin == "keywordsSearchResult") {

							style["background-color"] = "#BFF2D5";
						} else if (profile.origin == "interestMatching") {

							style["background-color"] = "#81DAF5";
						} else if (profile.origin == "screenNameSearchResult") {

							style["background-color"] = "#ADC1F7";
						}

						if (profile.status == "new") {

							style.border = "4px solid rgb(56,117,196)";
						} else {

							style.border = "2px solid black";
						}

						return style;
					};

					$scope.assignInterests = function(profiles) {

						for (profileIndex in profiles) {

							profiles[profileIndex].interests = [];
						}

						if ($scope.interests == 0) {

							$scope.loading = false;
							
						} else {

							var requests = 0;

							$scope.interests
									.forEach(function(interest) {

										requests++;

										ElasticsearchService
												.getProfilesMatchingInterest(
														interest.name)
												.then(
														function(
																matchingProfiles) {

															requests--;
															if (requests == 0) {

																$scope.loading = false;
															}

															var matchingProfilesIds = [];
															for (matchingProfileIndex in matchingProfiles) {

																matchingProfilesIds
																		.push(parseInt(matchingProfiles[matchingProfileIndex].id));
															}

															profiles
																	.forEach(function(
																			profile) {

																		if (matchingProfilesIds
																				.indexOf(profile.id) > -1) {

																			profile.interests
																					.push(interest.name);
																		}
																	});
														});
									});
						}
					};

					$scope.showInterestingAccounts = function() {

						$scope.loading = true;

						$scope.mode.active = "computed";

						var actualItems = $scope.mode.computed.items;

						MysqlService
								.getInterestingUsers(actualItems, 20)
								.then(
										function(ids) {

											TwitterService
													.lookupUsers(ids)
													.then(
															function(profiles) {

																$scope
																		.getLatestTweets(
																				profiles,
																				function(
																						profiles) {

																					$scope
																							.updateProfileList(profiles);
																					$scope.mode.computed.items = actualItems
																							+ profiles.length;

																					var requests = 0;

																					profiles
																							.forEach(function(
																									profile) {

																								requests++;

																								ElasticsearchService
																										.index(
																												profile)
																										.then(
																												function() {

																													requests--;
																													if (requests == 0) {

																														$scope
																																.assignInterests(profiles);
																													}
																												});

																							});
																				});
															});
										});
					};

					$scope.search = function() {

						if (!$scope.searchActive
								|| $scope.insertedUserKeywords == '') {

							return;
						}

						$scope.loading = true;

						$scope.mode.active = "keywordsSearchResult";

						var actualItems = $scope.mode.keywordsSearchResult.items;
						var actualPages = actualItems / 20;
						var nextPage = actualPages + 1;

						$scope.userKeywords = $scope.insertedUserKeywords;
						TwitterService
								.searchUsers($scope.userKeywords, nextPage)
								.then(
										function(userResults) {

											$scope.mode.keywordsSearchResult.items = actualItems
													+ userResults.length;

											var requests = 0;

											for ( var profileIndex in userResults) {

												requests++;
												MysqlService
														.isInTarget(
																userResults[profileIndex]["id"],
																profileIndex)
														.then(
																function(
																		results) {

																	var inTargetResult = results[0];
																	var index = results[1];
																	requests--;
																	userResults[index]["origin"] = "keywordsSearchResult";
																	userResults[index]["inTarget"] = inTargetResult;

																	if (requests == 0) {

																		$scope
																				.getLatestTweets(
																						userResults,
																						function(
																								users) {

																							$scope
																									.updateProfileList(users);

																							$scope.loading = false;
																						});
																	}
																});
											}

										});
					};

					$scope.deleteTarget = function() {

						$scope.loading = true;

						MysqlService.deleteTarget().then(
								function(deleted) {

									if (deleted) {
										ElasticsearchService
												.deleteAllProfiles()
												.then(function(deleted) {

													$scope.loading = false;

													if (deleted) {

														$scope.showTarget();
													}
												});
									}
								});
					};

					$scope.getLatestTweets = function(users, callback) {

						var requests = 0;

						for ( var profileIndex in users) {

							requests++;
							TwitterService.getLatestTweets(
									users[profileIndex].screen_name,
									profileIndex).then(function(results) {

								var tweets = results[0];
								var index = results[1];
								requests--;

								users[index]["tweets"] = tweets;
								if (requests == 0) {

									callback(users);
								}
							});
						}
					};

					$scope.updateProfileList = function(profiles) {

						var profilesToAdd = [];

						for ( var profilesIndex in $scope.profileList) {

							$scope.profileList[profilesIndex]["status"] = "old";
						}

						for ( var newProfilesIndex in profiles) {

							var found = false;

							for ( var profilesIndex in $scope.profileList) {

								if ($scope.profileList[profilesIndex]["id"] == profiles[newProfilesIndex]["id"]) {

									found = true;
									var newInterests = profiles[newProfilesIndex]["interests"];
									if (newInterests) {

										for ( var interestIndex in newInterests) {

											if ($scope.profileList[profilesIndex]["interests"]
													.indexOf(newInterests[interestIndex]) == -1) {

												$scope.profileList[profilesIndex]["interests"]
														.push(newInterests[interestIndex]);
											}
										}
									}

									break;
								}
							}
							if (!found) {

								profiles[newProfilesIndex]["status"] = "new";

								var actualImageUrl = profiles[newProfilesIndex]["profile_image_url"];
								var profileId = profiles[newProfilesIndex]["id"];
								$scope.updateProfileImg(profileId,
										actualImageUrl);

								profilesToAdd.push(profiles[newProfilesIndex]);
							}
						}

						$scope.profileList = $scope.profileList
								.concat(profilesToAdd);
						$scope.rowsAmount += Math
								.ceil(profilesToAdd.length / 4);
					};

					$scope.addPotentialAccount = function() {

						if (!$scope.addPotentialAccountActive
								|| $scope.insertedPotentialAccount == '') {

							return;
						}
						$scope.loading = true;

						$scope.potentialAccount = $scope.insertedPotentialAccount;

						TwitterService
								.getLatestTweets($scope.potentialAccount)
								.then(
										function(tweetsInfo) {

											if (tweetsInfo.length == 0) {

												$scope.loading = false;

												alert("No tweets found!");

											} else {

												var firstTweet = tweetsInfo[0][0];
												var userProfile = firstTweet["user"];
												userProfile["origin"] = "screenNameSearchResult";

												MysqlService
														.isInTarget(
																userProfile.id)
														.then(
																function(
																		inTargetResult) {

																	userProfile["inTarget"] = inTargetResult[0];
																	userProfile["tweets"] = tweetsInfo[0];

																	$scope
																			.updateProfileList([ userProfile ]);

																	$scope.loading = false;

																	ElasticsearchService
																			.index(
																					userProfile)
																			.then(
																					function() {

																						$scope
																								.assignInterests([ userProfile ]);
																					});
																});
											}
										});
					};

					$scope.goToInterestsPage = function() {

						$location.path("/interests");
					};

					$scope.canShowProfile = function(index, parentIndex) {

						var inCurrentRow = (index) / 4 < parentIndex + 1
								&& (index) / 4 >= parentIndex;

						return inCurrentRow;
					};

					$scope.showInterests = function() {

						ElasticsearchService.loadInterests(true).then(
								function(interests) {

									$scope.interests = interests;
								});
					};

					$scope.getProfilesMatchingInterests = function() {

						$scope.loading = true;

						ElasticsearchService
								.getProfilesMatchingInterest(
										$scope.selectedInterest.name)
								.then(
										function(profiles) {

											if (profiles.length == 0) {

												$scope.loading = false;

											} else {

												$scope
														.getLatestTweets(
																profiles,
																function(users) {

																	for (profileIndex in profiles) {

																		var profile = profiles[profileIndex];
																		profile["origin"] = "interestMatching";
																		profile["interests"] = [ $scope.selectedInterest.name ];
																	}

																	$scope
																			.updateProfileList(users);

																	$scope.loading = false;

																	users
																			.forEach(function(
																					user) {

																				ElasticsearchService
																						.index(user);
																			});
																});

											}
										});
					};

					initProfiles($scope);

				});

var interestsController = controllers.controller("InterestsCtrl", function(
		$scope, $http, $location, TwitterService, ElasticsearchService) {

	$scope.showInterests = function() {

		$scope.loading = true;

		ElasticsearchService.loadInterests().then(function(interests) {

			$scope.interestList = interests;
			$scope.loading = false;
		});
	};

	$scope.addInterest = function() {

		if ($scope.insertedInterestName == ''
				|| $scope.insertedInterestQuery == '') {

			return;
		}

		$scope.loading = true;

		$scope.interestName = $scope.insertedInterestName;
		$scope.interestQuery = $scope.insertedInterestQuery;

		ElasticsearchService.addInterest($scope.interestName,
				$scope.interestQuery).then(function(addedInterest) {

			if (addedInterest) {
				$scope.showInterests();
			}
		});
	};

	$scope.deleteInterests = function() {

		$scope.loading = true;

		ElasticsearchService.deleteAllInterests().then(function(deleted) {

			if (deleted) {
				$scope.showInterests();
			}
		});
	};

	$scope.deleteInterest = function(interest) {

		$scope.loading = true;

		ElasticsearchService.deleteInterest(interest.name).then(
				function(deleted) {

					if (deleted) {
						$scope.showInterests();
					}
				});
	};

	$scope.searchInterest = function(interest, interestLanguage, tweetAmount) {

		$scope.loading = true;

		var twitterUrl = "http://localhost:3000";

		$http.get(
				twitterUrl + '/twitter/search/tweets?q=' + interest.query
						+ "&lang=" + interestLanguage + "&amount="
						+ tweetAmount).success(

				function(data) {

					interest.text = data.value;
					ElasticsearchService.addTextToInterest(interest.name,
							interest.text).then(function() {

						$scope.showInterests();
					});
				});
	};

	$scope.editInterest = function(interest) {

		ElasticsearchService.addTextToInterest(interest.name, interest.content)
				.then(function() {

					$scope.showInterests();
				});
	};

	$scope.goToProfilesPage = function() {

		$location.path("/");
	};

	initInterests($scope);

	$scope.showInterests();
});
