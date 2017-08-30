app.service('ElasticsearchService', function($q) {

	var client = new elasticsearch.Client({
		host : 'localhost:9200'
	});

	this.index = function(profile) {

		var deferred = $q.defer();

		var content = "";
		var contentDates = [];
		for ( var tweetIndex in profile.tweets) {

			content += profile.tweets[tweetIndex].text + " ";
			contentDates.push(profile.tweets[tweetIndex].created_at);
		}

		var promise = client.index({

			index : 'real-affinities',
			type : 'profile',
			id : profile.id,
			body : {
				screen_name : profile.screen_name,
				name : profile.name,
				location : profile.location,
				url : profile.url,
				profile_image_url : profile.profile_image_url,
				verified : profile.verified,
				description : profile.description,
				statuses_count : profile.statuses_count,
				followers_count : profile.followers_count,
				friends_count : profile.friends_count,
				content : content,
				contentDates : contentDates
			}
		});

		promise.done(function(data) {

			deferred.resolve(data);
		});

		return deferred.promise;

	};

	this.loadProfiles = function(userIds) {

		var deferred = $q.defer();

		var query = {
			index : 'real-affinities',
			body : {
				query : {
					ids : {
						type : "profile",
						values : userIds
					}
				}
			}
		};

		var promise = client.search(query);

		promise.done(function(data) {

			var profiles = [];
			for ( var hitIndex in data.hits.hits) {

				var user = data.hits.hits[hitIndex]["_source"];
				user.id = data.hits.hits[hitIndex]["_id"];
				profiles.push(user);
			}

			deferred.resolve(profiles);
		});

		return deferred.promise;
	};

	this.deleteAllProfiles = function() {

		var deferred = $q.defer();

		var query = {
			index : 'real-affinities',
			body : {
				filtered : {
					query : {
						match_all : {}
					},
					filter : {
						missing : {
							field : 'is_interest'
						}
					}
				}
			}
		};

		var promise = client.deleteByQuery(query);

		promise.done(function(data) {

			console.log(JSON.stringify(data));

			var innerPromise = client.indices.refresh('real-affinities');

			innerPromise.done(function(data) {

				deferred.resolve(true);
			});
		});

		return deferred.promise;
	};

	this.addInterest = function(name, query) {

		var deferred = $q.defer();

		var nameWithoutInnerSpaces = name.replace(/ /g, "-");

		var promise = client.index({

			index : 'real-affinities',
			type : 'profile',
			id : nameWithoutInnerSpaces,
			body : {
				name : name,
				query : query,
				is_interest : true
			}
		});

		promise.done(function(data) {

			console.log(JSON.stringify(data));

			var innerPromise = client.indices.refresh('real-affinities');

			innerPromise.done(function(data) {

				deferred.resolve(data.ok);
			});
		});

		return deferred.promise;
	};

	this.addTextToInterest = function(name, text) {

		var deferred = $q.defer();

		var nameWithoutInnerSpaces = name.replace(/ /g, "-");

		var promise = client.update({

			index : 'real-affinities',
			type : 'profile',
			id : nameWithoutInnerSpaces,
			body : {

				doc : {
					content : text
				}
			}
		});

		promise.done(function(data) {

			console.log(JSON.stringify(data));

			var innerPromise = client.indices.refresh('real-affinities');

			innerPromise.done(function(data) {

				deferred.resolve(data);
			});
		});

		return deferred.promise;
	};

	this.loadInterests = function(withContent) {

		var deferred = $q.defer();

		var query = {
			index : 'real-affinities',
			body : {
				query : {
					bool : {
						must : {
							match_all : {}
						},
						filter : {
							exists : {
								field : "is_interest"
							}
						}
					}
				}
			}
		};

		var promise = client.search(query);

		promise.done(function(data) {

			var interests = [];
			for ( var hitIndex in data.hits.hits) {

				var interest = data.hits.hits[hitIndex]["_source"];
				if (withContent && interest.content || !withContent) {
					interests.push(interest);
				}
			}

			deferred.resolve(interests);
		});

		return deferred.promise;
	};

	this.deleteAllInterests = function() {

		var deferred = $q.defer();

		var query = {
			index : 'real-affinities',
			body : {
				filtered : {
					query : {
						match_all : {}
					},
					filter : {
						exists : {
							field : "is_interest"
						}
					}
				}
			}
		};

		var promise = client.deleteByQuery(query);

		promise.done(function(data) {

			console.log(JSON.stringify(data));

			var innerPromise = client.indices.refresh('real-affinities');

			innerPromise.done(function(data) {

				deferred.resolve(data.ok);
			});
		});

		return deferred.promise;
	};

	this.deleteInterest = function(interestName) {

		var nameWithoutInnerSpaces = interestName.replace(/ /g, "-");

		var deferred = $q.defer();

		var query = {
			index : 'real-affinities',
			body : {
				filtered : {
					query : {
						ids : {
							type : 'profile',
							values : [ nameWithoutInnerSpaces ]
						}
					},
					filter : {
						exists : {
							field : "is_interest"
						}
					}
				}
			}
		};

		var promise = client.deleteByQuery(query);

		promise.done(function(data) {

			console.log(JSON.stringify(data));

			var innerPromise = client.indices.refresh('real-affinities');

			innerPromise.done(function(data) {

				deferred.resolve(data.ok);
			});
		});

		return deferred.promise;

	};

	this.getProfilesMatchingInterest = function(interest) {

		interest = interest.replace(" ", "-");

		var deferred = $q.defer();

		var params = {
			index : 'real-affinities',
			type : 'profile',
			id : interest,
			mlt_fields : 'content',
			min_term_freq : 1,
			min_doc_freq : 1
		};

		var promise = client.mlt(params);

		promise.done(function(data) {

			var profiles = [];
			for ( var hitIndex in data.hits.hits) {

				var user = data.hits.hits[hitIndex]["_source"];
				user.id = data.hits.hits[hitIndex]["_id"];
				if (!user.is_interest) {
					profiles.push(user);
				}
			}

			deferred.resolve(profiles);
		});

		return deferred.promise;
	};

});
