(function() {
	var entityModule = angular.module('entity');

	entityModule.factory('Tag', ['$resource', 'apiUrl', function($resource, apiUrl) {

		var resourceUrl = apiUrl + "user/me/entity";

		var defaultResourceParams = {
			uri: "@uri"
		}

		var headers = {
			'Content-Type': 'application/json',
			'Accept': 'application/fayve+json'
		}

		var postAction = {
			method: 'POST',
			withCredentials: true,
			headers: headers
		}

		var deleteAction = {
			method: 'GET',
			url: resourceUrl + "/:uri/tag/delete/",
			withCredentials: true,
			headers: headers
		}

		var actions = {
			post: postAction,
			delete: deleteAction
		}

		return $resource(resourceUrl, defaultResourceParams, actions);
	}]);
})();