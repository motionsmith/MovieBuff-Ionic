(function() {
	var app = angular.module('starter');

	app.controller('RegisterController', ['$scope', '$state', '$localStorage', '$ionicViewService', '$cookies', '$ionicLoading', 'Login', function($scope, $state, $localStorage, $ionicViewService, $cookies, $ionicLoading, Login) {
		
		$scope.isProcessingRegistration = false;
		$scope.registerPromise = null;
		$scope.showRegisterScreen = true;

		$scope.onRegisterClick = function (email, password, confirmPassword) {
			$scope.registerErrorMessage = '';

			if (password != confirmPassword) {
				$scope.registerErrorMessage = "Your passwords do not match.";
				return;
			}

			$ionicLoading.show({
				template: "Registering...",
				delay: 750
			});

			$scope.registerPromise = Login.register({
				mode: 'signup',
				email: email,
				password: password
			}, onRegisterSuccess, onRegisterError);
		};

		var onRegisterSuccess = function (result) {
			$ionicLoading.hide();

			if (result.status.code === 200) {
				if (result.data.length === 1) {
					$localStorage = result.data[0].authToken;
				} else {
					$localStorage = result.data.authToken;
				}
				$cookies.authToken = $localStorage.authToken;

				$ionicViewService.nextViewOptions({
					disableBack: true
				});

				$state.go('app.picks');
			} else {
				if (result.message) {
					$scope.registerErrorMessage = result.message;
				} else if (result.status.message) {
					$scope.registerErrorMessage = result.status.message;
				} else {
					$scope.registerErrorMessage = "There was a problem registering. Please try again later.";
				}
			}
		};

		var onRegisterError = function (error) {
			$ionicLoading.hide();
			$scope.registerErrorMessage = error.message;
		}
	}]);
})()