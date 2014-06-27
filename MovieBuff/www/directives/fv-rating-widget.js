//RATING WIDGET
(function(){
	var entityModule = angular.module("entity");

	entityModule.directive('fvRatingWidget', ['$ionicScrollDelegate', function($ionicScrollDelegate) {

		function link(scope, element, attrs) {

			updateWidgetState();	
			scope.$on("entityDetailsReceived", updateWidgetState);
			scope.$on("currentSlideChanged", updateWidgetState);
		}

		//Can be called any time to refresh the visual state of the component.
		function updateWidgetState() {
			console.log("Update rating widget state.");
		}

		return {
			restrict: 'E',
			templateUrl: "templates/inputs/fv-rating-widget.html",
			link: link
		};
	}]);
})()
	