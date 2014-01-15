'use strict';

/* Directives */

var directives = angular.module('myApp.directives', []);

directives.directive('myTradeBanner', function() {
	return {
		restrict: 'E',
		templateUrl: 'partials/myTradeBanner.html'
	};
});

directives.directive('myPanel', function() {
	return {
		restrict: 'E',
		transclude: true,
		templateUrl: 'partials/myPanel.html'
	};
});

directives.directive('myViewBody', function() {
	return {
		restrict: 'E',
		transclude: true,
		templateUrl: 'partials/myViewBody.html'
	};
});

directives.directive('myClear', function() {
	return {
		restrict: 'E',
		link: function(scope, element, attributes) {
			element.html('<div class="clear"></div>');
		}
	};
});

directives.directive('myHello', function() {
	return {
		restrict: 'E',
		// link: function(scope, element, attributes) {
		// 	element.html('<div class="hello">HELLO</div>');
		// 	element.on('click', function() {
		// 		scope.hello();
		// 	});
		// },
		scope: {
			name: '='
		},
		templateUrl: 'partials/myHello.html'
	};
});

directives.directive('myFlexH', function() {
	return {
		restrict: 'E',
		transclude: true,
		templateUrl: 'partials/myFlexH.html'
	};
});

directives.directive('mySellBuyBtn', function() {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'partials/mySellBuyBtn.html'
	};
});

directives.directive('myNumericUpDown', function() {
	return {
		restrict: 'E',
		scope: {
			ctrl: '='
		},
		replace: true,
		link: function(scope, element, attributes) {
			scope.numDown = function() {
		 		console.log('numDown');
		 	}
		},
		templateUrl: 'partials/myNumericUpDown.html'
	};
});

directives.directive('myRow', function() {
	return {
		restrict: 'E',
		transclude: true,
		replace: true,
		templateUrl: 'partials/myRow.html'
	};
});



