"use strict";
angular.module("base_modular", [
    "ngAnimate",
    "ui.router",
    "oc.lazyLoad",
    "angular-loading-bar",
    "ui.bootstrap",
    "angular-growl"
]);

var bravo_bls = angular.module("bravo_bls", ["base_modular", "bls_service", "bls_filter", "bls_directive"]);

bravo_bls.run(["$rootScope", "$state", "$stateParams", "bls_api", "$http",
    function($rootScope, $state, $stateParams, bls_api, $http) {
        var token = get_token();

        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.app = {
            layout: {},
            umsinfo: {}
        };

        // this is upload files list, not update this name!
        $rootScope.files = [];

        // 单点登录通过jsonp验证是否为登录状态
        /**
         * ---- Jquery Jsonp ----
         * --- 1 ---
         * $.getJSON(UMS_ROOT + '/accounts/ajax/login_status/?callback=?', function(data) {
         *      if (data.status == 'success') {
         *          // xxxxxx
         *      } else {
         *          // xxxxxx
         *      }
         * });
         * --- 2 ---
         * $.ajax({
         *      url: 'UMS_ROOT + '/accounts/ajax/login_status/?callback=?',
         *      dataType: "jsonp",
         *      jsonpCallback: "jsonpCallback",
         *      success: function(data) {
         *          // xxxxxx
         *      }
         * });
         */
        // Angular jsonp
        $http({
            'url': UMS_ROOT + '/accounts/ajax/get_user/?callback=?',
            'method': 'jsonp',
            'params': {
                'callback': 'JSON_CALLBACK',
                'token': token
            }
        }).then(function successCallback(res) {
            $rootScope.app.umsinfo.user_id = res.data.result.id;
            $rootScope.app.umsinfo.username = res.data.result.username;
            $rootScope.app.top_nav = top_nav;
        }, function errorCallback(res) {
            window.location.href = UMS_ROOT + '/accounts/login/?next=' + BLS_ROOT; // 登录直接进入bls
            //window.location.href = 'http://' + UMS_ROOT + '/accounts/login/?next=/'; // 登录进入系统中心
        });
    }
]);

/**
 * cfpLoadingBarProvider: loading-bar
 * $compileProvider: a href custom
 */
bravo_bls.config(['cfpLoadingBarProvider', '$compileProvider',
    function (cfpLoadingBarProvider, $compileProvider) {
        cfpLoadingBarProvider.includeBar = true;
        cfpLoadingBarProvider.includeSpinner = false;
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|sms|bravovplay):/);
    }
]);

// JS_REQUIRES js → load-on-demand
bravo_bls.constant('JS_REQUIRES', {
    scripts: {
        /* 素材管理 */
        'liveCtrl': 'app/controllers/material/liveCtrl.js' + bls_version,
        'vodCtrl': 'app/controllers/material/vodCtrl.js' + bls_version,
        /* 审批管理 */
        'checkCtrl': 'app/controllers/check/checkCtrl.js' + bls_version,
        'vodCheckCtrl': 'app/controllers/check/vodCheckCtrl.js' + bls_version,
        'liveCheckCtrl': 'app/controllers/check/liveCheckCtrl.js' + bls_version,
        'editProgramsCheckCtrl': 'app/controllers/check/editProgramsCheckCtrl.js' + bls_version,
        /* -------- vendor -------- */
        'srs.player': ['vendor/SRS/srs.player.js' + bls_version, 'vendor/SRS/swfobject.js' + bls_version],
        'jwplayer': 'vendor/jwplayer/jwplayer.js' + bls_version,
        'resumable': 'vendor/resumable/resumable.js' + bls_version
    },
    // angular module, the name must comply with angular plug-ins name
    modules: [
        {
            name: 'ngLoadingSpinner',
            files: ['vendor/angular-spinner/spin.min.js' + bls_version, 'vendor/angular-spinner/angular-spinner.min.js' + bls_version, 'vendor/angular-spinner/angular-loading-spinner.js' + bls_version]
        },
        {
            name: 'perfect_scrollbar',
            files: ['vendor/angular-perfect-scrollbar/perfect-scrollbar.min.css' + bls_version, 'vendor/angular-perfect-scrollbar/perfect-scrollbar.min.js' + bls_version, 'vendor/angular-perfect-scrollbar/perfect-scrollbar.with-mousewheel.min.js' + bls_version, 'vendor/angular-perfect-scrollbar/angular-perfect-scrollbar.js' + bls_version]
        }
    ],
    top_nav: {
        otherwise: null
    }
});

bravo_bls.config(["$stateProvider", "$urlRouterProvider", "$controllerProvider", "$compileProvider", "$filterProvider", "$provide", "$ocLazyLoadProvider", "JS_REQUIRES",
    function($stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $ocLazyLoadProvider, jsRequires) {
        bravo_bls.controller = $controllerProvider.register;
        bravo_bls.directive = $compileProvider.directive;
        bravo_bls.filter = $filterProvider.register;
        bravo_bls.factory = $provide.factory;
        bravo_bls.service = $provide.service;
        bravo_bls.constant = $provide.constant;
        bravo_bls.value = $provide.value;

        $ocLazyLoadProvider.config({
            debug: false,
            events: true,
            modules: jsRequires.modules
        });
        jsRequires.top_nav.otherwise = dashboard.otherwise;
        switch (jsRequires.top_nav.otherwise) {
            case "素材管理":
                jsRequires.top_nav.otherwise = "bls/material/vod";
                break;
            case "审批管理":
                jsRequires.top_nav.otherwise = "bls/check";
                break;
        }

        // jurisdiction setting
        var menu = dashboard.vms_nav_menu;
        for (var i = 0; i < menu.length; i++) {
            var item = menu[i];
            if (item.selected) {
                switch (item.name) {
                    case "素材管理":
                        $stateProvider
                            .state('bls.material', {
                                url: '/material',
                                templateUrl: 'views/material/material.html'
                            })
                            .state('bls.material.live', {
                                url: '/live',
                                templateUrl: 'views/material/live.html',
                                resolve: loadSequence('liveCtrl', 'srs.player')
                            })
                            .state('bls.material.vod', {
                                url: '/vod',
                                templateUrl: 'views/material/vod.html',
                                resolve: loadSequence('vodCtrl', 'resumable', 'jwplayer')
                            });
                        break;
                    case "审批管理":
                        $stateProvider
                            .state('bls.check', {
                                url: '/check',
                                templateUrl: 'views/check/check.html',
                                resolve: loadSequence('checkCtrl')
                            })
                            .state('bls.check.vod', {
                                url: '/vod',
                                templateUrl: 'views/check/vod_check.html',
                                resolve: loadSequence('vodCheckCtrl', 'jwplayer')
                            })
                            .state('bls.check.live', {
                                url: '/live',
                                templateUrl: 'views/check/live_check.html',
                                resolve: loadSequence('liveCheckCtrl', 'srs.player')
                            })
                            .state('bls.check.editPrograms', {
                                url: '/editPrograms',
                                templateUrl: 'views/check/editProgramsCheck.html',
                                resolve: loadSequence('editProgramsCheckCtrl')
                            });
                        break;
                }
            }
        }

        $urlRouterProvider.otherwise(jsRequires.top_nav.otherwise);

        $stateProvider.state('bls', {
            url: '/bls',
            templateUrl: 'views/bls.html',
            resolve: loadSequence('ngLoadingSpinner', 'perfect_scrollbar'),
            abstract: true
        });

        function loadSequence() {
            var _args = arguments;
            return {
                deps: ['$ocLazyLoad', '$q',
                    function ($ocLL, $q) {
                        var promise = $q.when(1);
                        for (var i = 0, len = _args.length; i < len; i++) {
                            promise = promiseThen(_args[i]);
                        }
                        return promise;

                        function promiseThen(_arg) {
                            if (typeof _arg == 'function') {
                                return promise.then(_arg);
                            } else {
                                return promise.then(function () {
                                    var nowLoad = requiredData(_arg);
                                    if (!nowLoad) {
                                        return $.error('Route resolve: Bad resource name [' + _arg + ']');
                                    }
                                    return $ocLL.load(nowLoad);
                                });
                            }
                        }

                        function requiredData(name) {
                            if (jsRequires.modules) {
                                for (var m in jsRequires.modules)
                                    if (jsRequires.modules[m].name && jsRequires.modules[m].name === name) {
                                        return jsRequires.modules[m];
                                    }
                            }
                            return jsRequires.scripts && jsRequires.scripts[name];
                        }
                    }
                ]
            };
        }
    }
]);