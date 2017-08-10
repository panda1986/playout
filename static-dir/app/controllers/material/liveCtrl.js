"use strict";
bravo_bpo.controller("liveCtrl", ["$scope", "bpo_check", "bpo_api", "$uibModal", "growl",
    function($scope, bpo_check, bpo_api, $uibModal, growl) {
        $scope.bigCurrentPage = 1;
        $scope.itemsPerPage = 10;
        $scope.maxSize = 5;

        $scope.stream_data = {
            page: $scope.bigCurrentPage,
            limit: 10
        };
        get_live_stream_list();
        function get_live_stream_list() {
            bpo_api.get_live_stream_list($scope.stream_data, function(res) {
                bpo_refresh.is_spinner = true;
                $scope.datas = res.result.live_streams;
                bpo_api.get_copyright({}, function(data) {
                    var copyright = data.result.copyright;
                    angular.forEach($scope.datas, function(item) {
                        if (copyright == 'trunk') {
                            item.master_view_url = (item.protocol == "UDP") ? item.bravo_url : item.master_src;
                            item.standby_view_url = (item.protocol == "UDP") ? item.bravo_burl : item.standby_src;
                        } else if (copyright == 'weilai') {
                            item.master_view_url = item.bravo_url;
                            item.standby_view_url = item.bravo_burl;
                        }
                        var len = item.review_logs.length;
                        item._review_operator = len ?
                            (item.review_logs[len-1].operator + ' | '
                            + absolute_seconds_to_YYYYmmdd_hhmmss((item.review_logs[len-1].review_time)*1000))
                            : '——';
                    });
                    /** pagination options
                     * itemsPerPage:       每页显示数量
                     * maxSize:            分页按钮数量
                     * bigTotalItems:      数据总量
                     * no show -
                     * bigCurrentPage: 当前页(无定义，默认为1)
                     */
                    $scope.maxSize = res.result.pagination.page_nums ? res.result.pagination.page_nums.length : 1;
                    $scope.bigTotalItems = res.result.pagination.total || 0;
                    bpo_check.init_check($scope, $scope.datas, 'id');
                    if (!$scope.datas.length) {
                        growl.addInfoMessage("没有查询到符合条件的记录", {ttl: bpo_prompt.success});
                        return false;
                    }
                });
            });
        }

        $scope.pageChanged = function() {
            $scope.stream_data.page = $scope.bigCurrentPage;
            get_live_stream_list();
        };

        // 预览流视频
        $scope.see_video = function(url) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/stream_video.html',
                controller: 'streamVideoCtrl',
                backdrop: 'static',
                size: 'w800',
                resolve: {
                    url: function() {return url;}
                }
            });
        };

        $scope.delete_live = function(id) {
            var obj = {$scope: $scope, id: id, data_param: 'ids'};
            bpo_check.batch_operation(obj, function(data) {
                if (!data.ids.length) {
                    growl.addInfoMessage("请至少选择一条数据", {ttl: bpo_prompt.success});
                    return false;
                }
                data.status = 1; // 1: delete
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'views/modal/confirm.html',
                    controller: 'confirmCtrl',
                    backdrop: 'static',
                    size: 'w380'
                });
                modalInstance.result.then(function () {
                    delete data.status;
                    bpo_api.delete_live_stream(data, function(res) {
                        growl.addWarnMessage("删除成功", {ttl: bpo_prompt.success});
                        get_live_stream_list();
                    });
                });
            });
        };

        $scope.create_live = function() {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/live_modal.html',
                controller: 'createLiveCtrl',
                backdrop: 'static',
                size: 'w450',
                resolve: {title: function () {return "创建直播"}}
            });
            modalInstance.result.then(function () {get_live_stream_list();});
        };

        $scope.modify_live = function(id) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/live_modal.html',
                controller: 'modifyLiveCtrl',
                backdrop: 'static',
                size: 'w450',
                resolve: {info: function () {return {title: "编辑直播", id: id}}}
            });
            modalInstance.result.then(function () {get_live_stream_list();});
        };

        $scope.check_stream = function(id) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/content_check.html',
                controller: 'liveReviewDetailsCtrl',
                backdrop: 'static',
                size: 'w500',
                resolve: {id: id}
            });
            modalInstance.result.then(function() {
                get_live_stream_list();
            });
        };

        async_refresh2.stop();
    }
]);
bravo_bpo.controller("createLiveCtrl", ["$scope", "title", "growl", "$uibModalInstance", "bpo_api",
    function($scope, title, growl, $uibModalInstance, bpo_api) {
        $scope.title = title;
        $scope.liveProgram = {
            protocol: "RTMP",
            delay_time: 0
        };

        $scope.clear = function() {
          $scope.liveProgram.master_src = null;
        };

        $scope.ok = function () {
            if ($scope.liveProgram.delay_time > 1800) {
                growl.addErrorMessage("直播流延时不得超过1800秒", {ttl: bpo_prompt.error});
                return false;
            }
            if (!$scope.liveProgram.delay_time) $scope.liveProgram.delay_time = 0;
            bpo_api.create_live_stream($scope.liveProgram, function(){
                growl.addSuccessMessage("创建成功", {ttl: bpo_prompt.success});
                $uibModalInstance.close();
            });
        };
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);
bravo_bpo.controller("modifyLiveCtrl", ["$scope", "info", "growl", "$uibModalInstance", "bpo_api",
    function($scope, info, growl, $uibModalInstance, bpo_api) {
        $scope.title = info.title;

        bpo_api.get_live_stream({id: info.id}, function(res) {
            $scope.liveProgram = res.result;
        });

        $scope.clear = function() {
            $scope.liveProgram.master_src = null;
        };

        $scope.ok = function () {
            $scope.liveProgram.id = info.id;
            if ($scope.liveProgram.delay_time > 1800) {
                growl.addErrorMessage("直播流延时不得超过1800秒", {ttl: bpo_prompt.error});
                return false;
            }
            if (!$scope.liveProgram.delay_time) $scope.liveProgram.delay_time = 0;
            bpo_api.update_live_stream($scope.liveProgram, function(res){
                growl.addSuccessMessage("修改成功", {ttl: bpo_prompt.success});
                $uibModalInstance.close();
            });
        };
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);

bravo_bpo.controller("liveReviewDetailsCtrl", ["$scope", "$uibModalInstance", "bpo_api", "id", "growl",
    function($scope, $uibModalInstance, bpo_api, id, growl) {
        bpo_api.get_lsreview_detail({id: id}, function(res) {
            $scope.review_list = res.result.review_list;
        });

        // 重新提交
        $scope.reSubmit = function() {
            bpo_api.submit_live_stream_review({ids: [id]}, function(res) {
                growl.addSuccessMessage("重新提交成功", {ttl: bpo_prompt.success});
                $uibModalInstance.close();
            });
        };

        $scope.ok = function () {
            $uibModalInstance.close();
        };
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);
