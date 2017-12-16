/* global ngapp, xelib, modulePath */

ngapp.service('craftingStationService', function() {
    const craftingStations = [
        {
            displayName: 'Armor Table',
            formId: 711544,
            longName: 'CraftingSmithingArmorTable [KYWD:000ADB78]'
        },
        {
            displayName: 'Cookpot',
            formId: 679091,
            longName: 'CraftingCookpot [KYWD:000A5CB3]'
        },
        {
            displayName: 'Forge',
            formId: 557317,
            longName: 'CraftingSmithingForge [KYWD:00088105]'
        },
        {
            displayName: 'Sharpening Wheel',
            formId: 557320,
            longName: 'CraftingSmithingSharpeningWheel [KYWD:00088108]'
        },
        {
            displayName: 'Skyforge',
            formId: 1001166,
            longName: 'CraftingSmithingSkyforge [KYWD:000F46CE]'
        },
        {
            displayName: 'Smelter',
            formId: 679118,
            longName: 'CraftingSmelter [KYWD:000A5CCE]'
        },
        {
            displayName: 'Tanning Rack',
            formId: 493162,
            longName: 'CraftingTanningRack [KYWD:0007866A]'
        }
    ];

    this.getCraftingStations = function() {
        return craftingStations;
    }
});

ngapp.controller('editRecipeModalController', function(
    $scope,
    recipePerkService,
    itemSignatureService,
    craftingStationService
) {
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
        $scope.isForge = $scope.craftingStation === 'Forge';
    }

    $scope.closeModal = function() {
        $scope.$emit('closeModal');
    };

    $scope.saveAndClose = function() {
        $scope.closeModal();

        let recipeObject = {
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
                recipeObject.conditionPerk = conditionPerk.longName;
            }
        }

        this.modalOptions.callback(recipeObject);
    }

    let recipeObject = $scope.modalOptions.recipeObject;

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

ngapp.service('itemSignatureService', function() {
    const itemSignatures = ['ALCH', 'AMMO', 'ARMO', 'BOOK', 'INGR', 'MISC', 'SCRL', 'SLGM', 'WEAP'];

    // returns an array of signatures that correspond to inventory items
    this.getItemSignatures = function() {
        return itemSignatures;
    }
});

ngapp.service('recipeConditionService', function(recipePerkService) {
    let keyValueArraysToObject = function(keys, values) {
        let obj = {};
        if (keys.length === values.length) {
            for (let i = 0; i < keys.length; ++i) {
                obj[keys[i]] = values[i];
            }
        }
        return obj;
    }

    const conditionRecordKeys = [
        'Type',
        'Comparison Value',
        'Function',
        'Parameter #1',
        'Parameter #2',
        'Run On',
        'Reference',
        'Parameter #3'
    ];

    const conditionRecordIsEnchantedJson = JSON.stringify(keyValueArraysToObject(
        conditionRecordKeys,
        [
            '00010000',
            '1.000000',
            'EPTemperingItemIsEnchanted',
            '00 00 00 00',
            '00 00 00 00',
            'Subject',
            '0',
            '-1'
        ]
    ));

    const conditionRecordHasPerk = keyValueArraysToObject(
        conditionRecordKeys,
        [
            '10000000',
            '1.000000',
            'HasPerk',
            '',
            '0',
            'Subject',
            '0',
            '-1'
        ]
    );
    const conditionRecordHasPerkJson = JSON.stringify(conditionRecordHasPerk);

    let conditionHandleToObject = function(conditionHandle) {
        return keyValueArraysToObject(
            conditionRecordKeys,
            conditionRecordKeys.map(key => xelib.GetValue(xelib.GetElement(conditionHandle, key)))
        );
    }

    this.isConditionEnchanted = function(conditionHandle) {
        return JSON.stringify(conditionHandleToObject(conditionHandle)) === conditionRecordIsEnchantedJson;
    }

    let conditionArcane = Object.assign({}, conditionRecordHasPerk);
    conditionArcane['Parameter #1'] = recipePerkService.getArcanePerk().longName;
    const conditionArcaneJson = JSON.stringify(conditionArcane);

    this.isConditionArcane = function(conditionHandle) {
        return JSON.stringify(conditionHandleToObject(conditionHandle)) === conditionArcaneJson;
    }

    const perkLongNames = recipePerkService.getSmithingPerks().map(perk => perk.longName);

    // if the condition is a HasPerk for a smithing material perk, return the perk long name
    this.getSmithingPerkLongNameFromConditionHandle = function(conditionHandle) {
        let conditionObject = conditionHandleToObject(conditionHandle);
        let perk = conditionObject['Parameter #1'];
        // check if the condition is on a recognized smithing material perk
        if (perkLongNames.includes(perk)) {
            conditionObject['Parameter #1'] = '';
            // check if the condition matches the HasPerk condition template
            if (JSON.stringify(conditionObject) === conditionRecordHasPerkJson) {
                return perk;
            }
        }
        return '';
    }
});

ngapp.service('recipePerkService', function() {
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

    this.getSmithingPerks = function() {
        return smithingPerks;
    }

    this.getArcanePerk = function() {
        return arcanePerk;
    }
});

ngapp.service('recipeSerializeService', function(recipeConditionService) {
    /* Deserializes a ConstructibleObject record into a recipe object with the following properties:
     *   editorId: string
     *   createdObject: string (LongName)
     *   createdObjectCount: number
     *   craftingStation: string (LongName)
     *   conditionPerk: string (LongName)
     *   ingredients: array {
     *     item: string (LongName)
     *     count: number
     *   }
     */
    this.recordToObject = function(recipeRecordHandle) {
        if (xelib.Signature(recipeRecordHandle) !== 'COBJ') {
            return {};
        }

        let recipeObject = {};

        recipeObject.editorId = xelib.EditorID(recipeRecordHandle);
        recipeObject.createdObject = xelib.GetValue(
            xelib.GetElement(recipeRecordHandle, 'CNAM - Created Object')
        );
        recipeObject.createdObjectCount = xelib.GetUIntValue(
            xelib.GetElement(recipeRecordHandle, 'NAM1 - Created Object Count')
        );
        recipeObject.craftingStation = xelib.GetValue(
            xelib.GetElement(recipeRecordHandle, 'BNAM - Workbench Keyword')
        );

        let conditionsHandle = xelib.GetElement(recipeRecordHandle, 'Conditions');
        if (conditionsHandle != 0) {
            let conditionHandles = xelib.GetElements(conditionsHandle);

            for (var i = 0; i < conditionHandles.length; ++i) {
                let ctdaHandle = xelib.GetElement(conditionHandles[i], 'CTDA');
                
                let conditionPerk = recipeConditionService.getSmithingPerkLongNameFromConditionHandle(ctdaHandle);
                if (conditionPerk !== '') {
                    recipeObject.conditionPerk = conditionPerk;
                    break;
                }
            }
        }

        let ingredientsHandle = xelib.GetElement(recipeRecordHandle, 'Items');
        recipeObject.ingredients = xelib.GetElements(ingredientsHandle).map(ingredientHandle => ({
            item: xelib.GetValue(xelib.GetElement(ingredientHandle, 'CNTO - Item\\Item')),
            count: xelib.GetUIntValue(xelib.GetElement(ingredientHandle, 'CNTO - Item\\Count'))
        }));

        return recipeObject;
    }
});


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
