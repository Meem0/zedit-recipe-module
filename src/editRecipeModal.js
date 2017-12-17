// modalOptions interface:
//   recipeObject: the recipeObject to display
//   callback(recipeObject): called when changes are saved, if there were changes
ngapp.controller('editRecipeModalController', function(
    $scope,
    recipePerkService,
    itemSignatureService,
    craftingStationService
) {
    let recipeObject = $scope.modalOptions.recipeObject;

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
        $scope.isForge = $scope.craftingStation === 'Forge';
    }

    $scope.closeModal = function() {
        $scope.$emit('closeModal');
    };

    $scope.saveAndClose = function() {
        $scope.closeModal();

        let recipeObjectNew = {
            editorId: $scope.editorId,
            createdObject: $scope.createdObject,
            createdObjectCount: $scope.createdObjectCount,
            craftingStation:
                craftingStationService.getCraftingStations().find(craftingStation =>
                    craftingStation.displayName === $scope.craftingStation
                ).longName,
            ingredients: $scope.ingredients.map(ingredient => ({
                item: ingredient.item,
                count: ingredient.count
            }))
        };

        if ($scope.isForge) {
            let conditionPerk = recipePerkService.getSmithingPerks().find(perk =>
                perk.displayName === $scope.conditionPerk
            );
            if (conditionPerk) {
                recipeObjectNew.conditionPerk = conditionPerk.longName;
            }
        }

        if (!recipeObjectsEqual(recipeObject, recipeObjectNew)) {
            this.modalOptions.callback(recipeObjectNew);
        }
    }

    // editorId
    $scope.editorId = recipeObject.editorId || '';

    // createdObject
    if (recipeObject.createdObject) {
        $scope.createdObject = recipeObject.createdObject;
        $scope.createdObjectSignature = getSignatureFromLongName(recipeObject.createdObject);
    }
    else {
        $scope.createdObject = '';
        $scope.createdObjectSignature = itemSignatureService.getItemSignatures()[0];
    }

    // createdObjectCount
    $scope.createdObjectCount = recipeObject.createdObjectCount || 1;

    // craftingStation
    let craftingStations = craftingStationService.getCraftingStations();
    $scope.craftingStations = craftingStations.map(craftingStation => craftingStation.displayName);

    if (recipeObject.craftingStation) {
        let craftingStationDisplayName = craftingStations.find(craftingStation =>
            craftingStation.longName === recipeObject.craftingStation
        ).displayName;
        $scope.craftingStation = $scope.craftingStations.find(displayName =>
            craftingStationDisplayName === displayName
        );
    }
    else {
        $scope.craftingStation = $scope.craftingStations.find(craftingStation =>
            craftingStation === 'Forge'
        );
    }
    $scope.updateCraftType();

    // conditionPerk
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

    // ingredients
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

    $scope.itemSignatures = itemSignatureService.getItemSignatures();
});
