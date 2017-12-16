/* global ngapp, xelib, modulePath */

//= require ./src/*.js

ngapp.run(function(contextMenuFactory, recipeSerializeService, itemSignatureService) {
    let recipeObjectsEqual = function(a, b) {
        let order = function(obj) {
            let ordered = {};
            Object.keys(obj).sort().forEach(function(key) {
                ordered[key] = obj[key];
            });
            return ordered;
        }

        return JSON.stringify(order(a)) === JSON.stringify(order(b));
    };
    let before = {};

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
                    if (sig === 'COBJ') {
                        recipeObject = recipeSerializeService.recordToObject(handle);
                    }
                    else if (itemSignatureService.getItemSignatures().includes(sig)) {
                        recipeObject.createdObject = xelib.LongName(handle);
                    }

                    before = recipeObject;

                    scope.$emit('openModal', 'editRecipe', {
                        basePath: `${modulePath}/partials`,
                        recipeObject: recipeObject,
                        callback: recipeObject => console.log(recipeObjectsEqual(before, recipeObject))
                    });
                }
            });
        }
    });
});
