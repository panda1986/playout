'use strict';
var bpo_filter = angular.module("bpo_filter", []);

bpo_filter.filter('userStatus', function() {
    return function(data) {
        if (data == 1) {
            return "已启用";
        } else if (data == 0) {
            return "已禁用"
        } else {
            return "——";
        }
    };
});

bpo_filter.filter('channelStatus', function() {
    return function(data) {
        if (data == 1) {
            return "启用";
        } else if (data == 0) {
            return "禁用"
        } else {
            return "——";
        }
    };
});

bpo_filter.filter('channelStatusOperation', function() {
    return function(data) {
        if (data == 1) {
            return "禁用";
        } else if (data == 0) {
            return "启用"
        } else {
            return "——";
        }
    };
});

bpo_filter.filter('userStatusOperation', function() {
    return function(data) {
        if (data == 1) {
            return "禁用";
        } else if (data == 0) {
            return "启用"
        } else {
            return "——";
        }
    };
});

bpo_filter.filter('bps', function() {
    return function(bps_v) {
        if (bps_v == undefined || bps_v == null) {
            return "——";
        }
        var bps_human = {};
        var network_kb = parseFloat(bps_v);
        var mb = parseFloat(network_kb / 1000);
        var gb = parseFloat(mb / 1000);
        if ((network_kb) > 1) {
            if (mb > 1) {
                if (gb > 1) {
                    bps_human.value = gb.toFixed(1);
                    bps_human.unit = "G";
                    return bps_human.value + bps_human.unit;
                }
                bps_human.value = mb.toFixed(1);
                bps_human.unit = "M";
                return bps_human.value + bps_human.unit;
            }
            bps_human.value = network_kb.toFixed(1);
            bps_human.unit = "K";
            return bps_human.value + bps_human.unit;
        }
        bps_human.value = bps_v;
        bps_human.unit = "";
        return bps_human.value + bps_human.unit;
    }
});

bpo_filter.filter('str2boolean', function() {
    return function(input) {
        return Boolean(parseInt(input));
    };
});

bpo_filter.filter("seconds_to_hhmmss", function() {
    return function(seconds) {
        if (seconds == null || seconds == undefined) {
            return "——";
        }
        var seconds = Number(seconds);
        var hh = (seconds / 3600) >= 1 ? Math.floor(seconds / 3600) : 0;
        var mm = ((seconds - hh * 3600) / 60) >= 1 ? Math.floor((seconds - hh * 3600) / 60) : 0;
        var ss = seconds - hh * 3600 - mm * 60;
        if (hh < 100) {
            return padding(hh, 2, '0') + ':' + padding(mm, 2, '0') + ':' + padding(ss, 2, '0');
        }
        return hh + ':' + padding(mm, 2, '0') + ':' + padding(ss, 2, '0');
    }
});

bpo_filter.filter("millseconds_to_hhmmss", function() {
    return function(seconds) {
        var seconds = Number(seconds)/1000;
        var hh = (seconds / 3600) >= 1 ? Math.floor(seconds / 3600) : 0;
        var mm = ((seconds - hh * 3600) / 60) >= 1 ? Math.floor((seconds - hh * 3600) / 60) : 0;
        var ss = parseInt(seconds - hh * 3600 - mm * 60);
        if (hh < 100) {
            return padding(hh, 2, '0') + ':' + padding(mm, 2, '0') + ':' + padding(ss, 2, '0');
        }
        return hh + ':' + padding(mm, 2, '0') + ':' + padding(ss, 2, '0');
    }
});

bpo_filter.filter("statusCN", function() {
    return function(status){
        if (status == 0) {
            return '未审批';
        } else if (status == 1) {
            return '已通过';
        } else {
            return '未通过';
        }
    }
});

bpo_filter.filter('videoStatus', function() {
    return function(str) {
        var array = str.split(",");
        if (array[0] != "转码") {
            switch (parseInt(array[1])) {
                case 0: return "等待中";
                case 1: return "审核中";
                case 2: return "通过";
                case 3: return "未通过";
                default: return "——";
            }
        } else {
            switch (parseInt(array[1])) {
                case 0: return "等待中";
                case 1: return "转码中";
                case 2: return "转码成功";
                case 3: return "转码失败";
                default: return "——";
            }
        }
    };
});

//　视频大小
bpo_filter.filter("CalculateBUnit", function() {
    return function(network) {
        var kb = parseInt(network / 1024);
        var mb = parseInt(network / 1024 / 1024);
        var gb = network / 1024 / 1024 / 1024;
        var tb = network / 1024 / 1024 / 1024 / 1024;

        // sometimes, mb/gb is 0, but tb is not 0.
        if (kb > 0) {
            if (mb > 0) {
                if (gb > 1) {
                    if (tb > 1) {
                        return tb.toFixed(2) + 'TB';
                    }
                    return gb.toFixed(2) + 'GB';
                }
                return mb + 'MB';
            }
            return kb + 'KB'
        }
        return network + 'B';
    }
});

// 星期
bpo_filter.filter("format_week", function() {
    return function(arg) {
        var fmt;
        switch (arg) {
            case 0: fmt="周日"; break;
            case 1: fmt="周一"; break;
            case 2: fmt="周二"; break;
            case 3: fmt="周三"; break;
            case 4: fmt="周四"; break;
            case 5: fmt="周五"; break;
            case 6: fmt="周六"; break;
        }
        return fmt;
    }
});

bpo_filter.filter("program_type", function() {
    return function(arg) {
        if (arg == "timing") {
            return "定时播";
        } else if (arg == "order_play") {
            return "顺播";
        } else if (arg == "intercut_play") {
            return "插播";
        } else {
            return "——";
        }
    }
});

bpo_filter.filter("filterDuration", function() {
    return function(str) {
        if (!str) return "——";
        return str;
    }
});

bpo_filter.filter('transcodeStatus', function() {
    return function(num) {
        if (num == 0) {
            return '未开始';
        } else if (num == 1) {
            return '进行中';
        } else if (num == 2) {
            return '已完成';
        } else if (num == 3) {
            return '出错';
        }
    };
});

bpo_filter.filter("filterStatus", function() {
    return function(arg) {
        if (arg == "running") {
            return "在播";
        } else if (arg == "fail") {
            return "异常";
        } else if (arg == "error") {
            return "故障";
        } else {
            return "——";
        }
    }
});

bpo_filter.filter("BroadcastStatus", function() {
    return function(arg) {
        if (arg == "success") {
            return "完成";
        } else if (arg == "ready") {
            return "就绪";
        } else if (arg == "fail") {
            return "播放失败";
        } else if (arg == "terminal") {
            return "中断";
        } else if (arg == "playing") {
            return "正在播放";
        } else {
            return "——";
        }
    }
});

bpo_filter.filter("filterNull", function() {
    return function(str) {
        if (str == null || !str.length) return "——";
        return str;
    }
});

bpo_filter.filter("line_status", function() {
   return function(str) {
       if (str == "online") {
           return "在线";
       } else if (str == "offline") {
           return "离线";
       } else if (str == "overload") {
            return "过载";
       } else {
           return "——";
       }
   }
});

bpo_filter.filter("ip_separate", function() {
    return function(arr) {
        var len = Object.size(arr);
        if (len == 1) {
            return arr[0];
        } else if (len > 1) {
            return arr.join(",");
        } else {
            return "——";
        }
    }
});

bpo_filter.filter("import_status", function() {
    return function(arg) {
        if (arg === 0) {
            return "等待导入";
        } else if (arg === 1){
            return "导入中";
        } else if (arg === 2){
            return "导入完成";
        } else if (arg === 3) {
            return "导入失败";
        } else {
            return "——"
        }
    }
});

bpo_filter.filter("status_show", function() {
   return function(arg) {
       if (typeof arg == "number") {
           return true;
       } else {
           return false;
       }
   }
});

bpo_filter.filter("live_status", function() {
    return function(arg) {
        if (arg == 0) {
            return "未审核";
        } else if (arg == 2) {
            return "已通过";
        } else if (arg == 3) {
            return "未通过";
        } else {
            return "——";
        }
    }
});