'use strict';
var bls_directive = angular.module("bls_directive", []);

/* Nav toggle */
bls_directive.directive('navToggle', function() {
    return {
        restrict: 'EA',
        link: function (scope, element, attr) {
            var _this;
            element.click(function() {
                _this = $(this);
                if (_this.hasClass("u-unfold")) {
                    _this.removeClass("u-unfold");
                    $(".g-sd1").show();
                    $(".g-hd,.g-mn1").css({"marginLeft": "210px"});
                } else {
                    _this.addClass("u-unfold");
                    $(".g-sd1").hide();
                    $(".g-hd,.g-mn1").css({"marginLeft": "0"});
                }
            });
        }
    };
});

bls_directive.directive('restoreNav', function () {
    return {
        restrict: 'EA',
        link: function (scope, element, attr) {
            element.click(function() {
                $(".m-spirit.u-fold").removeClass("u-unfold");
                $(".g-sd1").show();
                $(".g-hd,.g-mn1").css({"marginLeft": "210px"});
            });
        }
    };
});

/**
 *  The ng-thumb directive
 *  Angular File Upload module does not include this directive
 *  Only for show imgage-preview
 */
bls_directive.directive('ngThumb', ['$window', function($window) {
    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function(item) {
            return angular.isObject(item) && item instanceof $window.File;
        },
        isImage: function(file) {
            var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    };

    return {
        restrict: 'A',
        template: '<canvas/>',
        link: function(scope, element, attributes) {
            if (!helper.support) return;

            var params = scope.$eval(attributes.ngThumb);

            if (!helper.isFile(params.file)) return;
            if (!helper.isImage(params.file)) return;

            var canvas = element.find('canvas');
            var reader = new FileReader();

            reader.onload = onLoadFile;
            reader.readAsDataURL(params.file);

            function onLoadFile(event) {
                var img = new Image();
                img.onload = onLoadImage;
                img.src = event.target.result;
            }

            function onLoadImage() {
                var width = params.width || this.width / this.height * params.height;
                var height = params.height || this.height / this.width * params.width;
                canvas.attr({ width: width, height: height });
                canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
            }
        }
    };
}]);

/* 左右选择器 */
bls_directive.directive('multiSelect', function() {
    return {
        restrict: 'E',
        scope: {
            items: '=',
            selected: '=',
            leftTitle: '@',
            rightTitle: '@'
        },
        template: '<label>' +
                   '   <table>' +
                   '        <tr>' +
                   '            <th>{{leftTitle}}</th>' +
                   '            <th>{{rightTitle}}</th>' +
                   '        </tr>' +
                   '        <tr class="switch-box">' +
                   '            <td>' +
                   '               <div class="ent-box">' +
                   '                   <switchitem ng-repeat="(key, value) in items" ng-if="!isSelected(key)" value="value" ng-click="switchItem(key)"></switchitem>' +
                   '               </div>' +
                   '            </td>' +
                   '            <td>' +
                   '                <div class="ent-box">' +
                   '                    <switchitem ng-repeat="(key, value) in items" ng-if="isSelected(key)" value="value" ng-click="switchItem(key)"></switchitem>' +
                   '                </div>' +
                   '            </td>' +
                   '        </tr>' +
                   '    </table>' +
                   '</label>',
        link: function(scope) {
            scope.switchItem = function(item) {
                var index = scope.selected.indexOf(item);
                if (index == -1) {
                    // add
                    scope.selected.push(item);
                } else {
                    // remove
                    scope.selected.splice(index, 1);
                }
            };
            scope.isSelected = function(item) {
                return (scope.selected.indexOf(item) > -1);
            }
        }
    };
});
bls_directive.directive('switchitem', function() {
    return {
        restrict: 'E',
        scope: {
            value: '='
        },
        template: '<div>{{value}}</div>'
    };
});

/**
 * Modal drag
 */
bls_directive.directive('modalDialog', function() {
    return {
        restrict: 'AC',
        link: function (scope, element, attr) {
            var head = element.find(".modal-header");
            head.bind('mousedown', function(ev) {
                var disX = ev.clientX - element[0].offsetLeft;
                var disY = ev.clientY - element[0].offsetTop;
                var nMaxTop = document.documentElement.clientHeight - element[0].offsetHeight;
                var nMaxLeft = document.documentElement.clientWidth - element[0].offsetWidth;
                function fnMove(ev) {
                    var left = ev.clientX - disX;
                    var top = ev.clientY - disY;
                    if (left < 0) {
                        left = 0;
                    } else if (left > nMaxLeft) {
                        left = nMaxLeft;
                    }
                    if (top < 0) {
                        top = 0;
                    } else if (top > nMaxTop) {
                        top = nMaxTop;
                    }
                    element.css({
                        left: left + 'px',
                        top: top + 'px'
                    });
                }
                function fnUp() {
                    $(document).unbind('mousemove', fnMove);
                    $(document).unbind('mouseup', fnUp);
                }
                $(document).bind('mousemove', fnMove);
                $(document).bind('mouseup', fnUp);
            });

            window.onresize = function() {
                element.css({
                    left: ($(document).width() - element.outerWidth()) / 2 + 'px',
                    top: '61px'
                });
            };
        }
    };
});