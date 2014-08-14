//Gets the Actions for an entity
(function() {
  var entityModule = angular.module('entity');

  entityModule.factory('Action', ['$resource', 'apiUrl', function($resource, apiUrl) {
    
    var resourceUrl = apiUrl + "view/:uri/action";

    var defaultResourceParams = {
      uri: "@uri"
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