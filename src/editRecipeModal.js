getFormIdFromLongName = function(longName) {
    let formIdStr = longName.substring(
        longName.lastIndexOf(':') + 1,
        longName.lastIndexOf(']')
    );
    let formId = parseInt(formIdStr, 16);
    return formId;
}

getSignatureFromLongName = function(longName) {
    let formId = getFormIdFromLongName(longName);
    let recordHandle = xelib.GetRecord(0, formId);
    return xelib.Signature(recordHandle);
}

ngapp.controller('editRecipeModalController', function($scope) {

    $scope.addIngredient = function() {
        $scope.recipeModel.ingredients.push({item: '', count: 0});
    }

    $scope.removeIngredient = function(ingredient) {
        let index = $scope.recipeModel.ingredients.indexOf(ingredient);
        if (index >= 0) {
            $scope.recipeModel.ingredients.splice(index, 1);
        }
    }

    $scope.closeModal = function() {
        $scope.$emit('closeModal');
    };

    $scope.recipeModel = {
        editorId: '',
        createdObject: '',
        createdObjectCount: 1,
        ingredients: []
    };

    $scope.craftingStations = {
        'Armor Table': 711544,
        'Cookpot': 679091,
        'Forge': 557317,
        'Sharpening Wheel': 557320,
        'Skyforge': 1001166,
        'Smelter': 679118,
        'Tanning Rack': 493162
    };
    $scope.craftingStation = $scope.craftingStations['Forge'];

    $scope.itemSignatures = itemSignatures;

    let handle = $scope.modalOptions.handle;
    if (xelib.Signature(handle) === 'COBJ') {
        $scope.recipeModel.editorId = xelib.EditorID(handle);
        $scope.recipeModel.createdObject = xelib.GetValue(xelib.GetElement(handle, 'CNAM - Created Object'));
        $scope.recipeModel.createdObjectCount =
            xelib.GetUIntValue(
                xelib.GetElement(handle, 'NAM1 - Created Object Count')
            );

        // get reference to entry in craftingStations, using the FormID from the 'Workbench Keyword' element
        let workbenchFormId = getFormIdFromLongName(
            xelib.GetValue(xelib.GetElement(handle, 'BNAM - Workbench Keyword'))
        );
        $scope.craftingStation = $scope.craftingStations[
            Object.keys($scope.craftingStations).find(key =>
                $scope.craftingStations[key] === workbenchFormId
            )
        ];

        let ingredientsHandle = xelib.GetElement(handle, 'Items');
        $scope.recipeModel.ingredients = xelib.GetElements(ingredientsHandle).map(ingredientHandle => {
            let itemReferenceHandle = xelib.GetElement(ingredientHandle, 'CNTO - Item\\Item');
            let itemLongName = xelib.GetValue(itemReferenceHandle);

            // get reference to entry in itemSignatures
            let itemSignature = getSignatureFromLongName(itemLongName);
            let itemSignatureRef = $scope.itemSignatures.find(s => s === itemSignature);

            return {
                signature: itemSignatureRef,
                item: itemLongName,
                count: xelib.GetUIntValue(xelib.GetElement(ingredientHandle, 'CNTO - Item\\Count'))
            }
        });
    }
    else {
        $scope.recipeModel.createdObject = xelib.LongName(handle);
    }

    $scope.createdObjectSignature = getSignatureFromLongName($scope.recipeModel.createdObject);
});
