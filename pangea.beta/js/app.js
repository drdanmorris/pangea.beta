'use strict';


// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', [
  'ngRoute',
  'ngAnimate',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'myApp.controllers',
  'myApp.userControls'
]);

//myApp.run(['$rootScope', '$location', function ($rootScope, $location) {

//}]);


myApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when('/:tab/menu/:subtype/:id', { templateUrl: 'partials/menu.html', controller: 'MenuController' })
        .when('/:tab/menupr/:subtype/:id', { templateUrl: 'partials/menupr.html', controller: 'PriceMenuController' })
        .when('/:tab/account/:subtype/:id', { templateUrl: 'partials/account.html', controller: 'AccountController' })
        .when('/:tab/price/trade/:dref', { templateUrl: 'partials/priceTrade.html', controller: 'PriceTradeController' })
        .otherwise({ redirectTo: '0/menu/usr/0' })
    ;
}]);




