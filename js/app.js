var app = angular.module('main', [ 'ngRoute', 'controllers' ]);

app.config([ '$routeProvider', function($routeProvider) {

	$routeProvider.when('/', {
		templateUrl : 'home.html',
		controller : 'MainCtrl'
	}).when('/interests', {
		templateUrl : 'interests.html',
		controller : 'InterestsCtrl'
	}).otherwise({
		redirectTo : '/'
	});

} ]);

app.directive('ngEnter', function() {
	return function(scope, element, attrs) {
		element.bind("keydown keypress", function(event) {
			if (event.which === 13) {
				scope.$apply(function() {
					scope.$eval(attrs.ngEnter);
				});

				event.preventDefault();
			}
		});
	};
});

app.directive('errSrc', function() {
	return {
		link : function(scope, element, attrs) {
			element.bind('error', function() {
				if (attrs.src != attrs.errSrc) {
					attrs.$set('src', attrs.errSrc);
				}
			});
		}
	};
});

app.filter('range', function() {
	return function(input, total) {
		total = parseInt(total);
		for ( var i = 0; i < total; i++)
			input.push(i);
		return input;
	};
});
