//Interface for authentication-related services
(function() {
    var starterApp = angular.module('starter');

    starterApp.factory('Login', ['$resource', 'apiUrl', function($resource, apiUrl) {

        var resourceUrl = apiUrl + 'authorization/:mode/';

        var defaultResourceParams = {
            mode: "@mode"
        };

        var headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/fayve+json'
        };

        var queryAction = {
            method: 'GET',
            withCredentials: true,
            headers: headers
        };

        var loginAction = {
            method: 'POST',
            withCredentials: true,
            headers: headers
        };

        var logoutAction = {
            method: 'GET',
            withCredentials: true,
            headers: headers
        }

        var authorizeTokenAction = {
            method: 'GET',
            withCredentials: true,
            headers: headers
        }

        var actions = {
            query: queryAction,
            login: loginAction,
            logout: queryAction,
            register: loginAction,
            authorizeToken: queryAction
        };

        return $resource(resourceUrl, defaultResourceParams, actions);
  }]);
})()