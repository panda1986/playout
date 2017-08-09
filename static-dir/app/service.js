'use strict';
var bls_service = angular.module("bls_service", []);

bls_service.service("bls_api", ["$http", function($http) {
    var form_post = function(url, data) {
        return {
            'url': url,
            'method': 'POST',
            'data': data,
            'headers': {'Content-Type': 'application/x-www-form-urlencoded'},
            'transformRequest': function(data) {
                var str = [], index;
                for (var p in data) {
                    index = angular.isArray(data[p]) ? (encodeURIComponent(p) + "=" + "[" + encodeURIComponent(data[p]) + "]") : (encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
                    str.push(index);
                }
                return str.join("&");
            }
        }
    };
    var form_post_add_token = function(info) {
        // todo: 暂时保留token
        //var token = get_token();
        //if (!token.length) {
        //    window.location.href = UMS_ROOT + '/accounts/login/?next=' + BLS_ROOT;
        //}
        //info.data.token = token;
        return info;
    };
    var post_add_token = function(url, data) {
        // todo: 暂时保留token
        //var token = get_token();
        //if (!token.length) {
        //    window.location.href = UMS_ROOT + '/accounts/login/?next=' + BLS_ROOT;
        //}
        var info = {
            'url': url,
            'method': 'POST',
            'data': data
        };
        //info.data.token = token;
        return info;
    };
    var get_add_token = function(url) {
        // todo: 暂时保留token
        //var token = get_token();
        //if (!token.length) {
        //    window.location.href = UMS_ROOT + '/accounts/login/?next=' + BLS_ROOT;
        //}
        //var info = {
        //    'url': url + "?token=" + token,
        //    'method': 'GET'
        //};
        var info = {
            'url': url,
            'method': 'GET'
        };
        return info;
    };

    return {
        // 获取用户对应的菜单/目录列表
        // 'get_menu_list': function(data, callback) {
        //     var info = form_post(bls_http_api.accounts + 'get_menu_list/', data);
        //     var Http = form_post_add_token(info);
        //     $http(Http).success(callback);
        // },
        // // 获取视频列表
        // 'get_video_list': function(data, callback) {
        //     var info = form_post(bls_http_api.video + 'get_video_list/', data);
        //     var Http = form_post_add_token(info);
        //     $http(Http).success(callback);
        // },
        // // 获取内容审核视频列表
        // 'get_review_video': function(data, callback) {
        //     var info = form_post(bls_http_api.video + 'get_review_video/', data);
        //     var Http = form_post_add_token(info);
        //     $http(Http).success(callback);
        // }
    }
}]);

bls_service.service('bls_check', function(growl) {
    return {
        // id: 判断条件不同，需手动传入
        init_check: function($scope, array, id) {
            $scope.checkboxes = {
                checked: false,
                items: []
            };
            // 多选
            $scope.item_check = function() {
                $scope.checkboxes.items = [];
                var check = 0, total = array.length;
                angular.forEach(array, function(data) {
                    if (data.check) {
                        $scope.checkboxes.items.push(data[id]);
                        check++;
                    }
                });
                $scope.checkboxes.checked = (check == total);
            };
            // 全选
            $scope.check_all = function() {
                $scope.checkboxes.items = [];
                if ($scope.checkboxes.checked) {
                    angular.forEach(array, function(data) {
                        data.check = true;
                        $scope.checkboxes.items.push(data[id]);
                    });
                } else {
                    angular.forEach(array, function(data) {data.check = false;});
                }
            };
        },
        // 带状态多选/单选操作
        batch_status: function (obj, callback) {
            var data = {};
            if (!obj.id) { // 多选
                if (!obj.$scope.checkboxes.items.length) {
                    growl.addErrorMessage("请至少选择一条数据", {ttl: bls_prompt.error});
                    return false;
                }
                for (var i = 0; i < obj.array.length; i++) {
                    var item = obj.array[i];
                    if ((_.indexOf(obj.$scope.checkboxes.items, item.id) >= 0) && (item.status == obj.status)) {
                        obj.$scope.checkboxes.items = _.without(obj.$scope.checkboxes.items, item.id);
                    }
                }
                data.status = obj.status;
                data[obj.data_param] = obj.$scope.checkboxes.items;
            } else { // 单选
                data.status = (obj.status == 1) ? 0 : 1;
                data[obj.data_param] = [obj.id];
            }
            if (!data[obj.data_param].length) {
                growl.addErrorMessage("您选择的数据有误", {ttl: bls_prompt.error});
                obj.$scope.checkboxes.checked = false;
                obj.$scope.checkboxes.items = [];
                angular.forEach(obj.array, function(data) {data.check = false;});
                return false;
            }
            callback(data);
        },
        // 无状态单选多选操作
        batch_operation: function(obj, callback) {
            var data = {};
            if (!obj.id) { // 多选操作
                if (!obj.$scope.checkboxes.items.length) {
                    growl.addErrorMessage("请至少选择一条数据", {ttl: bls_prompt.error});
                    return false;
                }
                data[obj.data_param] = obj.$scope.checkboxes.items;
            } else { // 单选操作
                data[obj.data_param] = [obj.id];
            }
            callback(data);
        }
    }
});

/**
 * 文件上传
 * 注：不要在两个分类里同时上传视频！
 * 视频文件上传时，若在其中一个分类上传同时其他分类中也有上传视频，上传后视频分类会发生错误！
 */
bls_service.service('video_upload', ["$rootScope", "$http", "growl", "bls_api",
    function($rootScope, $http, growl, bls_api) {
        return {
            create: function() {
                var uploadButton = angular.element('<input type="file" style="display:none;">')[0];
                angular.element(document.getElementsByClassName("video_upload")[0]).append(uploadButton);
                $rootScope.uploading = false;

                var upload_start_timestamp = 0;
                $rootScope.r = new Resumable({
                    'target': bls_http_api.video + 'upload_video/',
                    'chunkSize': 512*1024,
                    'simultaneousUploads': 5,
                    'method': 'octet',
                    'fileType': ['avi', 'mov', 'asf', 'wmv', 'navi', '3gp', 'rmvb', 'mkv', 'flv', 'mpeg2', 'mpeg4', 'mp4', 'ts'],
                    'fileTypeErrorCallback': function(file, errorCount) {
                        alert('上传文件类型错误');
                    },
                    'generateUniqueIdentifier': function(file) {
                        return hex_md5(file.name + file.size + new Date().getTime());
                    },
                    'query': function(file) {
                        return {
                            'auth': file.auth,
                            'dir_id': $rootScope.upload_type
                        };
                    }
                });

                var oldOn = $rootScope.r.on;
                $rootScope.r.on = function (event, callback) {
                    oldOn.call(this, event, function() {
                        var args = arguments;
                        safeApply($rootScope, function() {
                            callback.apply(self, args);
                        });
                    });
                };

                function safeApply(scope, fn) {
                    var phase = scope.$root.$$phase;
                    if (phase == '$apply' || phase == '$digest') {
                        if (fn && (typeof(fn) === 'function')) {
                            fn();
                        }
                    } else {
                        scope.$apply(fn);
                    }
                }

                // multiple files upload
                // 开始上传
                $rootScope.upload_list = [];
                $rootScope.r.on('filesAdded', function(files) {
                    // 上传中重名文件阻止下一步
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        for (var j = 0; j < $rootScope.files.length; j++) {
                            var item = $rootScope.files[j];
                            if (item.fileName === file.fileName) {
                                growl.addErrorMessage(file.fileName + "文件正在上传中！", {ttl: bls_prompt.error});
                                $rootScope.r.files.splice(j+1, 1);
                                file = null;
                                return false;
                            }
                        }
                    }

                    // 验证数据库重名信息
                    var titles = [];
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        var fileName = files[i].fileName.substring(0, files[i].fileName.lastIndexOf("."));
                        titles.push(fileName);
                    }

                    bls_api.title_unique({
                        titles: titles,
                        dir_id: $rootScope.upload_type
                    }, function(res) {
                        if (res.result.length) {
                            return growl.addWarnMessage(res.result.join("，") + "文件名重复", {ttl: bls_prompt.error});
                        }
                        // 弹出层页面上传列表
                        var video_list = [];
                        angular.forEach($rootScope.upload_list, function(data) {
                            video_list.push(data.fileName);
                        });
                        for (var i = 0; i < files.length; i++) {
                            var index = _.indexOf(video_list, files[i].fileName);
                            if (index >= 0) {
                                growl.addErrorMessage("待上传列表中已有选中视频！", {ttl: bls_prompt.error});
                                return false;
                            }
                            $rootScope.upload_list.push(files[i]);
                        }

                        // 开始上传按钮
                        $rootScope.upload_button = false;
                    });
                });

                // 上传进度
                $rootScope.r.on('progress', function(files) {});

                $rootScope.r.on('uploadStart', function() {
                    upload_start_timestamp = new Date().getTime();
                    $rootScope.uploading = true;
                });

                $rootScope.r.on('complete', function() {
                    $rootScope.uploading = false;
                });

                // 代码移植到streamCtrl.js中
                //$rootScope.r.on('fileSuccess', function(file, message) {
                //    for (var i = 0; i < $rootScope.files.length; i++) {
                //        if($rootScope.files[i].uniqueIdentifier == file.uniqueIdentifier) {
                //            growl.addWarnMessage($rootScope.files[i].fileName + "上传成功", {ttl: bls_prompt.success});
                //            $rootScope.files.splice(i, 1);
                //            break;
                //        }
                //    }
                //});

                $rootScope.r.on('fileError', function(file, message){
                    // todo: test file upload error
                    console.log(file.fileName, "上传失败，原因：", message);
                });

                $rootScope.r.on('pause', function() {
                    $rootScope.uploading = false;
                });

                $rootScope.r.on('cancel', function() {
                    $rootScope.uploading = false;
                });

                // 浏览文件
                $rootScope.browse = function() {
                    uploadButton.click();
                };

                // 开始上传功能移植到streamCtrl.js→uploadMaterialCtrl中
                // 开始上传
                $rootScope.upload = function() {
                    $rootScope.r.upload();
                };
                // 暂停上传
                $rootScope.pause = function() {
                    $rootScope.r.pause();
                };
                // 取消上传
                $rootScope.cancel = function() {
                    $rootScope.r.cancel();
                    $rootScope.files = [];
                };
                // 终止上传
                $rootScope.cancelFile = function(file) {
                    // abort只能使用一次-_-!？
                    //file.abort();
                    file.cancel();
                    $rootScope.files.splice($rootScope.files.indexOf(file), 1);
                };
                $rootScope.r.assignBrowse(uploadButton);
            }
        }
    }
]);

bls_service.service('bls_api_cancel', function($q) {
    return {
        canceler: $q.defer(),
        cancel_request: function($q) {
            var self = this;
            self.canceler.resolve();
            self.canceler = $q.defer();
        }
    }
});

// 编单 节目操作
bls_service.service('program_config', function(growl) {
    return {
        // 插入垫片
        insert: function(arg, index, spacer) {
            // 添加到中间
            if (arg[index+1]) {
                var gap_time = arg[index+1].start_time - arg[index].end_time;
                if (gap_time >= spacer.duration && spacer.times == "loop") {
                    var times = Math.floor(gap_time/spacer.duration);
                    var timeceil = Math.ceil(gap_time/spacer.duration);
                    if (times > 99) {
                        growl.addWarnMessage("垫片循环次数已超过99次，请核对该操作.", {ttl: bls_prompt.error});
                        return false;
                    }

                    if ((times*spacer.duration) < gap_time && timeceil == times) {
                        arg.splice(index+1, 0, {
                            name: spacer.videos[0].name,
                            video_id: spacer.videos[0].id,
                            live_stream_id: null
                        });
                        if (arg[0].type == 'intercut_play') {
                            arg[index+1].type = 'intercut_play'
                        } else {
                            arg[index].type = 'order_play'
                        }
                        arg[index+1].start_time = arg[index].end_time;
                        arg[index+1].end_time = arg[index+2].start_time;
                        arg[index+1].duration = arg[index+1].end_time - arg[index+1].start_time;
                    } else {
                        // spacer.duration: 弹出层插入垫片总时长
                        // gap_time: 节目单中间空隙
                        // 垫片每条加起来总时长
                        var addtime = 0, video_index;
                        var video_len = spacer.videos.length;
                        for (var i = 0; i < 9999; i++) {
                            addtime += spacer.videos[i%video_len].duration;
                            if (addtime >= gap_time) {
                                // 没有空隙
                                video_index = i;
                                break;
                            }
                        }

                        for (var i = 0; i <= video_index; i++) {
                            index = index + 1;
                            if (i == video_index) {
                                // 插入的最后一条
                                arg.splice(index, 0, {
                                    name: spacer.videos[i%video_len].name,
                                    start_time: arg[index - 1].end_time,
                                    end_time: arg[index].start_time,
                                    duration: arg[index].start_time - arg[index - 1].end_time,
                                    video_id: spacer.videos[i%video_len].id,
                                    live_stream_id: null
                                });
                                if (arg[0].type == 'intercut_play') {
                                    arg[index].type = 'intercut_play'
                                } else {
                                    arg[index].type = 'order_play'
                                }
                            } else {
                                arg.splice(index, 0, {
                                    name: spacer.videos[i%video_len].name,
                                    duration: spacer.videos[i%video_len].duration,
                                    start_time: arg[index - 1].end_time,
                                    end_time: arg[index - 1].end_time + spacer.videos[i%video_len].duration,
                                    video_id: spacer.videos[i%video_len].id,
                                    live_stream_id: null
                                });
                                if (arg[0].type == 'intercut_play') {
                                    arg[index].type = 'intercut_play'
                                } else {
                                    arg[index].type = 'order_play'
                                }
                            }
                        }
                    }
                } else if(gap_time < spacer.duration){
                    // spacer.duration: 弹出层插入垫片总时长
                    // gap_time: 节目单中间空隙
                    // 垫片每条加起来总时长
                    var addtime = 0, video_index;

                    for (var i = 0; i < spacer.videos.length; i++) {
                        addtime += spacer.videos[i].duration;
                        if (addtime > gap_time) {
                            // 没有空隙
                            video_index = i;
                            break;
                        }
                    }

                    for (var i = 0; i <= video_index; i++) {
                        index = index + 1;
                        if (i == video_index) {
                            // 插入的最后一条
                            arg.splice(index, 0, {
                                name: spacer.videos[i].name,
                                start_time: arg[index - 1].end_time,
                                end_time: arg[index].start_time,
                                duration: arg[index].start_time - arg[index - 1].end_time,
                                video_id: spacer.videos[i].id,
                                live_stream_id: null
                            });
                            if (arg[0].type == 'intercut_play') {
                                arg[index].type = 'intercut_play'
                            } else {
                                arg[index].type = 'order_play'
                            }
                        } else {
                            arg.splice(index, 0, {
                                name: spacer.videos[i].name,
                                duration: spacer.videos[i].duration,
                                start_time: arg[index - 1].end_time,
                                end_time: arg[index - 1].end_time + spacer.videos[i].duration,
                                video_id: spacer.videos[i].id,
                                live_stream_id: null
                            });
                            if (arg[0].type == 'intercut_play') {
                                arg[index].type = 'intercut_play'
                            } else {
                                arg[index].type = 'order_play'
                            }
                        }
                    }

                } else if (gap_time >= spacer.duration && spacer.times == "one") {
                    for (var i = 0; i < spacer.videos.length; i++) {
                        index = index + 1;
                        arg.splice(index, 0, {
                            name: spacer.videos[i].name,
                            duration: spacer.videos[i].duration,
                            start_time: arg[index-1].end_time,
                            end_time: arg[index-1].end_time + spacer.videos[i].duration,
                            video_id: spacer.videos[i].id,
                            live_stream_id: null
                        });
                        if (arg[0].type == 'intercut_play') {
                            arg[index].type = 'intercut_play'
                        } else {
                            arg[index].type = 'order_play'
                        }
                    }
                }
            } else {
                for (var i = 0; i < spacer.videos.length; i++) {
                    index = index + 1;
                    arg.splice(index, 0, {
                        name: spacer.videos[i].name,
                        duration: spacer.videos[i].duration,
                        start_time: arg[index-1].end_time,
                        end_time: arg[index-1].end_time + spacer.videos[i].duration,
                        video_id: spacer.videos[i].id,
                        live_stream_id: null
                    });
                    if (arg[0].type == 'intercut_play') {
                        arg[index].type = 'intercut_play'
                    } else {
                        arg[index].type = 'order_play'
                    }
                }
            }
        },
        // 删除 + 顺播时间对齐
        init_delete: function(arg, index) {
            if (index == 0) {
                var flag_time = arg[index].start_time;
            } else {
                var flag_time = arg[index-1].end_time;
            }
            arg.splice(index, 1);
            for (var i = 0; i < arg.length; i++) {
                if(i >= index) {
                    if (i == index && arg[i].type != "timing") {
                        arg[i].start_time = flag_time;
                        arg[i].end_time = arg[i].start_time + arg[i].duration;
                    } else if (i > index && arg[i].type != "timing" ) {
                        arg[i].start_time = arg[i-1].end_time;
                        arg[i].end_time = arg[i].start_time + arg[i].duration;
                    } else if (arg[i].type == "timing") {
                        break;
                    }
                }
            }
        },
        // 向上移动
        init_moveUp: function(arg, index) {
            // 两节目中间时间间隔
            var gap_time = arg[index].start_time - arg[index-1].end_time;

            var temp_data = arg[index-1];
            arg[index-1] = arg[index];
            arg[index] = temp_data;

            arg[index-1].start_time = arg[index].start_time;
            arg[index-1].end_time = arg[index-1].start_time + arg[index-1].duration;
            arg[index].start_time = arg[index-1].end_time + gap_time;
            arg[index].end_time = arg[index].start_time + arg[index].duration;
        },
        // 向下移动
        init_moveDown: function(arg, index) {
            // 两节目中间时间间隔
            var gap_time = arg[index+1].start_time - arg[index].end_time;

            var temp_data = arg[index];
            arg[index] = arg[index+1];
            arg[index+1] = temp_data;

            arg[index].start_time = arg[index+1].start_time;
            arg[index].end_time = arg[index].start_time + arg[index].duration;
            arg[index+1].start_time = arg[index].end_time + gap_time;
            arg[index+1].end_time = arg[index+1].start_time + arg[index+1].duration;
        },
        // 重置index
        init_index: function(arg) {
            angular.forEach(arg, function(data, index) {
                data.index = index;
            })
        },
        // 播出时间点是否已被占用(若被占用返回true)
        is_same_start_time: function(arg, flag_time) {
            var len = arg.length;
            for (var i = 0; i < len; i++) {
                if (arg[i].start_time == flag_time) {
                    return true;
                }
            }
            return false;
        },
        // 插入节目时间段是否被占用(不能添加返回true)
        notInsert: function(arg, item) {
            var len = Object.size(arg);
            if (len>0) {
                for (var i = 0; i < len; i++) {
                    if ((parseInt(item.start_time/1000) >= parseInt(arg[i].start_time/1000) && parseInt(item.start_time/1000) < parseInt(arg[i].end_time/1000)) ||
                        (parseInt(item.end_time/1000) > parseInt(arg[i].start_time/1000) && parseInt(item.end_time/1000) <= parseInt(arg[i].end_time/1000)) ||
                        (parseInt(arg[i].start_time/1000) >= parseInt(item.start_time/1000) && parseInt(arg[i].start_time/1000) < parseInt(item.end_time/1000)) ||
                        (parseInt(arg[i].end_time/1000) > parseInt(item.start_time/1000) && parseInt(arg[i].end_time/1000) <= parseInt(item.end_time/1000))){
                        return {
                            bFlag: true,
                            tip: absolute_seconds_to_YYYYmmdd_hhmmss(arg[i].start_time) + "---"
                            + absolute_seconds_to_YYYYmmdd_hhmmss(arg[i].end_time) + "时间段已被占用"
                        };
                    }
                }
            }
            return {
                bFlag: false
            }
        },
        // 允许插入情况下插入节目
        insert_program: function(arg, item) {
            var len = Object.size(arg);
            if (len == 0) {
                arg.push(item);
                return false;
            }
            if (item.end_time <= arg[0].start_time) {
                arg.unshift(item);
            } else if (item.start_time >= arg[len-1].end_time) {
                arg.push(item);
            } else {
                for (var i = 0; i < len; i++) {
                    if (item.start_time >= arg[i].end_time && item.end_time <= arg[i+1].start_time){
                        arg.splice(i+1, 0, item);
                        break;
                    }
                }
            }
        },
        // 插播时间段是否被占用(若被占用返回true)
        is_invalid_play_duration: function(insert_range, ranges) {
            var len = ranges.length;
            for (var i = 0; i < len; i++) {
                if ((insert_range.start_time >= ranges[i][0] && insert_range.start_time < ranges[i][1]) ||
                    (insert_range.end_time > ranges[i][0] && insert_range.end_time <= ranges[i][1])) {
                    return true;
                }
            }
        },
        // 能否向上移动(允许向上移动返回true) 能否向下移动(允许向下移动返回true)
        canMove: function(arg) {
            var len = arg.length;
            angular.forEach(arg, function(data, index) {
                if (index > 0 && ((data.type == "order_play" && arg[index-1].type == "order_play")
                    || data.type == "intercut_play")) {
                    data.canMoveUp = true;
                } else {
                    data.canMoveUp = false;
                }

                if (arg[index+1]) {
                    if (((data.type == "order_play" && arg[index+1].type == "order_play") || data.type == "intercut_play") && index < len) {
                        data.canMoveDown = true;
                    } else {
                        data.canMoveDown = false;
                    }
                } else {
                    data.canMoveDown = false;
                }
            });
        },
        // 插播是否在顺播/定时播节目单时间段之外（若是则返回true)
        intercut_to_empty_proamgs: function(insert_item, ranges) {
            var len = Object.size(ranges);
            if (len == 0) {
                return true;
            }
            else {
                var num = 0;
                for (var i = 0; i < len; i++) {
                    if (!((insert_item.start_time >= ranges[i][0] && insert_item.start_time < ranges[i][1])
                        || (insert_item.end_time > ranges[i][0] && insert_item.end_time <= ranges[i][1]))) {
                        num++;
                    }
                }
                if (num == len) {
                    return true;
                } else {
                    return false;
                }
            }
        },
        //  查询空隙位置
        search_gap: function(arg) {
            var len = Object.size(arg);
            if (len <= 1) {
                return {bFlag: false};
            }
            var obj = {
                bFlag: false,
                arr: []
            };
            angular.forEach(arg, function(data, index) {
                if (index != len-1) {
                    if (data.end_time != arg[index+1].start_time) {
                        obj.bFlag = true;
                        obj.arr.push(data.name);
                    }
                }
            });
            return obj;
        },
        // 重置所有input状态和时间
        // add by ws
        init_input_time: function(arg) {
            angular.forEach(arg, function(data) {
                delete data.check;
                delete data.disabled;
            });
            // 首项不需要调整
            for (var i = 1; i < arg.length; i++) {
                var item = arg[i];
                if (item.type == "timing") continue;
                item.start_time = arg[i-1].end_time;
                item.end_time = item.start_time + item.duration;
            }
        }
    }
});

bls_service.service('add_programs', function() {
   return {
       check_type: function($scope, arg) {
           angular.forEach(arg, function(data) {
               if (data.type == "intercut_play") {
                   $scope.has_intercut_play = true;
               }
               if (data.type == "timing" || data.type == "order_play") {
                   $scope.has_except_intercut_play = true;
               }
           });
       }
   }
});

bls_service.service('odd_datepicker', function() {
    return {
        date: function($scope) {
            $scope.odd_status = false;
            $scope.format = 'yyyy/MM/dd';
            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1,
                showWeeks: false
            };
            $scope.odd_date = new Date();
            $scope.open_datepicker = function() {$scope.odd_status = true};
        }
    }
});

bls_service.service('datepicker', function() {
    return {
        init_date: function($scope) {
            $scope.status = {
                start_opened: false,
                end_opened: false
            };
            $scope.format = 'yyyy/MM/dd';
            $scope.dateOptions = {
                dateDisabled: disabled,
                formatYear: 'yy',
                startingDay: 1,
                showWeeks: false
            };
            $scope.start_dt = new Date();
            $scope.end_dt = new Date();
            // Disable weekend selection
            function disabled(data) {
                var date = data.date,
                    mode = data.mode;
                if ($scope.status.start_opened) {
                    return mode === 'day' && (date < new Date(get_current_day_time_zero_stamp() - 86400000 * 30 * 6)
                        || date >= new Date($scope.end_dt.getTime() + 86400000));
                } else {
                    return mode === 'day' && (date <= new Date($scope.start_dt.getTime() - 86400000));
                }
            }
            $scope.open_datepicker = function(sign) {
                (sign == 'start') ? $scope.status.start_opened = true : $scope.status.end_opened = true;
            };
        }
    }
});

bls_service.service('datepicker_14', function() {
    return {
        init_date: function($scope, flag_time) {
            $scope.status = {
                start_opened: false,
                end_opened: false
            };
            $scope.format = 'yyyy/MM/dd';
            $scope.dateOptions = {
                dateDisabled: disabled,
                formatYear: 'yy',
                startingDay: 1,
                showWeeks: false
            };
            $scope.start_dt = new Date();
            $scope.end_dt = new Date();
            // Disable weekend selection
            function disabled(data) {
                var date = data.date,
                    mode = data.mode;
                if ($scope.status.start_opened) {
                    return mode === 'day' && (date >= new Date($scope.end_dt.getTime() + 86400000) ||
                        date < new Date(get_current_day_time_zero_stamp()));
                } else {
                    return mode === 'day' && (date <= new Date($scope.start_dt.getTime() - 86400000));
                }
            }
            $scope.open_datepicker = function(sign) {
                (sign == 'start') ? $scope.status.start_opened = true : $scope.status.end_opened = true;
            };
        }
    }
});

bls_service.service('third_menu', function() {
    return function(list, num) {
        /**
         * num为2时适用素材管理素材类别、编单添加素材、垫片， 为3时适用频道类别。
         * **/
        var arr = [];
        function menu(list, num, str) {
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                if (str === undefined || item.level == num) {
                    str = item.name;
                } else if (i == 0){
                    str += "/" + item.name;
                } else {
                    str = str.substring(0, str.lastIndexOf("/")) + "/" + item.name;
                }
                arr.push({name: str, id: item.id});
                if (item.child_menu) {
                    menu(item.child_menu, num, str);
                }
            }
            return arr;
        }
        return menu(list, num);
    }
});

bls_service.provider('bls_http_error', [function() {
    this.$get = ['$rootScope', 'growl', function($rootScope, growl) {
        return {
            http_error_handler: function(result, status) {
                $rootScope.$broadcast('bls_on_error', result, status);
            },
            /*
             event: obj // angularjs http event obj
             code: number
             // 如果http请求不正确，那么只有status值，没有code值，code值为null
             // 如果请求正确，但服务器返回错误，那么status为200，code值
             status: number // http response or request status，例如200, 401
             **/
            on_response_error: function($scope, callback) {
                $scope.$on('bls_on_error', function(event, result) {
                    growl.addErrorMessage(result, {ttl: bls_prompt.error});
                    callback && callback();
                });
            }
        };
    }];
}]);

// intercept http error
bls_service.factory('MHttpInterceptor', ['$q', 'bls_http_error', function($q, bls_http_error) {
    // register the interceptor as a service
    // @see: https://code.angularjs.org/1.2.0-rc.3/docs/api/ng.$http
    // @remark: the function($q) should never add other params.
    return {
        'request': function(config) {
            return config || $q.when(config);
        },
        'requestError': function(rejection) {
            return $q.reject(rejection);
        },
        /*
         response: {
         config: obj
         data: {
         code: 400, // http response code
         data: obj // http response data
         },
         headers:  function,
         status: 200, // http response status
         statusText: "OK"
         }
         **/
        'response': function(response) {
            // 验证权限跳转→登录页面
            if (response.data.status && response.data.status == Errors.redirect) {
                window.location.href = response.data.result + '?next=' + BLS_ROOT;
            }

            if (response.data.status && response.data.status != Errors.success) {
                bls_http_error.http_error_handler(response.data.result, response.status);
                return $q.reject(response.data.result);
            }
            return response || $q.when(response);
        },
        /*
         rejection: {
         data: string, // http response data
         status: 401, // http response status
         config: obj,
         headers:  function,
         statusText: "Unauthorized"
         }
         **/
        'responseError': function(rejection) {
            bls_http_error.http_error_handler(null, rejection.status);
            return $q.reject(rejection.status);
        }
    };
}]);

bls_service.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('MHttpInterceptor')
}]);