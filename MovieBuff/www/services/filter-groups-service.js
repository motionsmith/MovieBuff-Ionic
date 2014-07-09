//Gets a related grouping of entities, with less details on each.
(function() {
	var entityModule = angular.module('entity');

	entityModule.factory('FilterGroups', ['$resource', 'apiUrl', function($resource, apiUrl) {

		var resourceUrl = apiUrl + "preset/:preset/result?item_offset=:offset&item_limit=:limit";

		var defaultResourceParams = {
			preset: "@preset",
			offset: "@offset",
			limit: "@limit"
		}

		var headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/fayve+json'
		}

		var queryAction = {
			method: 'POST',
			withCredentials: true,
			headers: headers
		}

		var actions = {
			query: queryAction
		}

		return $resource(resourceUrl, defaultResourceParams, actions);
	}]);
})()