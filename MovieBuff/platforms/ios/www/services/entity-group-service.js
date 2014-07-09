//Gets a related grouping of entities, with less details on each.
(function() {
	var entityModule = angular.module('entity');

	entityModule.factory('EntityGroup', ['$resource', 'apiUrl', function($resource, apiUrl) {

		var resourceUrl = apiUrl + "preset/:preset/result/:result/group/:group/";

		var defaultResourceParams = {
			preset: "@preset",
			result: "@result",
			group: "@group"
		}

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