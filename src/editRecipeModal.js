getSignatureFromLongName = function(longName) {
    let formIdStr = longName.substring(
        longName.lastIndexOf(':') + 1,
        longName.lastIndexOf(']')
    );
    let formId = parseInt(formIdStr, 16);
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
        'Armor Table': 'CraftingSmithingArmorTable',
        'Cookpot': 'CraftingCookpot',
        'Forge': 'CraftingSmithingForge',
        'Sharpening Wheel': 'CraftingSmithingSharpeningWheel',
        'Skyforge': 'CraftingSmithingSkyforge',
        'Smelter': 'CraftingSmelter',
        'Tanning Rack': 'CraftingTanningRack'
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

        let ingredientsHandle = xelib.GetElement(handle, 'Items');
        $scope.recipeModel.ingredients = xelib.GetElements(ingredientsHandle).map(ingredientHandle => {
            let itemReferenceHandle = xelib.GetElement(ingredientHandle, 'CNTO - Item\\Item');
            let itemLongName = xelib.GetValue(itemReferenceHandle);

            let itemSignature = getSignatureFromLongName(itemLongName);
            // need to do this because drop-down options need object reference
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
