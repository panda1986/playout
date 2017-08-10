'use strict';
bravo_bpo.controller("mainCtrl", ["$scope", "growl", "$window", "bpo_http_error", "video_upload", "$http", "$rootScope",
    function($scope, growl, $window, bpo_http_error, video_upload, $http, $rootScope) {
        var $win, target, tag;
        $scope.ums_root = UMS_ROOT;

        // html right top error response
        bpo_http_error.on_response_error($scope);

        video_upload.create();

        // prevent key 8(Backspace)
        $win = $($window);
        $win.keydown(function(e) {
            target = e.target;
            tag = e.target.tagName.toLowerCase();
            if (e.keyCode == 8) {
                if ((tag == 'input' && !$(target).attr("readonly")) || (tag == 'textarea' && !$(target).attr("readonly"))) {
                    return ((target.type.toLowerCase() == "radio") || (target.type.toLowerCase() == "checkbox")) ? false : true;
                } else {
                    return false;
                }
            }
        });

        window.onbeforeunload = function() {
            if ($rootScope.files.length) {
                return "视频正在上传中...";
            }
        };

        $scope.logout = function() {
            $http({
                'url': UMS_ROOT + '/accounts/ajax/logout_api/?callback=?',
                'method': 'jsonp',
                'params': {
                    'number': '1',
                    'callback': 'JSON_CALLBACK'
                }
            }).then(function successCallback(res) {
                window.location.href = UMS_ROOT + '/accounts/login/?next=' + BPO_ROOT;
            }, function errorCallback(res) {
                // todo:....
                console.log(res);
                window.location.href = UMS_ROOT + '/accounts/login/?next=' + BPO_ROOT;
            });
        };
    }
]);
// confirm common modal
bravo_bpo.controller("confirmCtrl", ["$scope", "$uibModalInstance",
    function($scope, $uibModalInstance) {
        $scope.ok = function () {$uibModalInstance.close();};
        $scope.cancel = function () {$uibModalInstance.dismiss('cancel');};
    }
]);
// video preview modal
bravo_bpo.controller("videoPreviewCtrl", ["$scope", "$uibModalInstance", "info", "$timeout",
    function($scope, $uibModalInstance, info, $timeout) {
        if (info.url[0] == '/') {
            var http = window.location.protocol,
                ip = window.location.host,
                url = http + "//" + ip + info.url;
        } else {
            var url = info.url;
        }

        // jwplayer使用方法
        $timeout(function() {
            jwplayer('video_preview').setup({
                flashplayer: "vendor/jwplayer/jwplayer.flash.swf",
                autostart: true,
                file: url,
                width: 768,
                height: 400
            });
        }, 0);

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);

// play_stream_video
bravo_bpo.controller("streamVideoCtrl", ["$scope", "$uibModalInstance", "url", "$timeout",
    function($scope, $uibModalInstance, url, $timeout) {
        $timeout(function() {
            player_init("play_base", url, 1, 768, 400);
        }, 0);

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);