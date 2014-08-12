(function() {
	var entityModule = angular.module("entity");

	entityModule.directive("fvPoster", [function() {
		
		function link(scope, element, attrs) {
			var window_height = $(window).height();
            var posterElement = jQuery('.poster');
			posterElement.css('height', window_height - 43);

			//Make the poster "fall" like it's being thrown away.
			/*var posterImage = element.find("img");
			TweenMax.to(posterImage, 0.5, {y: 600, rotation: 25, onComplete: function() {
				TweenMax.set(posterImage, {y: 0, rotation: 0});
			}});*/
            
            scope.$on("entityDispositionChanged", function(event, entityDetails) {
                if (entityDetails.data.hasDisposition && posterElement.hasClass("poster-dim") == false) {
                    posterElement.addClass("poster-dim");
                }
                else if (entityDetails.data.hasDisposition == false && posterElement.hasClass("poster-dim")) {
                    posterElement.removeClass("poster-dim");
                }
            });
		}

		return {
			restrict: "E",
			templateUrl: "templates/fv-poster.html",
			scope: {
				entity: '='
			},
			link: link
		};
	}]);
})()