const smithingPerks = [
    {
        displayName: 'Advanced Armors',
        formId: 832532,
        longName: 'AdvancedArmors "Advanced Armors" [PERK:000CB414]'
    },
    {
        displayName: 'Daedric Smithing',
        formId: 832531,
        longName: 'DaedricSmithing "Daedric Smithing" [PERK:000CB413]'
    },
    {
        displayName: 'Dragon Armor',
        formId: 336272,
        longName: 'DragonArmor "Dragon Armor" [PERK:00052190]'
    },
    {
        displayName: 'Dwarven Smithing',
        formId: 832526,
        longName: 'DwarvenSmithing "Dwarven Smithing" [PERK:000CB40E]'
    },
    {
        displayName: 'Ebony Smithing',
        formId: 832530,
        longName: 'EbonySmithing "Ebony Smithing" [PERK:000CB412]'
    },
    {
        displayName: 'Elven Smithing',
        formId: 832527,
        longName: 'ElvenSmithing "Elven Smithing" [PERK:000CB40F]'
    },
    {
        displayName: 'Glass Smithing',
        formId: 832529,
        longName: 'GlassSmithing "Glass Smithing" [PERK:000CB411]'
    },
    {
        displayName: 'Orcish Smithing',
        formId: 832528,
        longName: 'OrcishSmithing "Orcish Smithing" [PERK:000CB410]'
    },
    {
        displayName: 'Steel Smithing',
        formId: 832525,
        longName: 'SteelSmithing "Steel Smithing" [PERK:000CB40D]'
    }    
];
const arcanePerk = {
    displayName: 'Arcane Blacksmith',
    formId: 336270,
    longName: 'ArcaneBlacksmith "Arcane Blacksmith" [PERK:0005218E]'
};

//= require ./recipeConditions.js

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

    $scope.editorId = '';
    $scope.createdObject = '';
    $scope.createdObjectCount = 1;
    $scope.ingredients = [];

    $scope.conditionPerkOptions = ['None'].concat(smithingPerks.map(perk => perk.displayName));
    $scope.conditionPerk = $scope.conditionPerkOptions[0];

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
        $scope.editorId = xelib.EditorID(handle);
        $scope.createdObject = xelib.GetValue(xelib.GetElement(handle, 'CNAM - Created Object'));
        $scope.createdObjectCount =
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

        let conditionsHandle = xelib.GetElement(handle, 'Conditions');
        if (conditionsHandle != 0) {
            let conditionHandles = xelib.GetElements(conditionsHandle);

            for (var i = 0; i < conditionHandles.length; ++i) {
                let ctdaHandle = xelib.GetElement(conditionHandles[i], 'CTDA');
                
                let conditionPerk = getConditionPerk(ctdaHandle);
                if (conditionPerk !== '') {
                    $scope.conditionPerk = $scope.conditionPerkOptions.find(displayName =>
                        smithingPerks.find(
                            perk => perk.longName === conditionPerk
                        ).displayName === displayName
                    );
                    break;
                }
            }
        }

        let ingredientsHandle = xelib.GetElement(handle, 'Items');
        $scope.ingredients = xelib.GetElements(ingredientsHandle).map(ingredientHandle => {
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
        $scope.createdObject = xelib.LongName(handle);
    }

    $scope.createdObjectSignature = getSignatureFromLongName($scope.createdObject);
    $scope.updateCraftType();
});
