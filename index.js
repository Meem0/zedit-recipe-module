/* global ngapp, xelib, modulePath */
//= require ./src/exampleService.js
//= require ./src/exampleSettings.js
//= require ./src/editRecipeModal.js

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
