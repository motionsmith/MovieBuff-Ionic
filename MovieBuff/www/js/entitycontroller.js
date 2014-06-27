(function() {
	var app = angular.module('entity', ['ngResource', 'appConfig', 'ngCookies']);

	//These are used to tell the server what a user rated a Movie.
	//Unfortunately we don't have a numeric rating system, so these are ordered worst to best,
	//with the first rating indicating the user hasn't rated it.
	app.ratings = ["not_rated", "worstever", "blech", "meh", "fayve", "alltimefayve"];

	//ENTITY CONTROLLER
	app.controller('EntityController', ['$http', '$log', '$ionicScrollDelegate', '$ionicSlideBoxDelegate', '$scope', 'Entity', 'EntityGroup', '$cookies', 'UserStatus',	'Tag',
		function($http, $log, $ionicScrollDelegate, $ionicSlideBoxDelegate, $scope, Entity, EntityGroup, $cookies, UserStatus, Tag) {
		
		$scope.currSlideIndex = 0;
		$scope.entityDetails = [];
		$scope.picks = EntityGroup.query({preset: 'channels', result: '2e220d38b62937d267ae7695ef69befe', group: 'my-watchlist'}, function() {
			$ionicSlideBoxDelegate.update();
			refreshDetails();
			requestCurrEntityDetails();
		});

		/*$scope.status = UserStatus.query(null ,function() {
			console.log($scope.status.data);
		});*/

		/* Returns true if we should show the trailer panel. */
		$scope.supportsTrailerPanel = function() {
			return $scope.trailerImage;
		};

		/* Returns true if we should show the synopsis panel. */
		$scope.supportsSynopsisPanel = function() {
			return $scope.synopsisDescription;
		};

		/* Returns true if we should show the services panel. */
		/*$scope.supportsServicesPanel = function() {
			return true;
		}*/

		/* Returns true if we should show the cast and crew panel. */
		/*$scope.supportsCastAndCrewPanel = function() {
			return angular.isDefined($scope.entity.participantGroups) && $scope.entity.participantGroups.length > 0;
		}*/

		$scope.handleSlideChanged = function($index) {
			
			//Store which slide we are on, from the DOM's perspective (not a data-perspective)
			$scope.currSlideIndex = $index;

			refreshDetails();

			//Automatically scrolls the user back to the top so that they can see the poster.
			$ionicScrollDelegate.scrollTop(true);

			requestCurrEntityDetails();

			$scope.$broadcast("currentSlideChanged");
		};

		//Adds the movie to the wishlist or removes it.
		$scope.toggleWishlist = function() {

			//Cannot toggle the wishlist if we don't know whether this movie is already on it.
			if (hasEntityDetails == false) { return; }

			if (isOnWishlist($scope.currSlideIndex) == false) {
				addToWishlist($scope.currSlideIndex);
			}
			else {
				removeFromWishlist($scope.currSlideIndex);
			}
		};

		//Rate a movie, updating the local data and remote data.
		$scope.rate = function(rating) {
			var entityDetails = getEntityDetails($scope.currSlideIndex);
			var ratingString = angular.isNumber(rating) ? app.ratings[rating] : rating;

			//Update the cache
			if (angular.isDefined(entityDetails)) {
				entityDetails.data.my_rating.id = ratingString;
			}

			//Update the MW
			Tag.post({
				uri: entityDetails.data.uri,
				tag_label: ratingString
			});
		};

		//Updates ui-bound variables so that the UI can sync with the data.
		function refreshDetails() {

			var i = $scope.currSlideIndex;

			$scope.trailerImage = getTrailerImage(i);
			$scope.synopsisDescription = getSynopsisDescription(i);
		}


		//Request add'l details about this entity (if we don't already have them).
		function requestCurrEntityDetails() {

			var currEntityUri = $scope.picks.data[$scope.currSlideIndex].uri;
			var slideIndexAtRequestTime = $scope.currSlideIndex;

			//Request detailed data about the current entity, only if we haven't already done so.
			if (hasEntityDetails($scope.currSlideIndex) == false) {
				$scope.entityDetails[currEntityUri] = Entity.query({uri: currEntityUri}, function() {

					if ($scope.currSlideIndex == slideIndexAtRequestTime) {
						refreshDetails();
						$scope.$emit("entityDetailsReceived");
					}
				});
			}
		}

		//Returns the best possible trailer image based on the state of the client-server communication.
		function getTrailerImage(slideIndex) {

			var entityDetails = $scope.entityDetails[$scope.picks.data[slideIndex].uri];
			if (angular.isDefined(entityDetails) &&
				angular.isDefined(entityDetails.data) &&
				angular.isDefined(entityDetails.data.trailers) &&
				angular.isDefined(entityDetails.data.trailers[0]))
			{
				return entityDetails.data.trailers[0].thumbnail;
			}
			return "";
		}

		//Returns the best possible synopsis description based on the state of the client-server communication.
		function getSynopsisDescription(slideIndex) {

			var entityDetails = $scope.entityDetails[$scope.picks.data[slideIndex].uri];
			if (angular.isDefined(entityDetails) &&
				angular.isDefined(entityDetails.data) &&
				angular.isDefined(entityDetails.data.description))
			{
				return entityDetails.data.description;
			}
			else
			{
				return $scope.picks.data[slideIndex].short_description;
			}
		}

		//Returns true if entity details have been downloaded for the provdided slide.
		function hasEntityDetails(slideIndex) {
			var currEntityDetails = getEntityDetails(slideIndex);

			return angular.isDefined(currEntityDetails);
		}

		//Retuns whether or not the provided slide is on the wishlist.
		function isOnWishlist(slideIndex) {
			var currEntityDetails = getEntityDetails(slideIndex);

			return currEntityDetails.data.tag && currEntityDetails.data.tag.Wishlist == "Wishlist";
		}

		//Adds the slide to the wishlist (even if it is already on it).
		function addToWishlist(slideIndex) {
			var currEntityDetails = getEntityDetails(slideIndex);

			//Update the cache
			currEntityDetails.data.tag.Wishlist = "Wishlist";

			//Update the MW
			Tag.post({
				uri: currEntityDetails.data.uri,
				tag_label: "Wishlist"
			});

			//angular event dispatch
			$scope.$emit("addedToWatchlist", currEntityDetails);
		}

		//Removes the movie from the wishlist (even if it isn't on it already).
		function removeFromWishlist(slideIndex) {
			var currEntityDetails = getEntityDetails(slideIndex);

			//Update the cache
			currEntityDetails.data.tag.Wishlist = null;

			//Update the MW
			Tag.delete({
				uri: currEntityDetails.data.uri,
				tag_label: "Wishlist"
			});
		}

		//Uses the slide index to get the entity details.
		function getEntityDetails(slideIndex) {
			var currEntityUri = $scope.picks.data[slideIndex].uri;
			return $scope.entityDetails[currEntityUri];
		}
	}]);

	//TRAILER PANEL
	app.directive('fvTrailerPanel', function() {

		return {
			restrict: 'E',
			scope: {
				entity: '='
			},
			templateUrl: "templates/panels/fv-trailer-panel.html"
		};
	});

	//SYNOPSIS PANEL
	app.directive('fvSynopsisPanel', function() {
		return {
			restrict: 'E',
			scope: {
				entity: '='
			},
			templateUrl: "templates/panels/fv-synopsis-panel.html"
		};
	});

	app.directive('fvAddToWatchlist', function() {
		function link(scope, element, attrs) {
			element.css({visibility: 'hidden'});

			//Listen for something being added to the watchlist.
			scope.$on("addedToWatchlist", function() {
				var timeline = new TimelineMax();
				timeline.fromTo(element, .5, {autoAlpha: 0, scaleX: 0}, {autoAlpha: 1, scaleX: 1});
				timeline.to(element, .5, {autoAlpha: 0}, "+=0.75");
				timeline.play();

			});
		}

		return {
			restrict: 'E',
			templateUrl: "templates/fv-add-to-watchlist.html",
			link: link
		};
	});


})()