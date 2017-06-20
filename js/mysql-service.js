app.service('MysqlService', function($http, $q) {

	var mysqlUrl = 'http://localhost:3000';

	this.isInTarget = function(profileId, index) {

		var deferred = $q.defer();

		$http.get(mysqlUrl + '/target/contains?id=' + profileId).success(
				function(data) {

					var isPresent = false;

					if (data > 0) {

						isPresent = true;
					}

					deferred.resolve([ isPresent, index ]);
				});

		return deferred.promise;
	};

	this.addToTarget = function(profileId) {

		var deferred = $q.defer();

		$http.get(mysqlUrl + '/target/add?id=' + profileId).success(
				function(data) {

					if (data) {

						deferred.resolve(true);
					}
				});

		return deferred.promise;
	};

	this.removeFromTarget = function(profileId) {

		var deferred = $q.defer();

		$http.get(mysqlUrl + '/target/remove?id=' + profileId).success(
				function(data) {

					if (data) {

						deferred.resolve(true);
					}
				});

		return deferred.promise;
	};

	this.getTarget = function(profileId) {

		var deferred = $q.defer();

		$http.get(mysqlUrl + '/target').success(function(data) {

			deferred.resolve(data.targetIds);
		});

		return deferred.promise;
	};
	
	this.getInterestingUsers = function(offset, amount) {

		var deferred = $q.defer();

		$http.get(mysqlUrl + '/affinities/interesting?offset=' + offset + '&amount=' + amount).success(function(data) {

			deferred.resolve(data.interestingIds);
		});

		return deferred.promise;
	};

	this.deleteTarget = function() {

		var deferred = $q.defer();

		$http.get(mysqlUrl + '/target/delete').success(function(deleted) {

			deferred.resolve(deleted);
		});

		return deferred.promise;
	};
});