app.service('HttpService', function($http, $q) {

	this.callThisUrl = function(url) {

		var deferred = $q.defer();

		$http.get(url).success(function() {

			deferred.resolve(true);

		}).error(function() {

			console.log("Invalid Url: " + url);

			deferred.resolve(false);
		});

		return deferred.promise;
	};
});