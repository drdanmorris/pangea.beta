'use strict';


var push = {

    val: 0,
    cb: null,
    started: false,

    subscribe: function (cb) {
        this.cb = cb;
        this.start();
    },

    start: function() {
        if (this.started) return;
        this.started = true;
        this.update();
    },

    update: function () {
        var my = this;
        setTimeout(function () {
            my.val++;
            if(my.cb) my.cb(my.val);
            my.update();
        }, 1000);
    }

};


var controllers = angular.module('myApp.controllers', []);

controllers.controller('AppController', ['$scope', '$rootScope', 'ViewService', '$location',
    function ($scope, $rootScope, viewsvc, $location) {
        $scope.navigation = viewsvc;

        $scope.onTabSelected = function (idx) {
            viewsvc.tabIndex = idx;
            var tab = $scope.tabs[idx];
            $location.path(tab.vref);
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

        push.subscribe({ vref: vref }).then(function (view) {
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

controllers.controller('PriceTradeController', ['$scope',
    function ($scope) {
        // todo...
    }
]);

