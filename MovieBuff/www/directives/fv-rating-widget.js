//RATING WIDGET
(function(){
	var entityModule = angular.module("entity");

	entityModule.directive('fvRatingWidget', ['$ionicScrollDelegate', function($ionicScrollDelegate) {

		var directiveScope;
		var directiveElement;
		var buttons;
		var revertButton;
		var ratingLoadingSpinner;
		var posterOverlay;

		function link(scope, element, attrs) {
			directiveScope = scope;
			directiveElement = element;

			var windowWidth = $(window).width();
			var windowHeight = $(window).height();
			element.find("#rating-widget").css('top', windowHeight - 130);
			
			buttons = [
			{
				element: jQuery("#ignore-button")[0],
				x: windowWidth * 0.2 - 24,
				disposition: "ignore"
			},
			{
				element: jQuery("#dislike-button")[0],
				x: windowWidth * 0.4 - 24,
				disposition: "dislike"
			},
			{
				element: jQuery("#like-button")[0],
				x: windowWidth * 0.6 - 24,
				disposition: "like"
			},
			{
				element: jQuery('#save-button')[0],
				x: windowWidth * 0.8 - 24,
				disposition: "watchlist"
			}];

			//Initial position of all the buttons
			for (var i = 0; i < buttons.length; i++) {
				TweenMax.set(buttons[i].element, {x: buttons[i].x, autoAlpha: 0});
			}

			revertButton = jQuery("#revert-button");
			TweenMax.set(revertButton, {x: windowWidth/2 - 24, autoAlpha: 0});

			posterOverlay = jQuery("#poster-overlay");
			TweenMax.set(posterOverlay, {autoAlpha: 0, height: windowHeight - 43});

			/*var spinnerOptions = {
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
			ratingLoadingSpinner = new Spinner(spinnerOptions);*/

			scope.$on("entityDetailsReceived", updateDisposition);
			scope.$on("currentSlideChanged", updateDisposition);
            scope.$on("entityDispositionChanged", updateDisposition);
		}

		//Can be called any time to update the visual state of the disposition icons.
		function updateDisposition(event, entityDetails) {
			var currDisposition = directiveScope.getDisposition();

			//Tween the action buttons
			var windowWidth = $(window).width();
			for (var i = 0; i < buttons.length; i++) {
				var tweenProperties = {};

				//This is the tween that occurs if the icon is selected
				if (buttons[i].disposition == currDisposition) {
					tweenProperties = {
						x: windowWidth/2 - 24,
						y: -250,
						scale: 4,
						autoAlpha: 1,
						ease: Back.easeOut,
					};
					$(buttons[i].element).css("pointer-events", "none");
				}
				//Otherwise, we use this tween.
				else {
					tweenProperties = {
						x: buttons[i].x,
						scale: 1,
						y: 0,
						autoAlpha: .9
					};
					if (currDisposition != "") {
						tweenProperties.y = 75;
						tweenProperties.autoAlpha = 0;
					}
					$(buttons[i].element).css("pointer-events", "inherit");
				}
				TweenMax.to(buttons[i].element, 0.38, tweenProperties);
			}

			//Tween the revert button
			var revertButtonTween = {};
			if (currDisposition != "" && currDisposition != "?") {
				revertButtonTween = {
					y: 0,
					autoAlpha: 0.9
				};
			}
			else
			{
				revertButtonTween = {
					y: 75,
					autoAlpha: 0
				};
			}
			TweenMax.to(revertButton, 0.38, revertButtonTween);

			//Tween the poster overlay
			var posterOverlayTween = {};
			if (currDisposition == "" || currDisposition == "?") {
				TweenMax.to(posterOverlay, 0.38, {autoAlpha: 0});
			}
			else {
				TweenMax.to(posterOverlay, 0.38, {autoAlpha: 0.5});
			}
			
		}

		return {
			restrict: 'E',
			templateUrl: "templates/inputs/fv-rating-widget.html",
			link: link
		};
	}]);
})()
	