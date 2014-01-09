'use strict';

var services = angular.module('myApp.services', []);
services.value('version', '0.1');


services.factory('Config', function () {
    return {
        websocket: {
            url: 'ws://192.168.2.2:8081/',
            reconnectDelayMs: 5000
        }
    };
});

services.factory('SocketService', ['$q', 'Config', '$rootScope',  function ($q, config, $rootScope) {
    var socket = {
        isConnected: false
        , wasConnected: false
        , connecting: false
        , _connection: null
        , sendMsgId: 1  // uid for outgoing messages
        , connectCount: 0  // number of times connection established
        , reconnectCount: 0  // number of concurrent reconnection attempts
        , sendQueue: []
        , incomingMsgCallback: null
        , start: function (incomingMsgCallback) {
            this.incomingMsgCallback = incomingMsgCallback;
            this.reconnect();
        }
        , send: function (msg) {
            this.sendMsgId += 1;
            msg.requestId = this.sendMsgId;
            var queuedMsg = {
                uid: msg.requestId,
                raw: JSON.stringify(msg),
                msg: msg,
                sendCount: 0
            };
            this.sendQueue.push(queuedMsg);
            console.log('sending message' + queuedMsg.raw);
            this.processSendQueue();
        }
        , processSendQueue: function () {
            if (this.isConnected) {
                for (var i = 0; i < this.sendQueue.length; i++) {
                    var queuedMsg = this.sendQueue[i];
                    queuedMsg.sendCount += 1;
                    this._connection.send(queuedMsg.raw);
                }
            }
        }
        , reconnect: function (delayMs) {
            delayMs = delayMs || 0;
            var my = this;
            this.reconnectCount += 1;
            setTimeout(function () {
                my.connect().then(function(conn) {
                    my.processSendQueue();
                });
            }, delayMs)
        }
        , connect: function () {
            this.connecting = true;
            var my = this,
                defer = $q.defer(),
                connection = new WebSocket(config.websocket.url);

            connection.onmessage = function (e) {
                my.onSocketMessage(e.data);
            };
            connection.onopen = function () {
                my.onSocketOpen(defer, connection);
            };
            connection.onclose = function () {
                my.onSocketClose();
            };
            connection.onerror = function (e) {
                my.onSocketError(e);
            };

            return defer.promise;
        }
        , onSocketMessage: function (msg) {
            console.log('incoming message' + msg);  // verbose
            msg = JSON.parse(msg);
            this.processIncomingMessage(msg);
        }
        , onSocketOpen: function (defer, connection) {
            this.isConnected = this.wasConnected = true;
            this._connection = connection;
            this.reconnectCount = 0;
            console.log('socket opened');  // verbose


            connection.send('qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqabcdefghijklmnopqrstuvwxyzhhhhhh');

            defer.resolve(this._connection);
        }
        , onSocketClose: function () {
            this.isConnected = false;
            console.log('socket closed');  // verbose
            var my = this;
            setTimeout(function () {
                my.reconnect(config.websocket.reconnectDelayMs);
            }, 0);
        }
        , onSocketError: function () {
            this.isConnected = false;
            this._connection = null;
            console.log('socket error');  // verbose
            //if (!this.wasConnected) this.reconnect();
        }
        , handleSendReceipt: function (uid) {
            this.removeMessageFromSendQueue(uid);
        }
        , removeMessageFromSendQueue: function (uid) {
            for (var i = 0; i < this.sendQueue.length; i++) {
                var msg = this.sendQueue[i];
                if (msg.uid == uid) {
                    this.sendQueue = this.sendQueue.splice(i, 1);
                    break;
                }
            }
        }
        , processIncomingMessage: function (msg) {
            var uid = msg.responseId || 0;
            if (uid > 0) {
                this.handleSendReceipt(uid);
            }
            
            if (this.incomingMsgCallback && this.incomingMsgCallback(msg)) return;

            $rootScope.$apply(function () {  // do we need to apply ?
                $rootScope.$broadcast('pushIncomingMessage', msg);
            });
        }
    };
    return socket;
}]);


services.factory('PushService', ['$q', 'Config', '$rootScope', 'SocketService', function ($q, config, $rootScope, socket) {
    var push = {
        initialised: false
        , init: function () {
            if (!this.initialised) {
                socket.start(this.handleIncomingMsg.bind(this));
            }
        }
        , handleIncomingMsg: function (msg) {
            if (msg.isInitial) {
                var ref = msg.view.vref;
                var pending = this.pendingSubscriptions[ref];
                if (pending) {
                    pending.defer.resolve(msg.view);
                    this.pendingSubscriptions[ref] = null;
                }
                return true;
            }
            return false;
        }
        , pendingSubscriptions: {}
        , subscribe: function (options) {
            options = angular.extend({ vref: null }, options);
            var ref = options.vref,
                defer = $q.defer(),
                request = angular.extend({ cmd: 'subscribe' }, options);
            this.pendingSubscriptions[ref] = { defer: defer };
            socket.send(request);
            return defer.promise;
        }
    };
    push.init();
    return push;
}]);


services.service('ViewService', ['$rootScope', '$location', function ($rootScope, $location) {
    var Vref = function (raw, tabIndex) {
        var parts = /(?:([\d]+)\/)?([\w\d]+)\/([\w\d]+)\/([\w\d]+)/.exec(raw);
        this.raw = raw;
        this.tab = null;
        this.type = null;
        this.subtype = null;
        this.id = null;
        if (parts.length == 5) {
            this.tab = parts[1] || tabIndex;
            this.type = parts[2];
            this.subtype = parts[3];
            this.id = parts[4];
            this.raw = this.tab + '/' + this.type + '/' + this.subtype + '/' + this.id;
        }
    };

    var Tab = function (options) {
        this.history = [];
        this.id = options.id;
        this.title = options.title;
        this.vref = options.vref;
    };
    Tab.prototype.getVref = function() {
        if (this.history.length > 0) return this.history[this.history.length - 1];
        return this.vref;
    };

    var viewsvc = {
        title: 'title from Svc',
        tabIndex: 0,
        tabs: [
            new Tab({ id: 0, title: 'Watchlists', vref: '0/menu/usr/0' }),
            new Tab({ id: 1, title: 'Browse', vref: '1/menu/home/0' }),
            new Tab({ id: 2, title: 'Account', vref: '2/acct/home/0' }),
            new Tab({ id: 3, title: 'Positions', vref: '3/pos/home/0' }),
            new Tab({ id: 4, title: 'Help', vref: '4/help/home/0' })
        ],
        tab: null,
        backVref: null,
        appClass: 'normal'
    };
    viewsvc.tab = viewsvc.tabs[0];
    viewsvc.getVrefForTab = function (tabIndex) {
        this.tabIndex = tabIndex;
        this.tab = this.tabs[this.tabIndex];
    };
    viewsvc.navigate = function (vref) {
        this.appClass = 'normal';
        this.doNavigate(vref);
    };
    viewsvc.back = function () {
        var vref = this.tab.history.pop();
        this.appClass = 'back';
        this.doNavigate(vref);
    };
    viewsvc.doNavigate = function (vref) {
        if (angular.isString(vref)) vref = new Vref(vref, this.tabIndex);
        this.tab.history.push(this.tab.vref);
        this.tab.vref = vref;
        $location.path(vref.raw);
    };
    
    return viewsvc;

}]);
