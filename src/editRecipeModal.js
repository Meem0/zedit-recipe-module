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

    $scope.createdObjectSignatures = ['ARMO', 'WEAP'];
    $scope.createdObjectSignature = $scope.createdObjectSignatures[0];

    $scope.ingredientSignatures = ['ARMO', 'WEAP', 'INGR', 'MISC'];

    let handle = $scope.modalOptions.handle;
    if (xelib.Signature(handle) === 'COBJ') {
        $scope.recipeModel.editorId = xelib.EditorID(handle);
        $scope.recipeModel.createdObject = xelib.GetValue(xelib.GetElement(handle, 'CNAM - Created Object'));
        $scope.recipeModel.createdObjectCount = xelib.GetUIntValue(xelib.GetElement(handle, 'NAM1 - Created Object Count'));

        let itemsElement = xelib.GetElement(handle, 'Items');
        $scope.recipeModel.ingredients = xelib.GetElements(itemsElement).map(itemHandle => {
            return {
                item: xelib.GetValue(xelib.GetElement(itemHandle, 'CNTO - Item\\Item')),
                count: xelib.GetUIntValue(xelib.GetElement(itemHandle, 'CNTO - Item\\Count'))
            }
        });
    }
});
