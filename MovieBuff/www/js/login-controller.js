(function() {
	var app = angular.module('starter');

	app.controller('LoginController', ['$scope', 'Login', '$ionicLoading', '$state', '$localStorage', '$ionicViewService', '$cookies', function($scope, Login, $ionicLoading, $state, $localStorage, $ionicViewService, $cookies) {
		$scope.email = '';
		$scope.password = '';
		$scope.loginErrorMessage = '';
		$scope.showLoginScreen = false;

		//Cookies don't persist on a WebView on iOS. But cookies are the only way that the MW accepts the authToken.
		//So we have to keep two locally stored versions: One for login persistance, and one for MW auth.
		$cookies.authToken = $localStorage.authToken;

		if (angular.isDefined($localStorage.authToken)) {
			$ionicLoading.show({
				template: "Signing in..."
			});

			$scope.loginPromise = Login.authorizeToken({
				mode: 'authToken',
			}, authorizeTokenResponse, authorizeTokenError);
		} 
		else {
			$scope.showLoginScreen = true;
		}

		//Called when the user submits login credentials.
		$scope.onLogin = function() {
			$scope.loginErrorMessage = '';

			$ionicLoading.show({
				template: "Signing in...",
				delay: 750
			});

			$scope.loginPromise = Login.login({
				mode: 'signin',
				email: $scope.email,
				password: $scope.password
			}, loginResponse, loginError);
		};

		//Called when we get a login response from the server.
		//Not necessarily successfully authenticated.
		function loginResponse(result) {
			$ionicLoading.hide();

			if (result.status.code == 200) {
				if (result.data) {
					$localStorage.authToken = result.data[0].authToken;
					$cookies.authToken = $localStorage.authToken;

					$ionicViewService.nextViewOptions({
						disableBack: true
					});

					$state.go('app.picks');
				}
				else {
					$scope.loginErrorMessage = result.message;
				}
			}
			else {
				$scope.loginErrorMessage = result.message || result.status.message;
			}
		}

		//Called when there's a failed server response.
		function loginError(error) {
			$ionicLoading.hide();
			$scope.loginErrorMessage = error.message;
		}

		function authorizeTokenResponse(result) {
			$ionicLoading.hide();

			if (angular.isDefined(result.data) && angular.isDefined(result.data.authToken)) {

				$ionicViewService.nextViewOptions({
					disableBack: true,
					disableAnimate: true
				});

				$state.go('app.picks');
			}
			else
			{
				$scope.showLoginScreen = true;
			}
		}

		function authorizeTokenError(error) {
			$ionicLoading.hide();
		}
	}]);
})()