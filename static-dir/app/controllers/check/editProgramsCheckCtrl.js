"use strict";
bravo_bls.controller("editProgramsCheckCtrl", ["$scope", "bls_check", "bls_api", "$uibModal", "growl", "third_menu", "datepicker",
    function($scope, bls_check, bls_api, $uibModal, growl, third_menu, datepicker) {
        $scope.bigCurrentPage = 1;
        $scope.itemsPerPage = 10;
        $scope.maxSize = 5;
        datepicker.init_date($scope);

        var req_data = {
            m_type: 2,
            not_required_permission: 1
        };
        // 频道类别及频道
        bls_api.get_menu_list(req_data,function(data) {
            $scope.channel_types = third_menu(data.result, 3);
            $scope.channel_types.unshift({id: -1, name: "全部"});
            $scope.selected_channel_type = $scope.channel_types[0].id;
            if (data.result[0]) {
                $scope.select_channel_type();
            } else {
                growl.addWarnMessage("无频道类别", {ttl: bls_prompt.error});
            }
        });

        $scope.channels = [{
            channel_id: -1,
            channel_name: "全部"
        }];
        $scope.selected_channel = $scope.channels[0].channel_id;

        $scope.select_channel_type = function() {
            if ($scope.selected_channel_type == -1) {
                $scope.selected_channel = -1;
                get_program_list();
                return;
            }
            var data = {
                category_id: $scope.selected_channel_type,
                status: 1,
                current_page: 1,
                limit: 99999
            };

            bls_api.get_channels(data, function(data) {
                $scope.channels = data.result.channels;
                $scope.channels.unshift({channel_id: -1, channel_name: "全部"});
                $scope.selected_channel = $scope.channels[0].channel_id;
                if ($scope.channels.length) {
                    get_program_list();
                } else {
                    growl.addInfoMessage("该频道分类下无频道列表", {ttl: bls_prompt.error});
                    $scope.$data = [];
                    $scope.bigTotalItems = $scope.$data;
                }
            });
        };

        $scope.status_options = [
            {sign: -1, name: "全部"},
            {sign: 0, name: "未审批"},
            {sign: 2, name: "已通过"},
            {sign: 3, name: "未通过"}
        ];
        $scope.current_status = $scope.status_options[0].sign;

        $scope.data = {
            is_query_intercut_groups: true,
            program_group_type: "broadcast",
            current_page: 1,
            limit: 10
        };

        $scope.search = function() {
            get_program_list();
        };

        function get_program_list() {
            // 查询时间设置为当天零点
            $scope.data.play_date = [Math.floor($scope.start_dt.getTime()/1000), Math.floor($scope.end_dt.getTime()/1000)];
            if ($scope.selected_channel_type == "-1") {
                delete $scope.data.channel_category_id;
            } else {
                $scope.data.channel_category_id = $scope.selected_channel_type;
            }
            if ($scope.selected_channel == "-1") {
                delete $scope.data.channel_id;
            } else {
                $scope.data.channel_id = $scope.selected_channel;
            }
            if ($scope.current_status == -1) {
                delete $scope.data.status;
            } else {
                $scope.data.status = $scope.current_status;
            }

            bls_api.get_review_groups($scope.data, function(res) {
                $scope.$data = res.result.program_groups;
                angular.forEach($scope.$data, function(data) {
                    data.start_time *= 1000;
                    data.end_time *= 1000;
                    data.add_time *= 1000;
                    if (data.start_time <= Date.now()) {
                        data.overTime = true;
                    }
                });
                $scope.bigTotalItems = res.result.pagination.total || 0;
                $scope.maxSize = res.result.pagination.page_nums ? res.result.pagination.page_nums.length : 1;
                bls_check.init_check($scope, $scope.$data, "id");
                if (!$scope.$data.length) {
                    $scope.$data = [];
                    growl.addInfoMessage("没有查询到符合条件的记录", {ttl: bls_prompt.success});
                }
            });
        }

        $scope.details = function(item) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/partials/channel_program_modal.html',
                controller: 'exportProgramCtrl',
                backdrop: 'static',
                size: 'w1000',
                resolve: {info: function () {return {title: item.name, id: item.id};}}
            });
            modalInstance.result.then(function () {
                get_program_list();
            });
        };

        $scope.review = function(id, start_time) {
            if (start_time <= Date.now()) {
                return growl.addErrorMessage("已到开始时间，无法审核", {ttl: bls_prompt.error});
            }
            var modal_data = {
                id: [id],
                modal_title: "编单审核"
            };
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/partials/material_check.html',
                controller: 'editProModalCtrl',
                backdrop: 'static',
                size: 'w300',
                resolve: {
                    info: function () {
                        return modal_data;
                    }
                }
            });
            modalInstance.result.then(function () {
                get_program_list();
            });
        };

        $scope.pageChanged = function() {
            $scope.data.current_page = $scope.bigCurrentPage;
            get_program_list();
        };
    }]);

bravo_bls.controller("editProModalCtrl", ["$scope", "$uibModalInstance", "info", "bls_api", "growl",
    function($scope, $uibModalInstance, info, bls_api, growl) {
        $scope.modal_title = info.modal_title;
        $scope.check = {
            group_ids: info.id,
            status: "1"
        };
        $scope.ok = function () {
            if ($scope.check.status == "1") {
                delete $scope.check.reason;
            }
            bls_api.program_group_review($scope.check, function(res){
                growl.addSuccessMessage("审核成功", {ttl: bls_prompt.success});
                $uibModalInstance.close();
            })
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);

bravo_bls.controller("exportProgramCtrl", ["$scope", "$uibModalInstance", "$uibModal", "growl", "bls_api", "info",
    function($scope, $uibModalInstance, $uibModal, growl, bls_api, info) {
        $scope.program_info = info;
        bls_api.get_programs_by_groupid({group_ids: [info.id]}, function(res) {
            $scope.program = res.result;
            angular.forEach($scope.program, function(data) {
                data.file_type = data.video_url.slice(data.video_url.lastIndexOf(".") + 1);
                data.view_url = "bravovplay://" + BLS_ROOT + data.video_url;
                data.start_time = data.start_time * 1000;
                data.end_time = data.end_time * 1000;
            });
        });


        // 视频预览
        $scope.see_video = function(video_url) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/partials/video_preview.html',
                controller: 'videoPreviewCtrl',
                backdrop: 'static',
                size: 'w800',
                resolve: {info: function () {return {url: video_url}}}
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);