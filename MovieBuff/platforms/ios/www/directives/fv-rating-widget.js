//RATING WIDGET
(function(){
	var entityModule = angular.module("entity");

	entityModule.directive('fvRatingWidget', ['$ionicScrollDelegate', function($ionicScrollDelegate) {

		var starImages;
		var wishlistedIndicator;
		var disabledImage = "img/stars/rating-star-disabled.png";
		var normalImage = "img/stars/rating-star-normal.png";
		var selectedImage = "img/stars/rating-star-selected.png";
		var directiveScope;
		var directiveElement;

		function link(scope, element, attrs) {
			directiveScope = scope;
			directiveElement = element;
			scope.$on("entityDetailsReceived", updateWidgetState);
			scope.$on("currentSlideChanged", updateWidgetState);
			scope.$on("addedToWatchlist", updateWidgetState);
			scope.$on("removedFromWatchlist", updateWidgetState);
			scope.$on("entityRated", updateWidgetState);
		}

		//Can be called any time to refresh the visual state of the component.
		function updateWidgetState() {

			//select all star images in this widget.
			if (angular.isDefined(starImages) == false || starImages.length == 0) {
				starImages = directiveElement.find("#stars-list > li > img");
				if (starImages.length == 0)
				{
					alert("Star images length is 0");
				}
				else
				{
					alert("Found them.");
				}
			}

			if (angular.isDefined(wishlistedIndicator) == false)
			{
				wishlistedIndicator = directiveElement.find("#wishlisted-indicator");
			}

			var isOnWishlist = directiveScope.isOnWishlist(directiveScope.currSlideIndex);
			var hasRatingData = angular.isDefined(directiveScope) && directiveScope.hasEntityDetails(directiveScope.currSlideIndex);
			var ratingNumber = -1;
			if (hasRatingData) {
				ratingNumber = directiveScope.getRatingNumber(directiveScope.currSlideIndex);
			}

			if (isOnWishlist == false && ratingNumber > 0) {
				for (var i = 0; i < starImages.length; i++) {

					//Make the 'rated' stars highlighted and the not rated stars not highlighted.
					var isSelected = i < ratingNumber;
					starImages[i].src = isSelected ? selectedImage : normalImage;

					//Animate a 'bounce' for the rated stars
					if (isSelected && TweenMax.isTweening(starImages[i]) == false) {
						var timeline = new TimelineMax();
						timeline.to(starImages[i], .25, {y: -25, delay: 0.1 * i});
						timeline.to(starImages[i], .25, {y: 0, ease: Quad.easeIn});
						timeline.play();
						//TweenMax.to(starImages[i], 0.25, {y: -25, yoyo: true, repeat: 1, delay: 0.1 * i});
					}
				}
			}
			else {
				//Make all the stars disabled. We don't have data yet.
				for (var i = 0; i < starImages.length; i++) {
					starImages[i].src = disabledImage;
				}
			}
		}

		return {
			restrict: 'E',
			templateUrl: "templates/inputs/fv-rating-widget.html",
			link: link
		};
	}]);
})()
	