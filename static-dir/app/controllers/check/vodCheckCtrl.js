"use strict";
bravo_bls.controller("vodCheckCtrl", ["$scope", "bls_check", "bls_api", "$uibModal", "growl", "third_menu",
    function($scope, bls_check, bls_api, $uibModal, growl, third_menu) {
        $scope.bigCurrentPage = 1;
        $scope.itemsPerPage = 10;
        $scope.maxSize = 5;

        $scope.status_options = [
            {sign: "all", name: "全部"},
            {sign: 0, name: "未审批"},
            {sign: 1, name: "已通过"},
            {sign: 2, name: "未通过"}
        ];
        $scope.status = $scope.status_options[0].sign;

        $scope.video_data = {
            page: 1,
            limit: 10
        };

        // 素材分类
        bls_api.get_menu_list({
            m_type: 1 // 1：素材分类
        }, function(res) {
            var directorys = res.result;
            $scope.directory_options = third_menu(directorys, 2);
            $scope.directory_options.unshift({id: -1, name: '全部'});
            $scope.video_category_id = $scope.directory_options[0].id;
            if (directorys.length) {
                get_review_video();
            } else {
                return growl.addInfoMessage("无素材类别", {ttl: bls_prompt.error});
            }
        });

        $scope.check_data = {};
        function get_review_video() {
            $scope.video_data.status = $scope.status;
            if ($scope.video_data.status == "all") delete $scope.video_data.status;
            if (!$scope.video_data.title) delete $scope.video_data.title;
            if ($scope.video_category_id == -1) {
                delete $scope.video_data.video_category_id;
            } else {
                $scope.video_data.video_category_id = $scope.video_category_id;
            }

            bls_api.get_review_video($scope.video_data, function(res) {
                bls_refresh.is_spinner = true;
                $scope.check_data.data = res.result.video_list;
                /** pagination options
                 * itemsPerPage:       每页显示数量
                 * maxSize:            分页按钮数量
                 * bigTotalItems:      数据总量
                 * no show -
                 *     bigCurrentPage: 当前页(无定义，默认为1)
                 */
                $scope.maxSize = res.result.pagination.page_nums.length;
                $scope.bigTotalItems = res.result.pagination.total;
                if (!$scope.check_data.data.length) {
                    growl.addInfoMessage("没有查询到符合条件的记录", {ttl: bls_prompt.success});
                    return false;
                }
                angular.forEach($scope.check_data.data, function(data) {
                    data.file_type = data.video_url.substring(data.video_url.lastIndexOf(".") + 1);
                    data.view_url = "bravovplay://" + ((data.video_url[0] == "/") ? (BLS_ROOT + data.video_url) : data.video_url);
                });
                bls_check.init_check($scope, $scope.check_data.datas, 'video_id');
            });
        }

        $scope.pageChanged = function() {
            $scope.video_data.page = $scope.bigCurrentPage;
            get_review_video();
        };

        $scope.material_check = function(video_id) {
            var modal_data = {
                id: video_id,
                modal_title: "点播素材审核"
            };
            var obj = {$scope: $scope, id: video_id, data_param: 'video_id'};
            bls_check.batch_operation(obj, function(data) {
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'views/partials/material_check.html',
                    controller: 'materialCheckCtrl',
                    backdrop: 'static',
                    size: 'w300',
                    resolve: {
                        info: function () {
                            return modal_data;
                        }
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

        // 视频预览
        $scope.see_video = function(url) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/partials/video_preview.html',
                controller: 'videoPreviewCtrl',
                backdrop: 'static',
                size: 'w800',
                resolve: {info: function () {return {url: url}}}
            });
        };

        async_refresh2.stop();
}]);
bravo_bls.controller("materialCheckCtrl", ["$scope", "$uibModalInstance", "info", "bls_api", "growl",
    function($scope, $uibModalInstance, info, bls_api, growl) {
        $scope.modal_title = info.modal_title;
        $scope.check = {
            video_id: info.id,
            review_type: 1,
            status: "1"
        };
        $scope.ok = function () {
            if ($scope.check.status == "1") {
                delete $scope.check.reason;
            }
            bls_api.video_review($scope.check, function(res){
                growl.addSuccessMessage("视频审核成功", {ttl: bls_prompt.success});
                $uibModalInstance.close();
            })
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);