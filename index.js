/* global ngapp, xelib, modulePath */
//= require ./src/exampleService.js
//= require ./src/exampleSettings.js
//= require ./src/editRecipeModal.js

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
        visible: (scope) => {
            if (scope.selectedNodes.length === 1) {
                let selectedNode = scope.selectedNodes[0];
                if (!selectedNode.can_expand) {
                    let sig = xelib.Signature(selectedNode.handle);
                    if (sig === 'WEAP' || sig === 'ARMO') {
                        return true;
                    }
                }
            }
            return false;
        },
        build: (scope, items) => {
            items.push({
                label: 'Edit Recipe',
                callback: () => {
                    scope.$emit('openModal', 'editRecipe', {
                        basePath: `${modulePath}/partials`,
                        handle: scope.selectedNodes[0].handle
                    });
                }
            });
        }
    });
});
