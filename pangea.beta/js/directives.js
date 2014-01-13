'use strict';

/* Directives */

var directives = angular.module('myApp.directives', []);

directives.directive('tradeBanner', function() {
	return {
		restrict: 'E',
		templateUrl: 'partials/tradeBanner.html'
	};
});

// directives.directive('panel', function(scope, element, attributes) {
// 	return {
// 		restrict: 'E',
// 		link: 
// 	};
// });



