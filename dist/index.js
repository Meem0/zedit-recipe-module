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
ngapp.controller('editRecipeModalController', function($scope) {
    // initialize scope variables
    $scope.message = 'ayy lets make some recipes';

    // scope functions
    $scope.closeModal = function() {
        patcherService.saveSettings();
        $scope.$emit('closeModal');
    };
});

const openEditRecipeModal = function(scope) {
    scope.$emit('openModal', 'editRecipe', {
        basePath: `${modulePath}/partials`
    });
};

ngapp.run(function(exampleService, settingsService) {
    exampleService.helloWorld();

    settingsService.registerSettings({
        label: 'Example Module',
        templateUrl: `${modulePath}/partials/exampleSettings.html`,
        controller: 'exampleSettingsController',
        defaultSettings: {
            exampleModule: {
                message: 'HI!'
            }
        }
    });
});

ngapp.run(function(contextMenuFactory) {
    let menuItems = contextMenuFactory.treeViewItems;
    menuItems.push({
        id: 'Edit Recipe',
        visible: () => { return true; },
        build: (scope, items) => {
            items.push({
                label: 'Edit Recipe',
                callback: () => openEditRecipeModal(scope)
            });
        }
    });
});
