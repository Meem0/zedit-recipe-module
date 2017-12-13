ngapp.controller('exampleSettingsController', function($scope) {
    $scope.printMessage = function() {
        console.log($scope.settings.exampleModule.message);
    };
});