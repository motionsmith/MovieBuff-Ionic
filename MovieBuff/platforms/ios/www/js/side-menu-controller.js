(function() {
	var starterModule = angular.module('starter');

	starterModule.controller('SideMenuCtrl', ['$scope', '$state', '$localStorage', '$ionicLoading', '$location', 'Login', function($scope, $state, $localStorage, $ionicLoading, $location, Login) {
		
		//Attempts to sign the user out of their account
		$scope.signUserOut = function() {
			$ionicLoading.show({
				template: 'Signing out...',
				delay: 750
			});

			$scope.loginPromise = Login.logout({
				mode: 'logout',
			}, logoutResponse, logoutError);
		}

		function logoutResponse(response) {
			$ionicLoading.hide();

			delete $localStorage['authToken'];
			$location.path('/');
		}

		function logoutError(error) {
			$ionicLoading.hide();

			console.log(error);
		}
	}]);
})()