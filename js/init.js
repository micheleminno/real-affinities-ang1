var initProfiles = function($scope) {

	$scope.keywords = "";
	$scope.searchActive = false;
	$scope.addPotentialAccountActive = false;
	$scope.profileList = [];
	$scope.profileImages = [];
	$scope.userScreenName = "";
	$scope.rowsAmount = 0;
	$scope.loading = false;

	$scope.sortingPredicates =

	[ {}, {
		label : 'Followers',
		field : '-followers_count'
	}, {
		label : 'Following',
		field : '-friends_count'
	}, {
		label : 'Tweets',
		field : '-statuses_count'
	} ];

	$scope.sortingPredicate = $scope.sortingPredicates[0]["field"];

	$scope.mode =

	{
		active : "",
		target : {
			active : false,
			items : 0
		},
		keywordsSearchResult : {
			active : false,
			items : 0
		},

		screenNameSearchResult : {
			active : false,
			items : 0

		},
		computed : {
			active : false,
			items : 0

		},
		interestMatching : {
			active : false,
			items : 0

		}
	};

	$scope.checked = {};

	$scope.showInterests();
	$scope.showTarget();
};

var initInterests = function($scope) {

	$scope.loading = false;

	$scope.interestLanguages =

	[ {
		label : 'english',
		field : 'en'
	}, {
		label : 'italian',
		field : 'it'
	} ];

	$scope.interestLanguage = $scope.interestLanguages[0]["field"];

	$scope.tweetAmounts =

	[ {
		label : '1K tweets',
		field : 1000
	}, {
		label : '10K tweets',
		field : 10000
	}, {
		label : '100K tweets',
		field : 100000
	}, {
		label : '1M tweets',
		field : 1000000
	} ];

	$scope.tweetAmount = $scope.tweetAmounts[0]["field"];

};
