(function() {
	var appModule = angular.module('appConfig', []);

	appModule.factory('apiUrl', function() {
		return "http://www.fayve.com/api/";
	});
})()