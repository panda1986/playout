"use strict";
bravo_bls.controller("checkCtrl", ["$rootScope", "$scope", "$state", function($rootScope, $scope, $state) {
    $scope.vod = $rootScope.app.top_nav.VODcheck;
    $scope.live = $rootScope.app.top_nav.liveCheck;
    $scope.editPrograms = $rootScope.app.top_nav.editProCheck;
    if ($scope.vod) {
        $state.go('bls.check.vod');
    } else if ($scope.live) {
        $state.go('bls.check.live');
    } else{
        $state.go('bls.check.editPrograms');
    }
}]);