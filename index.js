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

ngapp.run(function(contextMenuFactory, recipeSerializeService, itemSignatureService) {
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
                callback: () => {
                    let handle = scope.selectedNodes[0].handle;
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

                    scope.$emit('openModal', 'editRecipe', {
                        basePath: `${modulePath}/partials`,
                        recipeObject: recipeObject,
                        callback: recipeObject => recipeSerializeService.objectToRecord(recipeObject, recipeHandle)
                    });
                }
            });
        }
    });
});
