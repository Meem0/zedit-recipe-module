/* global ngapp, xelib, modulePath */

// global helpers
getFormIdFromLongName = function(longName) {
    let formIdStr = longName.substring(
        longName.lastIndexOf(':') + 1,
        longName.lastIndexOf(']')
    );
    let formId = parseInt(formIdStr, 16);
    return formId;
}

//= require ./src/*.js

ngapp.run(function($q, contextMenuFactory, recipeSerializeService, itemSignatureService) {
    let addNewRecipe = function(filename) {
        let recipeHandle = 0;
        if (filename === '< new file >') {
        }
        else {
            xelib.WithHandle(
                xelib.FileByName(filename), fileHandle => {
                    recipeHandle = xelib.AddElement(fileHandle, 'COBJ\\COBJ');
                }
            );
        }
        return recipeHandle;
    }

    let editRecipe = function(scope, handle) {
        let sig = xelib.Signature(handle);
        let recipeObject = {};
        let recipeHandle = 0;
        if (sig === 'COBJ') {
            recipeObject = recipeSerializeService.recordToObject(handle);
            recipeHandle = handle;
        }
        else if (itemSignatureService.getItemSignatures().includes(sig)) {
            recipeObject.createdObject = xelib.LongName(handle);
        }

        let recipeObjectBefore = recipeObject;
        let action = $q.defer();

        scope.$emit('openModal', 'editRecipe', {
            basePath: `${modulePath}/partials`,
            recipeObject: recipeObject,
            action: action
        });

        action.promise.then(recipeObject => {
            let writeRecordAction = recipeHandle => {
                recipeSerializeService.objectToRecord(recipeObject, recipeHandle);
                scope.$root.$broadcast('reloadGUI');
            };

            if (recipeHandle === 0) {
                let chooseFileAction = $q.defer();

                scope.$emit('openModal', 'chooseNewRecipeFile', {
                    basePath: `${modulePath}/partials`,
                    recipeObject: recipeObject,
                    action: chooseFileAction
                });

                chooseFileAction.promise.then(filename => {
                    xelib.WithHandle(
                        addNewRecipe(filename),
                        newRecipeHandle => {
                            writeRecordAction(newRecipeHandle);
                        }
                    );
                });
            }
            else {
                writeRecordAction(recipeHandle);
            }
        });
    }

    let menuItems = contextMenuFactory.treeViewItems;
    menuItems.push({
        id: 'Edit Recipe',
        visible: (scope) => {
            if (scope.selectedNodes.length === 1) {
                let selectedNode = scope.selectedNodes[0];
                if (!selectedNode.can_expand) {
                    let sig = xelib.Signature(selectedNode.handle);
                    if (sig === 'COBJ' || itemSignatureService.getItemSignatures().includes(sig)) {
                        return true;
                    }
                }
            }
            return false;
        },
        build: (scope, items) => {
            items.push({
                label: 'Edit Recipe',
                callback: () => editRecipe(scope, scope.selectedNodes[0].handle)
            });
        }
    });
});
