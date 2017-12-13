/* global ngapp, xelib, modulePath */
ngapp.service('exampleService', function() {
    this.helloWorld = function() {
        console.log('Hello World!');
    };
});
ngapp.controller('exampleSettingsController', function($scope) {
    $scope.printMessage = function() {
        console.log($scope.settings.exampleModule.message);
    };
});

ngapp.run(function(exampleService, settingsService) {
    exampleService.helloWorld();

    settingsService.registerSettings({
        label: 'Example Module',
        templateUrl: `${modulePath}/partials/exampleSettings.html`,
        controller: 'exampleSettingsController',
        defaultSettings: {
            message: 'HI!'
        }
    });
});