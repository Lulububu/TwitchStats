angular.module('Controllers.home', []).controller('HomeController', HomeController);

HomeController.$inject = ['$scope', '$http', 'tcConfig'];


function HomeController($scope, $http, tcConfig) {
	$scope.updateSearch = updateSearch;



	function updateSearch(search) {
		$http.get("https://api.twitch.tv/kraken/search/streams?q=" + search, {
            	headers : {
            		'Client-ID' : tcConfig.twitchAPIId
            	}
            })
			.success(function(response) {
				$scope.channelResults = response.streams;
				console.log($scope.channelResults)
			});
	}
}