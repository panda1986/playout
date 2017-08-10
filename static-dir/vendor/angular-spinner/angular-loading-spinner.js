(function(){
    angular.module('ngLoadingSpinner', ['angularSpinner'])
        .directive('usSpinner', ['$http', '$rootScope' ,function ($http, $rootScope){
            return {
                link: function (scope, elm, attrs) {
                    $rootScope.spinnerActive = false;
                    scope.isLoading = function () {
                        return $http.pendingRequests.length > 0;
                    };
                    scope.$watch(scope.isLoading, function (loading){
                        $rootScope.spinnerActive = loading;
                        if (loading) {
                            // 出现
                            if (bls_refresh.is_spinner) {
                                elm.removeClass('ng-hide');
                            }
                        } else {
                            // 消失
                            elm.addClass('ng-hide');
                        }
                    });
                }
            };
        }]);
}).call(this);