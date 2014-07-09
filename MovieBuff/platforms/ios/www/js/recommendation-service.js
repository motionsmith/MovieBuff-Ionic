//Gets an entity from the Middleware
(function() {
	var entityModule = angular.module('entity');

	entityModule.factory('Recommendations', ['$resource', 'apiUrl', function($resource, apiUrl) {
		
		var resourceUrl = apiUrl + "user/me/entity/recommend";

		var defaultResourceParams = {};

		var headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/fayve+json'
		}

		var queryAction = {
			method: 'GET',
			withCredentials: true,
			headers: headers
		}

		var actions = {
			query: queryAction
		}

		return $resource(resourceUrl, defaultResourceParams, actions);
	}]);
})()