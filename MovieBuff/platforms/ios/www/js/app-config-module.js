(function() {
	var appModule = angular.module('appConfig', []);

	appModule.factory('apiUrl', function() {
		return "http://minion.fayve.com/api/";
		//return "http://www.fayve.com/api/";
	});
})()