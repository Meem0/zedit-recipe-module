/* global ngapp, xelib, modulePath */

// global helpers
getFormIdStringFromLongName = function(longName) {
    return longName.substring(
        longName.lastIndexOf(':') + 1,
        longName.lastIndexOf(']')
    );
}

getFormIdFromLongName = function(longName) {
    let formIdStr = getFormIdStringFromLongName(longName);
    let formId = parseInt(formIdStr, 16);
    return formId;
}

getRecipeMasters = function(recipeObject) {
    let loadOrders = [
        recipeObject.createdObject,
        ...(recipeObject.ingredients.map(i => i.item))
    ].map(reference =>
        parseInt(
            getFormIdStringFromLongName(reference).substring(0, 2),
            16
        )
    );
    loadOrders = Array.from(new Set([0, ...loadOrders])).sort();

    return loadOrders.map(
        loadOrder => xelib.FileByLoadOrder(loadOrder)
    );
}

//= require ./src/*.js

ngapp.run(function(
    contextMenuFactory,
    recipeSerializeService,
    itemSignatureService,
    editModalFactory,
    modalStackService
) {
    let addRecipeRequiredMasters = function(fileHandle, recipeObject) {
        xelib.WithHandles(
            getRecipeMasters(recipeObject),
            masterFileHandles => {
                // make sure we don't re-add existing masters, otherwise the GUI would turn bold white for no reason
                xelib.WithHandles(
                    xelib.GetMasters(fileHandle),
                    existingMasterFileHandles => {
                        let existingMasterFileNames = existingMasterFileHandles.map(h => xelib.GetFileName(h));
                        let fileName = xelib.GetFileName(fileHandle);
                        masterFileHandles.forEach(
                            masterFileHandle => {
                                let masterFileName = xelib.GetFileName(masterFileHandle);
                                if (
                                    !existingMasterFileNames.includes(masterFileName) &&
                                    masterFileName !== fileName
                                ) {
                                    xelib.AddMaster(fileHandle, xelib.GetFileName(masterFileHandle));
                                }
                            }
                        );
                    }
                )
            }
        );
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

    let addNewRecipe = function(scope, modalStack, filename, recipeObject) {
        if (filename == '< new file >') {
            editModalFactory.addFile(scope, addedFilename => {
                xelib.WithHandle(
                    xelib.AddFile(addedFilename),
                    fileHandle => createRecipeRecord(scope, fileHandle, recipeObject)
                );
            });
        }
        else {
            modalStack.clear();
            xelib.WithHandle(
                xelib.FileByName(filename),
                fileHandle => createRecipeRecord(scope, fileHandle, recipeObject)
            );
        }
    }

    let openChooseNewRecipeFileModal = function(scope, modalStack, recipeObject) {
        modalStack.push(
            'chooseNewRecipeFile',
            {
                recipeObject: recipeObject,
                callback: (filename => addNewRecipe(scope, modalStack, filename, recipeObject))
            }
        )
    }

    let openEditRecipeModal = function(scope, recipeObject, recipeHandle) {
        let modalStack = modalStackService.new(scope);
        modalStack.push(
            'editRecipe',
            {
                recipeObject: recipeObject,
                callback: (recipeHandle === 0 ?
                    (recipeObject => openChooseNewRecipeFileModal(scope, modalStack, recipeObject)) :
                    (recipeObject => {
                        modalStack.clear();
                        writeRecipeToRecord(scope, recipeHandle, recipeObject);
                    })
                )
            }
        );
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

        openEditRecipeModal(scope, recipeObject, recipeHandle);
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
