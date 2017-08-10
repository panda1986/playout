"use strict";
bravo_bls.controller("liveCheckCtrl", ["$scope", "bls_check", "bls_api", "$uibModal", "growl",
    function($scope, bls_check, bls_api, $uibModal, growl) {
        $scope.bigCurrentPage = 1;
        $scope.itemsPerPage = 10;
        $scope.maxSize = 5;

        $scope.status_options = [
            {sign: "all", name: "全部"},
            {sign: 0, name: "未审批"},
            {sign: 2, name: "已通过"},
            {sign: 3, name: "未通过"}
        ];
        $scope.status = $scope.status_options[0].sign;

        $scope.video_data = {
            page: 1,
            limit: 10
        };
        $scope.check_data = {};
        get_review_video();
        function get_review_video() {
            $scope.video_data.status = $scope.status;
            if ($scope.video_data.status == "all") delete $scope.video_data.status;
            if (!$scope.video_data.name) delete $scope.video_data.name;
            bls_api.get_review_live_streams($scope.video_data, function(res) {
                $scope.check_data.data = res.result.live_streams;
                $scope.bigTotalItems = res.result.pagination.total;
                if (!$scope.check_data.data.length) {
                    growl.addInfoMessage("没有查询到符合条件的记录", {ttl: bls_prompt.success});
                    return false;
                }
                angular.forEach($scope.check_data.data, function(item) {
                    item.master_view_url = item.bravo_url;
                    item.standby_view_url = item.bravo_burl;
                });
            });
        }

        $scope.pageChanged = function() {
            $scope.video_data.page = $scope.bigCurrentPage;
            get_review_video();
        };

        // 预览流视频
        $scope.see_video = function(url) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/partials/stream_video.html',
                controller: 'streamVideoCtrl',
                backdrop: 'static',
                size: 'w800',
                resolve: {
                    url: function() {return url;}
                }
            });
        };

        $scope.material_check = function(id) {
            var obj = {$scope: $scope, id: id, data_param: 'id'};
            bls_check.batch_operation(obj, function(data) {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'views/partials/material_check.html',
                    controller: 'liveMaterialCheckCtrl',
                    backdrop: 'static',
                    size: 'w300',
                    resolve: {
                        info: function () {return {id: data.id};}
                    }
                });
                modalInstance.result.then(function (data) {
                    get_review_video();
                });
            })
        };

        $scope.search = function() {
            $scope.video_data.page = 1;
            $scope.bigCurrentPage = 1;
            get_review_video();
        };
        async_refresh2.stop();
    }]);
bravo_bls.controller("liveMaterialCheckCtrl", ["$scope", "$uibModalInstance", "info", "bls_api", "growl",
    function($scope, $uibModalInstance, info, bls_api, growl) {
        $scope.check = {
            ids: [info.id],
            status: "1"
        };
        $scope.ok = function () {
            if ($scope.check.status == "1") {
                delete $scope.check.reason;
            }
            bls_api.live_stream_review($scope.check, function(res){
                growl.addSuccessMessage("视频审核成功", {ttl: bls_prompt.success});
                $uibModalInstance.close();
            })
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);
