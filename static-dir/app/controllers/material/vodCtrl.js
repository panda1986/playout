"use strict";
bravo_bpo.controller("vodCtrl", ["$scope", "$location", "bpo_check", "bpo_api", "$uibModal", "video_upload", "$filter", "growl", "$rootScope", "$timeout", "third_menu",
    function($scope, $location, bpo_check, bpo_api, $uibModal, video_upload, $filter, growl, $rootScope, $timeout, third_menu) {
        $scope.bigCurrentPage = 1;
        $scope.itemsPerPage = 10;
        $scope.maxSize = 5;

        // 素材分类
        var m_type = "m_type=1";
        $scope.directory_options = [];
        bpo_api.get_menu_list(m_type, function (res) {
            var directorys = res.data;
            if (!directorys.length) {
                return growl.addInfoMessage("无素材类别", {ttl: bpo_prompt.error});
            };

            $scope.directory_options = third_menu(directorys, 2);
            $scope.video_data = {
                page: $scope.bigCurrentPage,
                limit: 10,
                directory_id: $scope.directory_options[0].id
            };
        });


        // $scope.directory_options = [];
        // bpo_api.get_menu_list({
        //     m_type: 1 // 1：素材分类
        // }, function(res) {
        //     var directorys = res.result;
        //     if (!directorys.length) {
        //         return growl.addInfoMessage("无素材类别", {ttl: bpo_prompt.error});
        //     }

        //     $scope.directory_options = third_menu(directorys, 2);
        //     $scope.video_data = {
        //         page: $scope.bigCurrentPage,
        //         limit: 10,
        //         directory_id: $scope.directory_options[0].id
        //     };
        //     get_video_list();
        // });

        // bpo_api.get_copyright({}, function(data) {
        //     $scope.copyright = data.result.copyright;
        // });

        // service.js
        // $rootScope.r.on('fileSuccess', function(file, message) {
        //     for (var i = 0; i < $rootScope.files.length; i++) {
        //         if($rootScope.files[i].uniqueIdentifier == file.uniqueIdentifier) {
        //             growl.addWarnMessage($rootScope.files[i].fileName + "上传成功", {ttl: bpo_prompt.success});
        //             $rootScope.files.splice(i, 1);
        //             get_video_list();
        //             break;
        //         }
        //     }
        // });

        // // 搜索
        // $scope.search = function() {
        //     $scope.video_data.page = $scope.bigCurrentPage = 1;
        //     get_video_list();
        // };

        // $scope.select_list = function() {
        //     get_video_list();
        // };

        // $scope.material_data = {};

        // function get_video_list() {
        //     /**
        //      * title: 节目名称
        //      * resolution: 分辨率
        //      * video_bitrate_min：码率最小值
        //      * video_bitrate_max：码率最大值
        //      */
        //     if (!$scope.video_data.title) delete $scope.video_data.title;
        //     if (!$scope.video_data.resolution) delete $scope.video_data.resolution;
        //     if ($scope.video_data.video_bitrate_min && $scope.video_data.video_bitrate_max) {
        //         if ($scope.video_data.video_bitrate_min > $scope.video_data.video_bitrate_max) {
        //             growl.addErrorMessage("最小码率不能超过最大码率", {ttl: bpo_prompt.error});
        //             return false;
        //         }
        //     }
        //     if ($scope.video_data.video_bitrate_min !== 0 || $scope.video_data.video_bitrate_min == null) {
        //         if (!$scope.video_data.video_bitrate_min) delete $scope.video_data.video_bitrate_min;
        //     }
        //     if ($scope.video_data.video_bitrate_max !== 0 || $scope.video_data.video_bitrate_max == null) {
        //         if (!$scope.video_data.video_bitrate_max) delete $scope.video_data.video_bitrate_max;
        //     }
        //     bpo_api.get_video_list($scope.video_data, function(res) {
        //         bpo_refresh.is_spinner = true;
        //         $scope.material_data.titles = res.result.workflow_title;
        //         $scope.material_data.is_transcode = _.indexOf($scope.material_data.titles, "转码");
        //         $scope.material_data.datas = res.result.video_list;
        //         $scope.material_data.need_config = res.result.need_config;
        //         var type;
        //         for (var i = 0; i < $scope.directory_options.length; i++) {
        //             var item = $scope.directory_options[i];
        //             if ($scope.video_data.directory_id == item.id) {
        //                 type = item.name;
        //             }
        //         }
        //         $scope.init_check_data = [];
        //         angular.forEach($scope.material_data.datas, function(data) {
        //             data.view_url = "bravovplay://" + ((data.video_url[0] == "/") ? (BPO_ROOT + data.video_url) : data.video_url);
        //             data.data_type = type;
        //             if (typeof data.status == "number") {
        //                 data.import_show = true;
        //             } else {
        //                 $scope.init_check_data.push(data);
        //             }
        //         });
        //         /** pagination options
        //          * itemsPerPage:       每页显示数量
        //          * maxSize:            分页按钮数量
        //          * bigTotalItems:      数据总量
        //          * no show -
        //          *     bigCurrentPage: 当前页(无定义，默认为1)
        //          */
        //         $scope.maxSize = res.result.pagination.page_nums.length;
        //         $scope.bigTotalItems = res.result.pagination.total;
        //         bpo_check.init_check($scope, $scope.init_check_data, 'video_id');
        //         if (!$scope.material_data.datas.length) {
        //             growl.addInfoMessage("没有查询到符合条件的记录", {ttl: bpo_prompt.success});
        //             return false;
        //         }
        //     });
        // }

        $scope.modify = function(video_id, name) {
            var info = {
                video_id: video_id,
                name: name,
                directory:  $scope.directory_options,
                directory_id: $scope.video_data.directory_id
            };

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/vod_modify.html',
                controller: 'vodModifyCtrl',
                backdrop: 'static',
                size: 'w450',
                resolve: {info: function() {return info}}
            });
            modalInstance.result.then(function() {
                get_video_list();
            });
        };

        $scope.checked = function (check) {
            if (check) {
                async_refresh2.stop();
            } else {
                async_refresh2.restart();
                async_refresh2.request(bpo_refresh.interval);
            }
        }

        $scope.delete_video = function(video_id) {
            var obj = {$scope: $scope, id: video_id, data_param: 'video_id'};
            bpo_check.batch_operation(obj, function(data) {
                if (!data.video_id.length) {
                    growl.addInfoMessage("请至少选择一条数据", {ttl: bpo_prompt.success});
                    return false;
                }
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'views/modal/confirm.html',
                    controller: 'confirmCtrl',
                    backdrop: 'static',
                    size: 'w380'
                });
                modalInstance.result.then(function () {
                    bpo_api.delete_video(data, function(res) {
                        growl.addWarnMessage("删除视频成功", {ttl: bpo_prompt.success});
                        get_video_list();
                        $scope.checkboxes.checked = false;
                    });
                });
            });
        };

        // 删除导入的视频
        $scope.delete_download_videos = function(download_id) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/confirm.html',
                controller: 'confirmCtrl',
                backdrop: 'static',
                size: 'w380'
            });
            modalInstance.result.then(function() {
                bpo_api.delete_download_videos({"download_ids": [download_id]}, function(data) {
                    growl.addWarnMessage("删除视频成功", {ttl: bpo_prompt.success});
                    get_video_list();
                });
            });
        };

        // 审核失败之后操作
        $scope.check_details = function(index, video_id) {
            var title = $scope.material_data.titles[index],
                modal_info = {
                    animation: true,
                    backdrop: 'static',
                    resolve: {info: function () {return {video_id: video_id}}}
                };
            switch (title) {
                case '技术审核':
                    modal_info.templateUrl = 'views/modal/tec_check.html';
                    modal_info.controller = 'tecCheckCtrl';
                    modal_info.size = 'w800';
                    break;
                case '内容审核':
                    modal_info.templateUrl = 'views/modal/content_check.html';
                    modal_info.controller = 'contentCheckCtrl';
                    modal_info.size = 'w800';
                    break;
                case '转码':
                    modal_info.templateUrl = 'views/modal/transcode_check.html';
                    modal_info.controller = 'transcodeCheckCtrl';
                    modal_info.size = 'w500';
                    break;
            }
            var modalInstance = $uibModal.open(modal_info);
            switch (title) {
                case '技术审核':
                    modalInstance.result.then(function (Bflag) {
                        if (Bflag) get_video_list();
                    });
                    break;
                case '内容审核':
                    modalInstance.result.then(function () {
                        get_video_list();
                    });
                    break;
                case '转码':
                    modalInstance.result.then(function () {
                        get_video_list();
                    });
                    break;
                default:
                    break;
            }
        };

        $scope.pageChanged = function() {
            $scope.video_data.page = $scope.bigCurrentPage;
            get_video_list();
        };

        // 视频预览
        $scope.see_video = function(url) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/video_preview.html',
                controller: 'videoPreviewCtrl',
                backdrop: 'static',
                size: 'w800',
                resolve: {info: function () {return {url: url}}}
            });
        };

        // 上传素材
        $scope.select_upload = function(option) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/upload_material.html',
                controller: 'uploadMaterialCtrl',
                backdrop: 'static',
                size: 'w450',
                resolve: {info: function () {return {option: option}}}
            });
        };

        // 导入素材 (从VMS导入素材)
        // $scope.import_material = function(options) {
        //     var modalInstance = $uibModal.open({
        //         animation: true,
        //         templateUrl: 'views/modal/import_material.html',
        //         controller: 'importMaterialCtrl',
        //         backdrop: 'static',
        //         size: 'w1020',
        //         resolve: {info: function() {return options}}
        //     });
        //     modalInstance.result.then(function() {
        //         get_video_list();
        //         $scope.checkboxes.checked = false;
        //     })
        // };

        // 导入素材 (从新奥特导入素材)
        $scope.import_videos = function(options) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/import_material_cdv.html',
                controller: 'importVideosCtrl',
                backdrop: 'static',
                size: 'w1020',
                resolve: {info: function() {return options}}
            });
            modalInstance.result.then(function() {
                get_video_list();
                $scope.checkboxes.checked = false;
            })
        };

        async_refresh2.refresh_change(function() {
            bpo_refresh.is_spinner = false;
            //get_video_list();
            async_refresh2.request();
        }, bpo_refresh.interval);
        async_refresh2.request(bpo_refresh.interval);
    }
]);
bravo_bpo.controller("tecCheckCtrl", ["$scope", "$uibModalInstance", "bpo_api", "info", "growl",
    function($scope, $uibModalInstance, bpo_api, info, growl) {
        bpo_api.get_review_detail({video_id: info.video_id, review_type: 0}, function(res) {
            $scope.tec_check = res.result;
        });
        var Bflag = false;

        $scope.tec_pass = function() {
            var data = {
                video_id: [info.video_id],
                review_type: 0, // 0: 技审
                status: 1 // 1: 通过
            };
            bpo_api.video_review(data, function(res) {
                growl.addSuccessMessage("审核通过", {ttl: bpo_prompt.success});
                Bflag = true;
                $uibModalInstance.close(Bflag);
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);
bravo_bpo.controller("contentCheckCtrl", ["$scope", "$uibModalInstance", "bpo_api", "info", "growl",
    function($scope, $uibModalInstance, bpo_api, info, growl) {
        bpo_api.get_review_detail({video_id: info.video_id, review_type: 1}, function(res) {
            $scope.content_check = res.result;
        });

        // 重新提交
        $scope.content_submit = function() {
            var data = {video_id: [info.video_id]};
            bpo_api.submit_content_review(data, function(res) {
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
bravo_bpo.controller("transcodeCheckCtrl", ["$scope", "$uibModalInstance", "bpo_api", "info", "growl",
    function($scope, $uibModalInstance, bpo_api, info, growl) {
        bpo_api.get_video_with_coding_info({video_id: info.video_id}, function(res) {
            $scope.transcode_check = res.result;
        });

        $scope.redo_transcoding = function(task_id) {
            bpo_api.redo_transcoding({video_id: info.video_id, task_id: task_id}, function(res) {
                growl.addWarnMessage("开始重新转码", {ttl: bpo_prompt.success});
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
bravo_bpo.controller("uploadMaterialCtrl", ["$scope", "$rootScope", "$uibModalInstance", "info", "bpo_api", "growl",
    function($scope, $rootScope, $uibModalInstance, info, bpo_api, growl) {
        $scope.materials = info.option;
        // $rootScope.upload_type = $scope.materials[0].id;
        // $rootScope.upload_name = $scope.materials[0].name;
        $rootScope.upload_list = [];
        //$rootScope.upload_button = true;

        if ($rootScope.files.length) {
            $scope.is_select_type = true;
            for (var i = 0; i < $scope.materials.length; i++) {
                var item = $scope.materials[i];
                if (item.name == $rootScope.upload_name) {
                    $rootScope.upload_type = item.id;
                    break;
                }
            }
        } else {
            $scope.is_select_type = false;
            $rootScope.upload_type = $scope.materials[0].id;
            $rootScope.upload_name = $scope.materials[0].name;
        }
        //$scope.is_select_type = ($rootScope.files.length) ? true : false;

        $scope.upload_type_change = function(type) {
            $rootScope.upload_list = [];
            $rootScope.upload_type = type;
            for (var i = 0; i < $scope.materials.length; i++) {
                var item = $scope.materials[i];
                if (item.id == $rootScope.upload_type) {
                    $rootScope.upload_name = item.id;
                    break;
                }
            }
        };

        $scope.del_video = function($index) {
            $rootScope.upload_list.splice($index, 1);
            //if($rootScope.upload_list.length == 0) {
            //    $rootScope.upload_button = true;
            //}
        };
        // 开始上传
        $rootScope.file_start_upload = function() {
            // 页面显示信息
            for (var i = 0; i < $rootScope.upload_list.length; i++) {
                var file = $rootScope.upload_list[i];
                /**
                 * 后台认证标志
                 * for example:
                 * file.uniqueIdentifier: b855a5922322561db896c170ea76e059
                 * file.auth: b855a5922322561db896c170ea76e059salt
                 */
                file.auth = file.uniqueIdentifier + "salt";
                file.upload_type = $rootScope.upload_name;

                $rootScope.files.push(file);
            }

            function findInArr(arr, n) {
                if (!arr.length) {
                    return true;
                }
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i].fileName == n.fileName) {
                        return false;
                    }
                }
                return true;
            }

            var arr = [];
            for (var i = 0; i < $rootScope.files.length; i++) {
                var flieName = $rootScope.files[i].fileName;
                for (var j = 0; j < $rootScope.r.files.length; j++) {
                    if (flieName == $rootScope.r.files[j].fileName) {
                        if (findInArr(arr, $rootScope.r.files[j])) {
                            arr.push($rootScope.r.files[j]);
                        }
                    }
                }
            }
            $rootScope.r.files = arr;

            /*Previous code*/
            //$rootScope.r.files = $rootScope.upload_list;

            // start upload
            $rootScope.upload();
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);

// 导入素材 (从VMS导入素材)
bravo_bpo.controller('importMaterialCtrl', ['$scope', '$uibModalInstance', 'bpo_api', 'growl', 'info',
    function($scope, $uibModalInstance, bpo_api, growl, info) {
        $scope.bigCurrentPage = 1;
        $scope.itemsPerPage = 32;
        $scope.maxSize = 5;
        $scope.types = info;

        if (Object.size($scope.types) > 0) {
            $scope.type = $scope.types[0].id;
        }

        bpo_api.get_vms_directories({}, function(data) {
            $scope.categoryies = data.result;
            if ($scope.categoryies.length >0) {
                $scope.change_category($scope.categoryies[0]);
            }
        });

        $scope.change_category = function(x) {
            angular.forEach($scope.categoryies, function(data) {
                data.is_selected = false;
            });
            x.is_selected = true;
            $scope.selceted_category_id = x.id;
            $scope.api_data = {
                dir_id: $scope.selceted_category_id,
                limit: 32,
                page: 1
            };
            get_video_list();
        };

        function get_video_list() {
            if (!$scope.api_data.title) delete $scope.api_data.title;
            bpo_api.get_vms_product_videos($scope.api_data, function(data) {
                $scope.materials = data.result.videos;
                var fileSize, duration, resolution;
                angular.forEach($scope.materials, function(data) {
                    fileSize = data.fileSize ? calculateBUnit(data.fileSize) : '-';
                    duration = data.duration ? seconds_to_hhmmss(data.duration/1000) : '-';
                    resolution = data.resolution || '-';
                    data.tip_info = '视频大小' + fileSize + '，视频时长' + duration + '，视频分辨率' + resolution;
                });
                $scope.bigTotalItems = data.result.pagination.total;
            });
        }

        var send_videos = [];
        $scope.select_program = function(x) {
            x.selected = !x.selected;
            send_videos = [];
            angular.forEach($scope.materials, function(data) {
                if (data.selected) {
                    send_videos.push({
                        title: data.title,
                        url: data.video_url,
                        fileType: data.video ? data.video.fileType : 'mp4'
                    });
                }
            });
        };

        $scope.pageChanged = function() {
            $scope.api_data.page = $scope.bigCurrentPage;
            get_video_list();
        };

        $scope.search = function() {
            get_video_list();
        };

        $scope.ok = function () {
            if (!send_videos.length) return growl.addWarnMessage('请选择素材', {ttl: bpo_prompt.error});
            if (typeof $scope.type !== 'number') return growl.addWarnMessage('请选择要导入的分类', {ttl: bpo_prompt.error});

            var temp_arr_format = [], temp_arr = [];
            for (var i = 0; i < send_videos.length; i++) {
                var data = send_videos[i];
                temp_arr_format.push(data.title);
                var index = data.title.lastIndexOf('.');
                temp_arr.push(data.title.substring(0, index));
                if (data.fileType === 'm3u8') return growl.addWarnMessage('m3u8类型素材不可导入', {ttl: bpo_prompt.error});
            }

            if (temp_arr.length !== _.uniq(temp_arr).length) return growl.addErrorMessage('不可选择同名的素材', {ttl: bpo_prompt.error});

            //bpo_api.title_unique({
            //    titles: temp_arr,
            //    dir_id: $scope.type
            //}, function (res) {
            //    if (!res.result.length) {
                    var send_info = {
                        dir_id: $scope.type,
                        fr: 'vms',
                        videos: send_videos
                    };
                    bpo_api.post_video_info(send_info, function(data) {
                        if (data.status == 'success') {
                            growl.addSuccessMessage('素材已加入下载列表中', {ttl: bpo_prompt.success});
                            $uibModalInstance.close();
                        } else {
                            //var same_arr = _.intersection(data.result, temp_arr_format);
                            //growl.addErrorMessage(same_arr.join('，') + '重复导入', {ttl: bpo_prompt.error});
                            growl.addErrorMessage(data.result, {ttl: bpo_prompt.error});
                        }
                    });
              //  } else {
              //      growl.addWarnMessage(res.result.join('，') + '文件名重复', {ttl: bpo_prompt.error});
              //  }
            //});
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);

// 导入素材（从新奥特导入素材）
bravo_bpo.controller("importVideosCtrl", ["$scope", "$uibModalInstance", "bpo_api", "growl", "info", "$sce",
    function($scope, $uibModalInstance, bpo_api, growl, info, $sce) {
        $scope.bigCurrentPage = 1;
        $scope.itemsPerPage = 40;
        $scope.maxSize = 5;

        $scope.types = info;
        if (Object.size($scope.types) > 0) {
            $scope.type = $scope.types[0].id;
        }

        $scope.api_data = {
            limit: 40,
            page: 1
        };
        get_video_list();
        function get_video_list() {
            if (!$scope.api_data.cusername) delete $scope.api_data.cusername;
            if (!$scope.api_data.title) delete $scope.api_data.title;
            if (!$scope.api_data.video_category) delete $scope.api_data.video_category;
            bpo_api.get_cdv_product_videos($scope.api_data, function(data) {
                $scope.materials = data.result.videos;
                angular.forEach($scope.materials, function(data) {
                    data.tip_info = $sce.trustAsHtml('类型 ' + (data.video.type == 'source' ? '源视频' : '成品') + '<br/>'
			            + '大小 '  + calculateBUnit(data.video.fileSize) + '<br/>'
                        + '时长 ' + seconds_to_hhmmss(data.video.duration/1000) + '<br/>'
                        + '分辨率 ' + data.video.resolution);
                });
                $scope.bigTotalItems = data.result.pagination.total;
            });
        }

        var send_videos = [];
        $scope.select_program = function(x) {
            x.selected = !x.selected;
            send_videos = [];
            angular.forEach($scope.materials, function(data) {
                if (data.selected) {
                    send_videos.push({
                        title: data.title,
                        url: data.video.playUrl
                    });
                }
            });
        };

        $scope.pageChanged = function() {
            $scope.api_data.page = $scope.bigCurrentPage;
            get_video_list();
        };

        $scope.search = function() {
            get_video_list();
        };

        $scope.ok = function () {
            if (!send_videos.length) {
                return growl.addWarnMessage("请选择素材", {ttl: bpo_prompt.error});
            }
            if ((typeof $scope.type).toLowerCase() != "number") {
                return growl.addWarnMessage("请选择要导入的分类", {ttl: bpo_prompt.error});
            }

            var temp_arr_format = [], temp_arr = [];
            var m3u8_exist = false;
            angular.forEach(send_videos, function(data) {
                temp_arr_format.push(data.title);
                var index = data.title.lastIndexOf(".");
                temp_arr.push(data.title.substring(0, index));
                if (data.url.substr(data.url.length - 4) === 'm3u8') m3u8_exist = true;
            });

            if (m3u8_exist) return growl.addWarnMessage('不支持导入m3u8类型素材', {ttl: bpo_prompt.error});

            if (temp_arr.length !== _.uniq(temp_arr).length) return growl.addErrorMessage('不可选择同名的素材', {ttl: bpo_prompt.error});

            //bpo_api.title_unique({
            //    "titles": temp_arr,
            //    "dir_id": $scope.type
            //}, function(res) {
            //    if (!res.result.length) {
                    var send_info = {
                        dir_id: $scope.type,
                        fr: "cdv",
                        videos: send_videos
                    };
                    bpo_api.post_video_info(send_info, function(data) {
                        if (data.status == 'success') {
                            growl.addSuccessMessage("素材已加入下载列表中", {ttl: bpo_prompt.success});
                            $uibModalInstance.close();
                        } else {
                            //var same_arr = _.intersection(data.result, temp_arr_format);
                            // growl.addErrorMessage(same_arr.join("，") + "重复导入", {ttl: bpo_prompt.error});
                            growl.addErrorMessage(data.result, {ttl: bpo_prompt.error});
                        }
                    });
            //    } else {
            //        growl.addWarnMessage(res.result.join("，") + "文件名重复", {ttl: bpo_prompt.error});
            //    }
            //});
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
}]);

bravo_bpo.controller("vodModifyCtrl", ["$scope", "$uibModalInstance", "info", "bpo_api", "growl",
    function($scope, $uibModalInstance, info, bpo_api, growl) {
        $scope.name = info.name;
        $scope.directory = info.directory;
        $scope.directory_id = info.directory_id;
        $scope.ok = function() {
            var send_info = {
                category_id: $scope.directory_id,
                video_id: info.video_id,
                title: $scope.name
            };
            bpo_api.update_video(send_info, function(data) {
                growl.addSuccessMessage("修改成功", {ttl: bpo_prompt.success});
                $uibModalInstance.close();
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
}]);
