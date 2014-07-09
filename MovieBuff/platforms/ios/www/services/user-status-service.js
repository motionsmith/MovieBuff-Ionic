(function() {
	var entityModule = angular.module('entity');

	entityModule.factory('UserStatus', ['$resource', 'apiUrl', function($resource, apiUrl) {

		var resourceUrl = apiUrl + "status";

		var defaultResourceParams = {};

		var headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/fayve+json'
		}

		var queryAction = {
			method: 'GET',
			headers: headers,
			withCredentials: true
		}

		var actions = {
			query: queryAction
		}

		return $resource(resourceUrl, defaultResourceParams, actions);
	}]);
})()