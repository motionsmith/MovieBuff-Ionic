(function() {
	var app = angular.module('entity', ['ngResource', 'appConfig', 'ngStorage', 'ngCookies']);

	//These are used to tell the server what a user rated a Movie.
	//Unfortunately we don't have a numeric rating system, so these are ordered worst to best,
	//with the first rating indicating the user hasn't rated it.
	app.ratings = ["not_rated", "worstever", "blech", "meh", "fayve", "alltimefayve"];

	//ENTITY CONTROLLER
	app.controller('EntityController', ['$http', '$log', '$ionicScrollDelegate', '$ionicSlideBoxDelegate', '$scope', 'Entity', 'EntityGroup', 'UserStatus',	'Tag', '$timeout', 'FilterGroups', 'Recommendations',
		function($http, $log, $ionicScrollDelegate, $ionicSlideBoxDelegate, $scope, Entity, EntityGroup, UserStatus, Tag, $timeout, FilterGroups, Recommendations) {
		
		var nextSlideTimoutPromise;
		$scope.currSlideIndex = 0;
		$scope.entityDetails = [];

		//Grab the list of movie recommendations from the MW
		$scope.picks = Recommendations.query({}, handleGetPicksResponse, handleGetPicksError);

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
			
			var oldIndex = $scope.currSlideIndex;

			//Tell the middleware that we've "seen" this slide
			if (oldIndex < $index) {
				$scope.setSeen(oldIndex);
			}

			//Store which slide we are on, from the DOM's perspective (not a data-perspective)
			$scope.currSlideIndex = $index;

			refreshDetails();

			//Automatically scrolls the user back to the top so that they can see the poster.
			$ionicScrollDelegate.scrollTop(true);

			requestCurrEntityDetails();

			$scope.$broadcast("currentSlideChanged");

			//Cancel a move to the next slide if there is one on a timer.
			if (angular.isDefined(nextSlideTimoutPromise)) {
				$timeout.cancel(nextSlideTimoutPromise);
			}
		};

		//Adds the movie to the wishlist or removes it.
		$scope.toggleWishlist = function() {

			//Cannot toggle the wishlist if we don't know whether this movie is already on it.
			if ($scope.hasEntityDetails($scope.currSlideIndex) == false) { return; }

			if ($scope.isOnWishlist($scope.currSlideIndex) == false) {
				$scope.addToWishlist();
			}
			else {
				$scope.removeFromWishlist();
			}
		};

		//Rate a movie, updating the local data and remote data.
		$scope.rate = function(rating) {
			//Cancel a move to the next slide if there is one on a timer.
			if (angular.isDefined(nextSlideTimoutPromise)) {
				$timeout.cancel(nextSlideTimoutPromise);
			}
			
			var entityDetails = getEntityDetails($scope.currSlideIndex);
			var ratingString = angular.isNumber(rating) ? app.ratings[rating] : rating;
			var ratingNumber = app.ratings.indexOf(ratingString);

			if (angular.isDefined(entityDetails)) {

				//Update the cache
				entityDetails.data.my_rating = {
						id: ratingString
				};

				//Update the MW
				Tag.post({
					uri: entityDetails.data.uri,
					tag_label: ratingString
				});

				//Move to the next slide.
				//TODO Move this into a directive?
				if (ratingNumber > 0) {
					nextSlideTimoutPromise = $timeout(function() {
						$ionicSlideBoxDelegate.next();
					}, 500 + (100 * ratingNumber));
				}

				$scope.$broadcast("entityRated", entityDetails);
			}
		};

		$scope.removeEntityAt = function(slideIndex) {
			
		}

		$scope.setSeen = function() {
			var entityDetails = getEntityDetails($scope.currSlideIndex);

			//Update the MW
		}

		$scope.getRatingNumber = function(slideIndex) {
			var entityDetails = getEntityDetails(slideIndex);
			if (angular.isDefined(entityDetails) == false || entityDetails.$resolved == false) {
				return -1;
			}

			if (angular.isDefined(entityDetails.data.my_rating) == false) {
				return 0;
			}

			return app.ratings.indexOf(entityDetails.data.my_rating.id);
		};

		//Returns true if entity details have been downloaded for the provdided slide.
		$scope.hasEntityDetails = function(slideIndex) {
			var currEntityDetails = getEntityDetails(slideIndex);

			return angular.isDefined(currEntityDetails) && currEntityDetails.$resolved;
		}

		$scope.setNotInterested = function (isNotInterested) {

			//Cancel a move to the next slide if there is one on a timer.
			if (angular.isDefined(nextSlideTimoutPromise)) {
				$timeout.cancel(nextSlideTimoutPromise);
			}

			var entityDetails = getEntityDetails($scope.currSlideIndex);

			//Update the cache
			entityDetails.data.my_rating = {
					id: "notinterested"
			};

			//Update the MW
			Tag.post({
				uri: entityDetails.data.uri,
				tag_label: "notinterested"
			});

			//Move to the next slide.
			if (isNotInterested) {
				nextSlideTimoutPromise = $timeout(function() {
					$ionicSlideBoxDelegate.next();
				}, 200);
			}

			/*$timeout(function() {
				$scope.picks.data.splice($ionicSlideBoxDelegate.currentIndex() - 1, 1);
				$ionicSlideBoxDelegate.update();
				$timeout(function() {
					$ionicSlideBoxDelegate.slide($ionicSlideBoxDelegate.currentIndex() - 1, 1);
				}, 1);
			}, 500);*/

			$scope.$broadcast("entityDismissed", entityDetails);
			$scope.$broadcast('scroll.refreshComplete');
		}

		$scope.isNotInterested = function(slideIndex) {
			if ($scope.hasEntityDetails(slideIndex) == false) {
				return false;
			}

			var currEntityDetails = getEntityDetails(slideIndex);
			return angular.isDefined(currEntityDetails.data.my_rating) && currEntityDetails.data.my_rating.id == "notinterested";;
		}

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
			if ($scope.hasEntityDetails($scope.currSlideIndex) == false) {
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

			try {
				var entityDetails = $scope.entityDetails[$scope.picks.data[slideIndex].uri];
			} catch (e) {
				throw { name: "9393939", message: "could not get picks entity summary for index " + slideIndex };
			}
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

		//Retuns whether or not the provided slide is on the wishlist.
		$scope.isOnWishlist = function(slideIndex) {
			if ($scope.hasEntityDetails(slideIndex) == false) {
				return false;
			}

			var currEntityDetails = getEntityDetails(slideIndex);
			return angular.isDefined(currEntityDetails.data.tag) && currEntityDetails.data.tag.Wishlist == "Wishlist";
		}

		//Adds the slide to the wishlist (even if it is already on it).
		$scope.addToWishlist = function() {
			if ($scope.isOnWishlist($scope.currSlideIndex)) {
				return;
			}

			//Cancel a move to the next slide if there is one on a timer.
			if (angular.isDefined(nextSlideTimoutPromise)) {
				$timeout.cancel(nextSlideTimoutPromise);
			}

			var currEntityDetails = getEntityDetails($scope.currSlideIndex);

			//Update the cache
			currEntityDetails.data.tag = {
				Wishlist: "Wishlist"
			};

			//Update the MW
			Tag.post({
				uri: currEntityDetails.data.uri,
				tag_label: "Wishlist"
			});

			$scope.$emit("addedToWatchlist", currEntityDetails);

			nextSlideTimoutPromise = $timeout(function() {
					$ionicSlideBoxDelegate.next();
				}, 700);
		}

		//Removes the movie from the wishlist (even if it isn't on it already).
		$scope.removeFromWishlist = function() {
			if ($scope.isOnWishlist($scope.currSlideIndex) == false) {
				return;
			}

			var currEntityDetails = getEntityDetails($scope.currSlideIndex);

			//Update the cache
			currEntityDetails.data.tag.Wishlist = null;

			//Update the MW
			Tag.delete({
				uri: currEntityDetails.data.uri,
				tag_label: "Wishlist"
			});

			$scope.$emit("removedFromWatchlist", currEntityDetails);
		}

		//Uses the slide index to get the entity details.
		function getEntityDetails(slideIndex) {
			if ($scope.picks.data && $scope.picks.data.length > 0) {
				var currEntityUri = $scope.picks.data[slideIndex].uri;
				return $scope.entityDetails[currEntityUri];
			}
		}

		function handleGetPicksResponse(result) {
			if (result.status.code != 200) {
				$scope.hasContent = false;
				$scope.noContentMessage = "Whoops, there's a problem. It's a \"" + result.status.code + " " + result.status.message + "\". Try logging out and back in.";
			} 
			else if (angular.isDefined($scope.picks.data) == false || $scope.picks.data.length <= 0) {
				$scope.hasContent = false;
				$scope.noContentMessage = "Whoops! No movies to recommend. Try coming back later.";
			}
			else {
				$scope.hasContent = true;
				$ionicSlideBoxDelegate.update();
				refreshDetails();
				requestCurrEntityDetails();
			}
		}

		function handleGetPicksError(error) {
			$scope.hasContent = false;
			$scope.noContentMessage = "Whoops, there's a problem. Technically, it's \"" + error + "\". Try logging out and back in; Or try again later.";
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
			var image = element.find("img");
			//Listen for something being added to the watchlist.
			scope.$on("addedToWatchlist", function() {
				element.css({visibility: 'visible'});
				var timeline = new TimelineMax({onComplete: function() { element.css({visibility: 'hidden'}) }});
				timeline.fromTo(image, .5, {autoAlpha: 0, scaleX: 0, scaleY: 0, ease: Power2.easeOut}, {autoAlpha: .75, scaleX: 1, scaleY: 1, ease: Back.easeOut});
				timeline.to(image, .3, {autoAlpha: 0, scaleX: 0, scaleY: 0, ease: Back.easeIn}, "+=0.2");
				timeline.play();
			});

			scope.$on("removedFromWatchlist", function() {
				element.css({visibility: 'hidden'});
			})
		}

		return {
			restrict: 'E',
			templateUrl: "templates/fv-add-to-watchlist.html",
			link: link
		};
	});


})()