'use strict';

/* Directives */

var directives = angular.module('myApp.directives', []);

directives.directive('myTradeBanner', function() {
	return {
		restrict: 'E',
		replace: true,
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

directives.directive('mySwitch', function() {
	return {
		restrict: 'E',
		scope: {
			ctrl: '='
		},
		replace: true,
		templateUrl: 'partials/mySwitch.html',
		link: function(scope, element, attributes) {
			element.on('click', function() {
				scope.ctrl.position = (scope.ctrl.position === 'on' ? 'off' : 'on');
				scope.$apply();
			})
		}
	};
});

directives.directive('myNumericUpDown', function() {
	return {
		restrict: 'E',
		scope: {
			ctrl: '='
		},
		replace: true,
		templateUrl: 'partials/myNumericUpDown.html'
	};
});

directives.directive('myLevelAmount', function() {
	return {
		restrict: 'E',
		scope: {
			ctrl: '='
		},
		replace: true,
		templateUrl: 'partials/myLevelAmount.html'
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

directives.directive('myTabBar', function() {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'partials/ios/myTabBar.html'
	};
});

directives.directive('myToolBar', function() {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'partials/ios/myToolBar.html'
	};
});



