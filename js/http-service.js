app.service('HttpService', function($http, $q) {

	var myServerUrl = 'http://localhost:3000';

	this.urlExists = function(url) {

		var deferred = $q.defer();

		$http.get(myServerUrl + '/utilities/url-exists?url=' + url).success(
				function(checkedUrl) {

					deferred.resolve(checkedUrl.exists);
				});

		return deferred.promise;
	};
});