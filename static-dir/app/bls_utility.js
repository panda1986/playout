/**
 * 获取登录后显示页面首页及权限
 */
/** XXX 版本更新时请更改bls_version参数，以更新客户端代码（index.html中utility.js也要改） **/
var bls_version = '?version=1ad633106c20170804';
var top_nav = {};
var dashboard = {};
var get_menu_list = function() {
    $.ajax({
        url: "/accounts/ajax/get_menu_list/",
        type: 'post',
        data: {m_type: 0},
        async: false,
        success: function(data) {
            if (data.status != 'success') {
                window.location.href = UMS_ROOT + '/accounts/login/?next=' + BLS_ROOT;
            }
            for (var i = 0; i < data.result.length; i++) {
                var item = data.result[i];
                switch (item.name) {
                    case "素材管理":
                        top_nav.material = true;
                        break;
                    case "审批管理":
                        top_nav.check = true;
                        angular.forEach(item.child_menu, function(data) {
                            if (data.name == "素材审核" && data.selected) {
                                top_nav.VODcheck = true;
                            }
                            if (data.name == "直播源审核" && data.selected) {
                                top_nav.liveCheck = true;
                            }
                            if (data.name == "编单审核" && data.selected) {
                                top_nav.editProCheck = true;
                            }
                        });
                }
            }

            // todo ;
            //for (var i = 0; i < data.result.length; i++) {
            //    var item = data.result[i];
            //    if (item.selected) {
            //        dashboard.otherwise = item.name;
            //        dashboard.vms_nav_menu = data.result;
            //        break;
            //    }
            //}

            // todo delete it
            for (var i = 0; i < data.result.length; i++) {
                var item = data.result[i];
                if (item.name == ('素材管理' || '审批管理') && item.selected) {
                    dashboard.otherwise = item.name;
                    dashboard.vms_nav_menu = data.result;
                    break;
                }
            }

        },
        error: function(data) {
            window.location.href = UMS_ROOT + '/accounts/login/?next=' + BLS_ROOT;
        }
    });
};

var bls_http_api = {
    accounts: "/accounts/ajax/",
    channel: "/channel/ajax/",
    video: "/video/ajax/"
};

var bls_refresh = {
    interval: 5000,
    is_spinner: true
};

var bls_prompt = {
    success: 5000,
    error: 8000
};

var Errors = {
    'success': "success",
    'redirect': "redirect", // 重定向
    'ui_unauthorized': 401,
    'ui_not_allowed': 403,
    'ui_not_found': 404,
    'ui_interface_url_error': 500
};

function get_token() {
    var current_href, token;
    current_href = window.location.href;
    if (current_href.indexOf("token=") < 0) {
        window.location.href = UMS_ROOT + '/accounts/login/?next=' + BLS_ROOT;
    }
    token = current_href.split("token=")[1];
    if (token.indexOf("#/bls")) {
        token = token.split("#/bls")[0];
    }
    return token;
}

var bufferTime = 1.2;
function srs_get_version_code() {
    return "1.0";
}
/**
 * srsplayer
 * @param: id      player box
 * @param: url     player url
 * @param: volume  sound volume
 * @param: width   player box width
 * @param: height  player box height
 */
function player_init(id, url, volume, width, height) {
    var srs_player = new SrsPlayer(id, width, height);
    srs_player.on_player_ready = function() {
        srs_player.set_bt(bufferTime);
        srs_player.play(url, volume);
    };
    srs_player.start();

    srs_player.on_player_metadata = function() {
        srs_player.set_fs("screen", 100);
    };
}

/**
 * 获取当天零点时间戳
 * for example, (2014-01-08 10:01:20 GMT+0800) formated to 1389110400
 */
function get_current_day_time_zero_stamp() {
    var date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    var time = date.getTime();
    return time;
}

/**
 * 获取指定时间零点时间戳
 * for example, (2014-01-08 10:01:20 GMT+0800) formated to 1389110400
 */
function get_appoint_day_time_zero(time) {
    var date = new Date(time);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    var time = new Date(date.getTime());
    return time;
}

function absolute_seconds_to_YYYYmmdd_hhmm(seconds) {
    var date = new Date();
    date.setTime(Number(seconds) * 1000);

    var ret = date.getFullYear()
        + "-" + padding(date.getMonth() + 1, 2, '0')
        + "-" + padding(date.getDate(), 2, '0')
        + " " + padding(date.getHours(), 2, '0')
        + ":" + padding(date.getMinutes(), 2, '0');

    return ret;
}

function seconds_to_hhmmss(seconds) {
    var seconds = Number(seconds);
    var hh = (seconds / 3600) >= 1 ? Math.floor(seconds / 3600) : 0;
    var mm = ((seconds - hh * 3600) / 60) >= 1 ? Math.floor((seconds - hh * 3600) / 60) : 0;
    var ss = parseInt(seconds - hh * 3600 - mm * 60);
    if (hh < 100) {
        return padding(hh, 2, '0') + ':' + padding(mm, 2, '0') + ':' + padding(ss, 2, '0');
    }
    return hh + ':' + padding(mm, 2, '0') + ':' + padding(ss, 2, '0');
}

/**
 * 视频大小格式化
 * for example, 1024KB formated to 1MB
 * **/
function calculateBUnit(arg) {
    var kb = parseInt(arg / 1024);
    var mb = parseInt(arg / 1024 / 1024);
    var gb = arg / 1024 / 1024 / 1024;
    var tb = arg / 1024 / 1024 / 1024 / 1024;

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
    return arg + 'B';
}

// get current datetime in "YYYY-mm-dd HH:MM:SS"
function get_current_datetime() {
    var now = new Date().getTime() / 1000;
    return absolute_seconds_to_YYYYmmdd() + " " + absolute_seconds_to_HHMMSS();
}

/**
 * format absolute seconds to HH:MM:SS,
 * for example, 1389146480s (2014-01-08 10:01:20 GMT+0800) formated to 10:01:20
 * @see: http://blog.csdn.net/win_lin/article/details/17994347
 * @usage absolute_seconds_to_HHMMSS(new Date().getTime() / 1000)
 */
function absolute_seconds_to_HHMMSS(millseconds) {
    if (millseconds) {
        var date = new Date(millseconds);
    } else {
        var date = new Date();
    }

    var ret = padding(date.getHours(), 2, '0')
        + ":" + padding(date.getMinutes(), 2, '0')
        + ":" + padding(date.getSeconds(), 2, '0');

    return ret;
}
/**
 * fomat hhmms to seconds
 * for example, "00:01:00" formated to 60
 * **/
function hhmmss_to_seconds(str) {
    var arr = str.split(":");
    if (arr.length !=3) {
        console.error("type of arguments error, eg 01:29:30");
    }
    var ret = Number(arr[0])*3600 + Number(arr[1])*60 + Number(arr[2]);
    return ret;
}

function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}

/**
 * json长度
 * @param obj 用户输入需判断的json长度
 * return: size → json长度
 */
Object.size = function(obj) {
    var size = 0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
 * Mobile phone格式验证
 * @param str 用户输入需判断的手机格式
 * return: test自动判断并返回 true(通过) 或 false(不通过)
 */
function check_phone(str) {
    var reg = /^(13[0-9]|15[0-9]|17[01678]|18[0-9]|14[57])\d{8}$/;
    return reg.test(str);
}

/**
 * Telephone格式验证
 * @param str 用户输入需判断的固定电话格式
 * return: test自动判断并返回 true(通过) 或 false(不通过)
 */
function check_tel(str) {
    var reg = /^\d{3,4}-\d{7,8}$|^\d{3,4}-\d{7,8}-\d{1,4}$/;
    return reg.test(str);
}

/**
 * Email验证
 * @param str 用户输入需判断的邮箱格式
 * return: test自动判断并返回 true(通过) 或 false(不通过)
 */
function check_mail(str) {
    var reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
    return reg.test(str);
}

/**
 * Domain验证
 * @param str 用户输入需判断的服务名格式
 * return: test自动判断并返回 true(通过) 或 false(不通过)
 */
function check_domain_name(str) {
    var reg = /^[0-9a-zA-Z]+[0-9a-zA-Z\.-]*\.[a-zA-Z]{2,4}$/;
    return reg.test(str);
}

/**
 * Upyun服务名验证(字母开头，字母数字组合，5~20位)
 * @param str 用户输入需要判断的服务名格式
 * return: test自动判断并返回 true(通过) 或 false(不通过)
 */
function check_upyun_service(str) {
    var reg = /^[a-z][a-z0-9\-]{4,19}$/;
    return reg.test(str);
}

/**
 * 获取数值，如果是小数，保留length位。如果是整数，返回整数
 * @param num    数值
 * @param length 保留位数
 */
function get_num_decimal_value(num, length) {
    return num == parseInt(num) ? num : num.toFixed(length);
}

// 字符串是否包含' '
function is_empty_str(str) {
    return (str.indexOf(' ') > 0) ? '' : str;
}

/**
 * get time string by date.
 * time: standard time; Tue Oct 13 2015 14:54:28 GMT+0800 (中国标准时间)
 */
function get_time_string_by_standard_time(time) {
    return (time.getFullYear() + "-" + prepend_zero(time.getMonth() + 1) + "-" + prepend_zero(time.getDate()));
}

/**
 * 获取最近7天日期数组，例如：今天是"2015-12-21 00:00:00". ["2015-12-15 00:00:00", "2015-12-22 00:00:00"]
 */
function get_seven_days_before_array() {
    var weekStartDate = new Date(get_current_day_time_zero_timestamp() - 6 * 86400000);
    var weekEndDate = new Date(get_current_day_time_zero_timestamp() + 86400000);

    return [format_date(weekStartDate), format_date(weekEndDate)];
}

/**
 * 获取最近30天日期数组，例如：今天是"2015-12-21 00:00:00". ["2015-11-20 00:00:00", "2015-12-22 00:00:00"]
 */
function get_thirty_days_before_array() {
    var weekStartDate = new Date(get_current_day_time_zero_timestamp() - 29 * 86400000);
    var weekEndDate = new Date(get_current_day_time_zero_timestamp() + 86400000);

    return [format_date(weekStartDate), format_date(weekEndDate)];
}

/**
 * 给月份数字添加“0”，并转为字符串
 * @param num 需要处理的数字
 * return: 如果月份数字大于等于10，返回当前数字
 *         如果月份数字小于10，返回"0" + 当前数字
 */
function prepend_zero(num) {
    return parseInt(num) < 10 ? ("0" + num) : num;
}

/**
 * format timestamp date to data string.
 */
function format_date(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();

    return (year + "-" + prepend_zero(month) + "-" + prepend_zero(day));
}

/**
 * padding the output.
 * padding(3, 5, '0') is 00003
 * padding(3, 5, 'x') is xxxx3
 * @see http://blog.csdn.net/win_lin/article/details/12065413
 */
function padding(number, length, prefix) {
    if(String(number).length >= length){
        return String(number);
    }
    return padding(prefix + number, length, prefix);
}

/**
 * format absolute seconds to YYYY-mm-dd,
 * for example, 1389146480s (2014-01-08 10:01:20 GMT+0800) formated to 2014-01-08
 * @see: http://blog.csdn.net/win_lin/article/details/17994347
 * @usage absolute_seconds_to_YYYYmmdd(new Date().getTime() / 1000)
 */
function absolute_seconds_to_YYYYmmdd() {
    var date = new Date();

    var ret = date.getFullYear()
        + "-" + padding(date.getMonth() + 1, 2, '0')
        + "-" + padding(date.getDate(), 2, '0');

    return ret;
}

/**
 * get standard time by time string.
 * time: time string; 2015-12-11
 */
function get_standard_time_by_time_string(time) {
    var time_array = time.split("-");
    var string = time_array[0] + "/" + time_array[1] + "/" + time_array[2] + " 00:00:00";
    return new Date(string);
}

/**
 * get current day zero timestamp.
 */
var get_current_day_time_zero_timestamp = function() {
    var data = new Date();
    var year =  data.getFullYear();
    var month =  data.getMonth() + 1;
    var day = data.getDate();
    var string = year + "/" + month + "/" + day + " 00:00:00";
    return new Date(string).getTime();
};

/**
 * 根据日期获取当天0点时间戳。例如：date: 标准时间
 */
function get_zero_timestamp_by_date(date) {
    var year =  date.getFullYear();
    var month =  date.getMonth() + 1;
    var day = date.getDate();
    var string = year + "/" + month + "/" + day + " 00:00:00";
    return new Date(string).getTime();
}

/**
 * 根据日期获取6个月前今天的0点时间戳。例如：date: 标准时间
 */
function get_six_month_before_zero_timestamp() {
    var zero_timestamp = get_current_day_time_zero_timestamp();

    // TODO: 目前默认6个月前为6x30天
    return zero_timestamp - 6 * 30 * 24 * 3600000;
}

/**数组中name去重**/
function Array_name_unique(arr) {
    var res = [arr[0]];
    for(var i=0;i<arr.length;i++){
        var repeat = false;
        for(var j = 0;j<res.length;j++){
            if(arr[i].name == res[j].name){
                repeat = true;
                break;
            }
        }
        if(!repeat){
            res.push(arr[i]);
        }
    }
    return res;
}

/**中英文对应输出
 * 如 ["测试订单", "商务订单"] 与 ["test", "commerce"] 对应
 * 如 ["test", "commerce"] 与 ["测试订单", "商务订单"]   对应
 * "测试订单" 与 "test" 对应;
 * "test" 与 "测试订单" 对应;
 * 无检出结果返回为null,检索出一项则输出字符串，两项及两项以上则输出数组
 * **/
function SameIndexValue(value_from, array_from, array_to) {
    if((typeof value_from).toLowerCase() == "string") {
        var result = [];
        for(var k in array_from) {
            if(value_from == array_from[k]) {
                result.push(array_to[k]);
            }
        }
    } else if ((typeof value_from).toLowerCase() == "object"){
        var result = [];
        for(var j in value_from) {
            for(var m in array_from) {
                if(value_from[j] == array_from[m]) {
                    result.push(array_to[m]);
                }
            }
        }
    }
    if(Object.size(result) == 1){
        return result[0];
    } else if(Object.size(result) > 1) {
        return result;
    } else {
        return null;
    }
}

function formatYYYYmmdd(arg) {
    var date = new Date(arg);

    var ret = date.getFullYear()
        + "-" + padding(date.getMonth() + 1, 2, '0')
        + "-" + padding(date.getDate(), 2, '0');

    return ret;
}

function absolute_seconds_to_YYYYmmdd_hhmmss(arg) {
    if (arg) {
        var date = new Date(arg);
    } else {
        var date = new Date();
    }

    var ret = date.getFullYear()
        + "-" + padding(date.getMonth() + 1, 2, '0')
        + "-" + padding(date.getDate(), 2, '0')
        + " " + padding(date.getHours(), 2, '0')
        + ":" + padding(date.getMinutes(), 2, '0')
        + ":" + padding(date.getSeconds(), 2, '0');

    return ret;
}

// 图片展现显示
function getPath(obj, fileQuery, transImg) {
    var imgSrc = '', imgArr = [], strSrc = '';
    var file = fileQuery.files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
        imgSrc = fileQuery.value;
        imgArr = imgSrc.split('.');
        strSrc = imgArr[imgArr.length - 1].toLowerCase();
        if (strSrc.localeCompare('jpg') === 0 || strSrc.localeCompare('jpeg') === 0 || strSrc.localeCompare('gif') === 0 || strSrc.localeCompare('png') === 0) {
            obj.setAttribute("src", e.target.result);
        } else {
            //try{
            throw new Error('File type Error! please image file upload..');
            //}catch(e){
            // alert('name: ' + e.name + 'message: ' + e.message) ;
            //}
        }
    };
    reader.readAsDataURL(file);
}

/**
 * cookies
 */
function setCookie(name, value, iDay) {
    if (iDay) {
        var oDate = new Date();
        oDate.setDate(oDate.getDate() + iDay);
        document.cookie = name + "=" + value + ";path=/;expires=" + oDate;
    } else {
        document.cookie = name + "=" + value + ";path=/";
    }
}
function getCookie(name) {
    var array = document.cookie.split("; ");
    for (var i = 0; i < array.length; i++) {
        // value中有可能有=情况
        //var array2 = array[i].split("=");
        //if (array2[0] == name) {
        //    return array2[1];
        //}

        // str: 需返回的真实value值
        var array2 = array[i].split("=");
        var str = array[i].substring(array[i].indexOf("=") + 1);
        if (array2[0] == name) {
            return str;
        }
    }
    return "";
}
function hasCookie(name) {
    var array = document.cookie.split("; ");
    for (var i = 0; i < array.length; i++) {
        var array2 = array[i].split("=");
        if (array2[0] == name) {
            return true;
        }
    }
    return false;
}
function removeCookie(name) {
    setCookie(name, "abcd", -10);
}

/**
 * async refresh v2, support cancellable refresh, and change the refresh pfn.
 * @remakr for angularjs. if user only need jquery, maybe AsyncRefresh is better.
 * @see: http://blog.csdn.net/win_lin/article/details/17994347s
 * Usage:
 bsmControllers.controller('CServers', ['$scope', 'MServer', function($scope, MServer){
            async_refresh2.refresh_change(function(){
                // 获取服务器列表
                MServer.servers_load({}, function(data){
                    $scope.servers = data.data.servers;
                    async_refresh2.request();
                });
            }, 3000);

            async_refresh2.request(0);
        }]);
 bsmControllers.controller('CStreams', ['$scope', 'MStream', function($scope, MStream){
            async_refresh2.refresh_change(function(){
                // 获取流列表
                MStream.streams_load({}, function(data){
                    $scope.streams = data.data.streams;
                    async_refresh2.request();
                });
            }, 3000);

            async_refresh2.request(0);
        }]);
 */
function AsyncRefresh2() {
    /**
     * the function callback before call the pfn.
     * the protype is function():bool, which return true to invoke, false to abort the call.
     * null to ignore this callback.
     *
     * for example, user can abort the refresh by find the class popover:
     *      async_refresh2.on_before_call_pfn = function() {
     *          if ($(".popover").length > 0) {
     *              async_refresh2.request();
     *              return false;
     *          }
     *          return true;
     *      };
     */
    this.on_before_call_pfn = null;

    // use a anonymous function to call, and check the enabled when actually invoke.
    this.__call = {
        pfn: null,
        timeout: 0,
        __enabled: false,
        __handler: null
    };
}
// singleton
var async_refresh2 = new AsyncRefresh2();
/**
 * initialize or refresh change. cancel previous request, setup new request.
 * @param pfn a function():void to request after timeout. null to disable refresher.
 * @param timeout the timeout in ms, to call pfn. null to disable refresher.
 */
AsyncRefresh2.prototype.initialize = function(pfn, timeout) {
    this.refresh_change(pfn, timeout);
};
/**
 * stop refresh, the refresh pfn is set to null.
 */
AsyncRefresh2.prototype.stop = function() {
    this.__call.__enabled = false;
};
/**
 * restart refresh, use previous config.
 */
AsyncRefresh2.prototype.restart = function() {
    this.__call.__enabled = true;
    this.request(0);
};
/**
 * change refresh pfn, the old pfn will set to disabled.
 */
AsyncRefresh2.prototype.refresh_change = function(pfn, timeout) {
    // cancel the previous call.
    if (this.__call.__handler) {
        clearTimeout(this.__handler);
    }
    this.__call.__enabled = false;

    // setup new call.
    this.__call = {
        pfn: pfn,
        timeout: timeout,
        __enabled: true,
        __handler: null
    };
};
/**
 * start new request, we never auto start the request,
 * user must start new request when previous completed.
 * @param timeout [optional] if not specified, use the timeout in initialize or refresh_change.
 */
AsyncRefresh2.prototype.request = function(timeout) {
    var self = this;
    var this_call = this.__call;

    // clear previous timeout.
    if (this_call.__handler) {
        clearTimeout(this_call.__handler);
    }

    // override the timeout
    if (timeout == undefined) {
        timeout = this_call.timeout;
    }

    // if user disabled refresher.
    if (this_call.pfn == null || timeout == null) {
        return;
    }

    this_call.__handler = setTimeout(function(){
        // cancelled by refresh_change, ignore.
        if (!this_call.__enabled) {
            return;
        }

        // callback if the handler installled.
        if (self.on_before_call_pfn) {
            if (!self.on_before_call_pfn()) {
                return;
            }
        }

        // do the actual call.
        this_call.pfn();
    }, timeout);
};
