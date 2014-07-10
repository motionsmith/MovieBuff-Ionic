(function() {
	var entityModule = angular.module("entity");

	entityModule.directive("fvPoster", [function() {
		
		function link(scope, element, attrs) {
			var window_height = $(window).height();
			jQuery('.poster').css('height', window_height - 43);
			jQuery('#rating-widget').css('top', window_height - 125);

			scope.$on("entityDismissed", function(event, entityDetails) {
				if (scope.entity.uri != entityDetails.data.uri) {
					return;
				}
				
				//Make the poster "fall" like it's being thrown away.
				var posterImage = element.find("img");
				TweenMax.to(posterImage, 0.5, {y: 600, rotation: 25, onComplete: function() {
					TweenMax.set(posterImage, {y: 0, rotation: 0});
				}});
			});
		}

		return {
			restrict: "E",
			templateUrl: "templates/fv-poster.html",
			scope: {
				entity: '=',
				fvClick: '&'
			},
			link: link
		};
	}]);
})()