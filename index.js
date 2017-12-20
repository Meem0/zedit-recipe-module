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

ngapp.run(function($q, contextMenuFactory, recipeSerializeService, itemSignatureService, editModalFactory) {
    let addRecipeRequiredMasters = function(fileHandle, recipeObject) {
        xelib.AddMaster(fileHandle, 'Skyrim.esm');
    }

    let writeRecipeToRecord = function(scope, recipeHandle, recipeObject) {
        xelib.WithHandle(
            xelib.GetElementFile(recipeHandle),
            fileHandle => addRecipeRequiredMasters(fileHandle, recipeObject)
        );
        recipeSerializeService.objectToRecord(recipeObject, recipeHandle);
        scope.$root.$broadcast('reloadGUI');
    }

    let createRecipeRecord = function(scope, fileHandle, recipeObject) {
        xelib.WithHandle(
            xelib.AddElement(fileHandle, 'COBJ\\COBJ'),
            recipeHandle => {
                writeRecipeToRecord(scope, recipeHandle, recipeObject);
            }
        );
    }

    let addNewRecipe = function(scope, filename, recipeObject) {
        if (filename == '< new file >') {
            editModalFactory.addFile(scope, addedFilename => {
                xelib.WithHandle(
                    xelib.AddFile(addedFilename),
                    fileHandle => createRecipeRecord(scope, fileHandle, recipeObject)
                );
            });
        }
        else {
            xelib.WithHandle(
                xelib.FileByName(filename),
                fileHandle => createRecipeRecord(scope, fileHandle, recipeObject)
            );
        }
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
            if (recipeHandle === 0) {
                let chooseFileAction = $q.defer();

                scope.$emit('openModal', 'chooseNewRecipeFile', {
                    basePath: `${modulePath}/partials`,
                    recipeObject: recipeObject,
                    action: chooseFileAction
                });

                chooseFileAction.promise.then(filename => {
                    addNewRecipe(scope, filename, recipeObject)
                });
            }
            else {
                writeRecipeToRecord(scope, recipeHandle, recipeObject);
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
