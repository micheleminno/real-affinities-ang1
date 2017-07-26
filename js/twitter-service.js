app.service('TwitterService', function($q, $rootScope, $http, $route) {

	var twitterUrl = "http://localhost:3000";

	this.getLatestTweets = function(screenName, index) {

		var deferred = $q.defer();

		$http.get(twitterUrl + '/twitter/tweets?user=' + screenName).success(

		function(data) {

			deferred.resolve([ data, index ]);
		});

		return deferred.promise;
	};

	this.lookupUsers = function(ids) {

		var deferred = $q.defer();

		var idsParam = ids.join();
		
		$http.get(twitterUrl + '/twitter/users?ids=' + idsParam).success(

		function(data) {

			deferred.resolve(data);
		});

		return deferred.promise;
	};
	
	this.getFollowing = function(screenName, cursor) {

		// TODO
	};

	this.searchUsers = function(userQuery, page) {

		var deferred = $q.defer();

		$http.get(
				twitterUrl + '/twitter/search/users?q=' + userQuery + "&page="
						+ page).success(

		function(data) {

			deferred.resolve(data);
		});

		return deferred.promise;
	};

	this.getFollowingIds = function(screenName) {

		// TODO
	};

	this.getListMembers = function(screenName, listName) {

		// TODO
	};

	this.getLists = function(screenName) {

		// TODO
	};

	this.addMemberToList = function(ownerScreenName, listName, accountToAdd) {

		// TODO
	};

	this.removeMemberFromList = function(ownerScreenName, listName,
			accountToRemove) {

		// TODO
	};

	this.createList = function(list) {

		// TODO
	};

	this.removeList = function(listId) {

		// TODO
	};

	this.follow = function(accountToFollow) {

		// TODO
	};

	this.unfollow = function(accountToUnfollow) {

		// TODO
	};
});