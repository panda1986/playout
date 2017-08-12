"use strict";
angular.module("base_modular", [
    "ngAnimate",
    "ui.router",
    "oc.lazyLoad",
    "angular-loading-bar",
    "ui.bootstrap",
    "angular-growl"
]);

var bravo_bpo = angular.module("bravo_bpo", ["base_modular", "bpo_service", "bpo_filter", "bpo_directive"]);

bravo_bpo.run(["$rootScope", "$state", "$stateParams", "bpo_api", "$http",
    function($rootScope, $state, $stateParams, bpo_api, $http) {
        // var url = window.location.href;
        // var token = get_token();

        // setCookie('sessionid', )
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.app = {
            layout: {},
            umsinfo: {}
        };

        // this is upload files list, not update this name!
        $.ajax({
            url: "/account/get_user_info",
            type: 'GET',
            data: '',
            async: false,
            success: function(res) {
                $rootScope.files = [];
                $rootScope.app.umsinfo.user_id = res.data.id;
                $rootScope.app.umsinfo.username = res.data.username;
                $rootScope.app.top_nav = top_nav;
            },
        });
    }
]);

/**
 * cfpLoadingBarProvider: loading-bar
 * $compileProvider: a href custom
 */
bravo_bpo.config(['cfpLoadingBarProvider', '$compileProvider',
    function (cfpLoadingBarProvider, $compileProvider) {
        cfpLoadingBarProvider.includeBar = true;
        cfpLoadingBarProvider.includeSpinner = false;
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|sms|bravovplay):/);
    }
]);

// JS_REQUIRES js → load-on-demand
bravo_bpo.constant('JS_REQUIRES', {
    scripts: {
        /* 素材管理 */
        'liveCtrl': 'app/controllers/material/liveCtrl.js' + bpo_version,
        'vodCtrl': 'app/controllers/material/vodCtrl.js' + bpo_version,
        /* 审批管理 */
        'checkCtrl': 'app/controllers/check/checkCtrl.js' + bpo_version,
        'vodCheckCtrl': 'app/controllers/check/vodCheckCtrl.js' + bpo_version,
	    'liveCheckCtrl': 'app/controllers/check/liveCheckCtrl.js' + bpo_version,
        'editProgramsCheckCtrl': 'app/controllers/check/editProgramsCheckCtrl.js' + bpo_version,
        /* -------- vendor -------- */
        'srs.player': ['vendor/SRS/srs.player.js' + bpo_version, 'vendor/SRS/swfobject.js' + bpo_version],
        'jwplayer': 'vendor/jwplayer/jwplayer.js' + bpo_version,
        'resumable': 'vendor/resumable/resumable.js' + bpo_version
    },
    // angular module, the name must comply with angular plug-ins name
    modules: [
        {
            name: 'ngLoadingSpinner',
            files: ['vendor/angular-spinner/spin.min.js' + bpo_version, 'vendor/angular-spinner/angular-spinner.min.js' + bpo_version, 'vendor/angular-spinner/angular-loading-spinner.js' + bpo_version]
        },
        {
            name: 'perfect_scrollbar',
            files: ['vendor/angular-perfect-scrollbar/perfect-scrollbar.min.css' + bpo_version, 'vendor/angular-perfect-scrollbar/perfect-scrollbar.min.js' + bpo_version, 'vendor/angular-perfect-scrollbar/perfect-scrollbar.with-mousewheel.min.js' + bpo_version, 'vendor/angular-perfect-scrollbar/angular-perfect-scrollbar.js' + bpo_version]
        }
    ],
    top_nav: {
        otherwise: null
    }
});

bravo_bpo.config(["$stateProvider", "$urlRouterProvider", "$controllerProvider", "$compileProvider", "$filterProvider", "$provide", "$ocLazyLoadProvider", "JS_REQUIRES",
    function($stateProvider, $urlRouterProvider, $controllerProvider, $compileProvider, $filterProvider, $provide, $ocLazyLoadProvider, jsRequires) {
        bravo_bpo.controller = $controllerProvider.register;
        bravo_bpo.directive = $compileProvider.directive;
        bravo_bpo.filter = $filterProvider.register;
        bravo_bpo.factory = $provide.factory;
        bravo_bpo.service = $provide.service;
        bravo_bpo.constant = $provide.constant;
        bravo_bpo.value = $provide.value;

        $ocLazyLoadProvider.config({
            debug: false,
            events: true,
            modules: jsRequires.modules
        });
        jsRequires.top_nav.otherwise = dashboard.otherwise;
        switch (jsRequires.top_nav.otherwise) {
            case "素材管理":
                jsRequires.top_nav.otherwise = "bpo/material/vod";
                break;
            case "审批管理":
                jsRequires.top_nav.otherwise = "bpo/check";
                break;
        }

        // jurisdiction setting
        var menu = dashboard.bpo_nav_menu;
        for (var i = 0; i < menu.length; i++) {
            var item = menu[i];
            if (item.selected) {
                switch (item.name) {
                    case "素材管理":
                        $stateProvider
                            .state('bpo.material', {
                                url: '/material',
                                templateUrl: 'views/material/material.html'
                            })
                            .state('bpo.material.live', {
                                url: '/live',
                                templateUrl: 'views/material/live.html',
                                resolve: loadSequence('liveCtrl', 'srs.player')
                            })
                            .state('bpo.material.vod', {
                                url: '/vod',
                                templateUrl: 'views/material/vod.html',
                                resolve: loadSequence('vodCtrl', 'resumable', 'jwplayer')
                            });
                        break;
                }
            }
        }

        $urlRouterProvider.otherwise(jsRequires.top_nav.otherwise);

        $stateProvider.state('bpo', {
            url: '/bpo',
            templateUrl: 'views/bpo.html',
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
