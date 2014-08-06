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
			/*if (oldIndex < $index) {
				$scope.ignore(86400);
			}*/

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

		/*$scope.getRatingNumber = function(slideIndex) {
			var entityDetails = getEntityDetails(slideIndex);
			if (angular.isDefined(entityDetails) == false || entityDetails.$resolved == false) {
				return -1;
			}

			if (angular.isDefined(entityDetails.data.my_rating) == false) {
				return 0;
			}

			return app.ratings.indexOf(entityDetails.data.my_rating.id);
		};*/

		//Returns true if entity details have been downloaded for the provdided slide.
		$scope.hasEntityDetails = function(slideIndex) {
			var currEntityDetails = getEntityDetails(slideIndex);

			return angular.isDefined(currEntityDetails) && currEntityDetails.$resolved;
		}

		$scope.ignore = function(ttl) {
			if ($scope.hasEntityDetails($scope.currSlideIndex) == false) {
				return;
			}

			var entityDetails = getEntityDetails($scope.currSlideIndex);

			//Tell the middleware to ignore
			Tag.post({
				uri: entityDetails.data.uri,
				tag_label: "ignore",
				ttl: ttl
			}, function(result) {
				console.log(result);
			});
		}

        // "?", "", "dislike", "like", "ignore", "watchlist"
        $scope.getDisposition = function() {

        	//If we don't have entity details yet, return unknown.
        	if ($scope.hasEntityDetails($scope.currSlideIndex) == false) {
        		return "?";
        	}

        	var entityDetails = getEntityDetails($scope.currSlideIndex);

        	//Is it watchlisted?
			if (entityDetails.data.tag && entityDetails.data.tag.Wishlist == "Wishlist") {
				return "watchlist";
			}

        	 //Do we have a rating?
            if (entityDetails.data.my_rating) {
            	//Return our own special disposition enum based on what the data says
            	switch (entityDetails.data.my_rating.id) {
            		case "not_rated":
            			return "";
            		case "worstever":
            		case "blech":
            		case "meh":
            			return "dislike";
            		case "fayve":
            		case "alltimefayve":
            			return "like";
            		case "notinterested":
            			return "ignore";
            	}
            }

        	return "";
        }

        //"", dislike", "like", "ignore", "watchlist"
        $scope.setDisposition = function(newDisposition) {

        	//Can't set disposition until we have details.
        	if ($scope.hasEntityDetails($scope.currSlideIndex) == false) {
        		throw {message: "Cannot set disposition before entity details have been obtained."};
        	}

        	//Make sure the disposition is actually changing.
        	var oldDisposition = $scope.getDisposition();
        	if (newDisposition == oldDisposition) {
        		return;
        	}

        	var entityDetails = getEntityDetails($scope.currSlideIndex);

        	//Update watchlist state
        	if (newDisposition == "watchlist") {
        		//Add to watchlist
				entityDetails.data.tag = { Wishlist: "Wishlist" };

				//Update the MW
				Tag.post({
					uri: entityDetails.data.uri,
					tag_label: "Wishlist"
				});
        	}
        	else if (oldDisposition == "watchlist")
        	{
        		//Remove from watchlist
    			entityDetails.data.tag = null;

    			//Update the MW
				Tag.delete({
					uri: entityDetails.data.uri,
					tag_label: "Wishlist"
				});
        	}

        	//Update rating locally
        	switch (newDisposition) {
        		case "":
        		case "watchlist":
        			//Remove rating
        			entityDetails.data.my_rating = {id: "not_rated"};
        			break;
        		case "dislike":
        			entityDetails.data.my_rating = {id: "worstever"};
        			break;
        		case "like":
        			entityDetails.data.my_rating = {id: "alltimefayve"};
        			break;
        		case "ignore":
        			entityDetails.data.my_rating = {id: "notinterested"};
        			break;
        		default:
        			throw {message: "Don't understand disposition " + newDisposition};
        	}

        	//Update the rating on MW
        	if (entityDetails.data.my_rating) {
				Tag.post({
					uri: entityDetails.data.uri,
					tag_label: entityDetails.data.my_rating.id
				});
			}

			$scope.$broadcast("entityDispositionChanged", entityDetails);
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

					$scope.entityDetails[currEntityUri].disposition
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