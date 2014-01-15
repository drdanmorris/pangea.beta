'use strict';

var controllers = angular.module('myApp.controllers', []);

controllers.controller('AppController', ['$scope', '$rootScope', 'ViewService', '$location',
    function ($scope, $rootScope, viewsvc, $location) {
        $scope.navigation = viewsvc;

        $scope.onTabSelected = function (idx) {
            viewsvc.navigateTab(idx);
        }
    }

]);


controllers.controller('MenuController', ['$scope', '$routeParams', 'ViewService', 'PushService',
    function ($scope, $routeParams, viewsvc, push) {
        $scope.navigation = viewsvc;
        var vref = 'menu/' + $routeParams.subtype + '/' + $routeParams.id;

        push.subscribe({ vref: vref }).then(function (view) {
            $scope.menu = view.items;
            viewsvc.title = view.title;
            //alert('two');
        });

        //alert('one');
    }
]);

controllers.controller('PriceMenuController', ['$scope', '$rootScope', '$routeParams', 'ViewService', 'PushService',
    function ($scope, $rootScope, $routeParams, viewsvc, push) {

        $scope.menu = [];
        $scope.loading = true;
        $scope.navigation = viewsvc;
        var vref = 'menupr/' + $routeParams.subtype + '/' + $routeParams.id;
        var scopeDrefIndex = {};
        var first = true;

        var onUpdate = function(msg) {
            var item = scopeDrefIndex[msg.dref];
            item.a = msg.a;
            item.b = msg.b;

            if(first) {
                applyUpdates();
                first = false;
            }

        };

        var applyUpdates = function() {
            $scope.$apply();
            setTimeout(applyUpdates, 1000);
        };

        push.subscribe({ vref:vref, delegate:onUpdate }).then(function (view) {
            
            // create dref index to aid later scope updating
            for(var i = 0; i < view.items.length; i++){
                var item = view.items[i];
                scopeDrefIndex[item.dref] = item;

                // also, apply menu-level navigate vref
                if(!item.navigateVref)
                    item.navigateVref = view.navigateVref + item.dref;
            }

            $scope.menu = view.items;
            viewsvc.title = view.title;
            $scope.loading = false;
        });

    }
]);


controllers.controller('AccountController', ['$scope',
    function ($scope) {
        // todo...
    }
]);



controllers.controller('PriceTradeController', ['$scope', '$rootScope', '$routeParams', 'ViewService', 'PushService',
    function ($scope, $rootScope, $routeParams, viewsvc, push) {
        var vref = 'price/trade/'+ $routeParams.dref,
            viewdata = null  // set from push result
        ;
        var onUpdate = function(msg) {
            $scope.a = splitPriceMajorMinor(msg.a);
            $scope.b = splitPriceMajorMinor(msg.b);
            updateTradeInfo(true);
        };

        var splitPriceMajorMinor = function(price) {
            var parts = price.split('.');
            return {
                major: parts[0],
                minor: parts[1],
                raw: price,
                value: parseFloat(price)
            };
        };

        var updateTradeInfo = function(apply) {
            $scope.bStop = $scope.b.value + $scope.stopUpDownCtrl.value;
            $scope.aStop = $scope.a.value + $scope.stopUpDownCtrl.value;
            if(apply) $scope.$apply();
        };

        $scope.navigation = viewsvc;
        $scope.loading = true;


        $scope.sizeUpDownCtrl = {
            value: 0,
            downEnabled: false,
            upEnabled: true,
            title:'Size',
            up: function() {
                this.value += 10;
                this.downEnabled = true;
            },
            down: function() {
                if(this.value > 0) {
                    this.value -= 10;
                    if(this.value == 0) this.downEnabled = false;
                }
            }
        };

        $scope.stopUpDownCtrl = {
            value: 0,
            downEnabled: false,
            upEnabled: true,
            title:'Stop',
            up: function() {
                this.value += 10;
                this.downEnabled = true;
                updateTradeInfo(true);
            },
            down: function() {
                if(this.value > 0) {
                    this.value -= 10;
                    if(this.value == 0) this.downEnabled = false;
                    updateTradeInfo(true);
                }
            }
        };

        push.subscribe({ vref:vref, delegate:onUpdate }).then(function (view) {
            viewdata = view;
            $scope.title = view.item.title;
            $scope.a = splitPriceMajorMinor(view.item.a);
            $scope.b = splitPriceMajorMinor(view.item.b);
            $scope.icon1 = view.icon1;
            $scope.icon2 = view.icon2;
            viewsvc.title = "Trade";
            $scope.loading = false;
            updateTradeInfo();
        });



        
    }
]);

