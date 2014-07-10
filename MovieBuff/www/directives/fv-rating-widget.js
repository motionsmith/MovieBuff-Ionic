//RATING WIDGET
(function(){
	var entityModule = angular.module("entity");

	entityModule.directive('fvRatingWidget', ['$ionicScrollDelegate', function($ionicScrollDelegate) {

		var starImages;
		var disabledImage = "img/stars/rating-star-disabled.png";
		var normalImage = "img/stars/rating-star-normal.png";
		var selectedImage = "img/stars/rating-star-selected.png";
		var directiveScope;
		var directiveElement;
		var ratingLoadingContainer;
		var ratingLoadingSpinner;

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
				starImages = jQuery(".star-image");
			}

			//Select the container that we'll put the loading spinner in.
			if (angular.isDefined(ratingLoadingContainer) == false) {
				ratingLoadingContainer = jQuery("#rating-loading-container")[0];
				var spinnerOptions = {
					lines: 7, // The number of lines to draw
					length: 6, // The length of each line
					width: 6, // The line thickness
					radius: 10, // The radius of the inner circle
					corners: 1, // Corner roundness (0..1)
					rotate: 0, // The rotation offset
					direction: 1, // 1: clockwise, -1: counterclockwise
					color: '#fff', // #rgb or #rrggbb or array of colors
					speed: 1.5, // Rounds per second
					trail: 24, // Afterglow percentage
					shadow: false, // Whether to render a shadow
					hwaccel: true, // Whether to use hardware acceleration
					className: 'spinner', // The CSS class to assign to the spinner
					zIndex: 1, // The z-index (defaults to 2000000000)
					top: '50%', // Top position relative toå parent
					left: '50%' // Left position relative to parent
				};
				ratingLoadingSpinner = new Spinner(spinnerOptions);
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
					}
				}
			}
			else {
				for (var i = 0; i < starImages.length; i++) {
					starImages[i].src = disabledImage;
				}
			}

			//Start or stop the spinner
			if (directiveScope.hasEntityDetails(directiveScope.currSlideIndex)) {
				ratingLoadingSpinner.stop();
			}
			else {
				ratingLoadingSpinner.spin(ratingLoadingContainer);
			}
		}

		return {
			restrict: 'E',
			templateUrl: "templates/inputs/fv-rating-widget.html",
			link: link
		};
	}]);
})()
	