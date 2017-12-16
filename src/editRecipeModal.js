ngapp.controller('editRecipeModalController', function($scope, recipePerkService, itemSignatureService) {
    let getFormIdFromLongName = function(longName) {
        let formIdStr = longName.substring(
            longName.lastIndexOf(':') + 1,
            longName.lastIndexOf(']')
        );
        let formId = parseInt(formIdStr, 16);
        return formId;
    }

    let getSignatureFromLongName = function(longName) {
        let formId = getFormIdFromLongName(longName);
        let recordHandle = xelib.GetRecord(0, formId);
        return xelib.Signature(recordHandle);
    }

    $scope.addIngredient = function() {
        $scope.ingredients.push({item: '', count: 0});
    }

    $scope.removeIngredient = function(ingredient) {
        let index = $scope.ingredients.indexOf(ingredient);
        if (index >= 0) {
            $scope.ingredients.splice(index, 1);
        }
    }

    $scope.updateCraftType = function() {
        $scope.isForge = $scope.craftingStation === $scope.craftingStations['Forge'];
    }

    $scope.closeModal = function() {
        $scope.$emit('closeModal');
    };

    let recipeObject = $scope.modalOptions.recipeObject;

    $scope.editorId = recipeObject.editorId || '';

    if (recipeObject.createdObject) {
        $scope.createdObject = recipeObject.createdObject;
        $scope.createdObjectSignature = getSignatureFromLongName(recipeObject.createdObject);
    }
    else {
        $scope.createdObject = '';
        $scope.createdObjectSignature = itemSignatureService.getItemSignatures()[0];
    }

    $scope.createdObjectCount = recipeObject.createdObjectCount || 1;

    let smithingPerks = recipePerkService.getSmithingPerks();
    $scope.conditionPerkOptions = ['None'].concat(smithingPerks.map(perk => perk.displayName));

    if (recipeObject.conditionPerk) {
        let conditionPerkDisplayname = smithingPerks.find(perk =>
            perk.longName === recipeObject.conditionPerk
        ).displayName;
        $scope.conditionPerk = $scope.conditionPerkOptions.find(displayName =>
            conditionPerkDisplayname === displayName
        );
    }
    else {
        $scope.conditionPerk = $scope.conditionPerkOptions[0];
    }

    $scope.craftingStations = {
        'Armor Table': 711544,
        'Cookpot': 679091,
        'Forge': 557317,
        'Sharpening Wheel': 557320,
        'Skyforge': 1001166,
        'Smelter': 679118,
        'Tanning Rack': 493162
    };

    if (recipeObject.craftingStation) {
        // get reference to entry in craftingStations, using the FormID from the 'Workbench Keyword' element
        let workbenchFormId = getFormIdFromLongName(recipeObject.craftingStation);
        $scope.craftingStation = $scope.craftingStations[
            Object.keys($scope.craftingStations).find(key =>
                $scope.craftingStations[key] === workbenchFormId
            )
        ];
    }
    else {
        $scope.craftingStation = $scope.craftingStations['Forge'];
    }
    $scope.updateCraftType();

    $scope.itemSignatures = itemSignatureService.getItemSignatures();

    if (recipeObject.ingredients) {
        $scope.ingredients = recipeObject.ingredients.map(ingredient => ({
            item: ingredient.item,
            count: ingredient.count,
            signature: getSignatureFromLongName(ingredient.item)
        }));
    }
    else {
        $scope.ingredients = [];
    }
});
