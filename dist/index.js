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

ngapp.controller('chooseNewRecipeFileModalController', function($scope) {
    // helper functions
    let initPlugins = function() {
        let lastMasterLoadOrder = 0;
        xelib.WithHandles(
            getRecipeMasters($scope.modalOptions.recipeObject),
            masterFileHandles => {
                lastMasterLoadOrder = xelib.GetFileLoadOrder(masterFileHandles[masterFileHandles.length - 1]);
            }
        );

        let plugins = [];
        xelib.WithHandles(
            xelib.GetElements(),
            fileHandles => {
                plugins = fileHandles.filter(fileHandle =>
                    xelib.GetIsEditable(fileHandle) && xelib.GetFileLoadOrder(fileHandle) >= lastMasterLoadOrder
                ).map(fileHandle => ({
                    filename: xelib.Name(fileHandle),
                    loadOrder: xelib.GetFileLoadOrder(fileHandle)
                }));
            }
        );
        $scope.plugins = plugins.concat({
            filename: '< new file >'
        });
    };

    // scope functions
    $scope.save = function() {
        $scope.modalOptions.action.resolve($scope.destinationFileName);
        $scope.$emit('closeModal');
    };

    $scope.cancel = function() {
        $scope.modalOptions.action.reject();
        $scope.$emit('closeModal');
    };

    $scope.label = $scope.modalOptions.recipeObject.editorId;
    $scope.destinationFileName = '';
    initPlugins();
});

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

// modalOptions interface:
//   recipeObject: the recipeObject to display
//   action(recipeObject): resolved when changes are saved, if there were changes
ngapp.controller('editRecipeModalController', function(
    $scope,
    recipePerkService,
    itemSignatureService,
    craftingStationService
) {
    let recipeObject = $scope.modalOptions.recipeObject;

    let getSignatureFromLongName = function(longName) {
        let formId = getFormIdFromLongName(longName);
        let signature = '';
        xelib.WithHandle(
            xelib.GetRecord(0, formId),
            handle => signature = xelib.Signature(handle)
        );
        return signature;
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
            this.modalOptions.action.resolve(recipeObjectNew);
            $scope.closeModal();
        }
        else {
            $scope.cancel();
        }
    }

    $scope.cancel = function() {
        this.modalOptions.action.reject();
        $scope.closeModal();
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

    // if any of the conditions is a HasPerk for a smithing material perk, 
    //   return the perk long name and the CTDA handle of the condition
    // TODO - what if multiple condition perks?
    this.getSmithingPerkLongNameFromConditionsHandle = function(conditionsHandle) {
        let conditionHandles = xelib.GetElements(conditionsHandle);

        for (var i = 0; i < conditionHandles.length; ++i) {
            let ctdaHandle = xelib.GetElement(conditionHandles[i], 'CTDA');

            let conditionPerk = this.getSmithingPerkLongNameFromConditionHandle(ctdaHandle);
            if (conditionPerk !== '') {
                return {
                    conditionPerk: conditionPerk,
                    handle: ctdaHandle
                };
            }
        }

        return {
            conditionPerk: '',
            handle: 0
        };
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
    let addArrayOrArrayItem = function(handle, arrayName) {
        let addedItemHandle = 0;
        xelib.WithHandle(xelib.GetElement(handle, arrayName), arrayHandle => {
            // need to create the conditions array
            if (arrayHandle === 0) {
                xelib.WithHandle(
                    xelib.AddElement(handle, arrayName),
                    addedArrayHandle => addedItemHandle = xelib.GetElement(addedArrayHandle, '[0]')
                );
            }
            // need to add an element to the existing conditions array
            else {
                addedItemHandle = xelib.AddArrayItem(arrayHandle, '', '', '');
            }
        });
        return addedItemHandle;
    }

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
        xelib.WithHandle(
            xelib.GetElement(recipeRecordHandle, 'CNAM - Created Object'),
            handle => recipeObject.createdObject = xelib.GetValue(handle)
        );
        xelib.WithHandle(
            xelib.GetElement(recipeRecordHandle, 'NAM1 - Created Object Count'),
            handle => recipeObject.createdObjectCount = xelib.GetUIntValue(handle)
        );
        xelib.WithHandle(
            xelib.GetElement(recipeRecordHandle, 'BNAM - Workbench Keyword'),
            handle => recipeObject.craftingStation = xelib.GetValue(handle)
        );

        xelib.WithHandle(
            xelib.GetElement(recipeRecordHandle, 'Conditions'),
            conditionsHandle => {
                if (conditionsHandle != 0) {
                    recipeObject.conditionPerk = recipeConditionService.getSmithingPerkLongNameFromConditionsHandle(
                        conditionsHandle
                    ).conditionPerk;
                }
            }
        );

        xelib.WithHandle(
            xelib.GetElement(recipeRecordHandle, 'Items'),
            ingredientsHandle => {
                recipeObject.ingredients = ingredientsHandle === 0 ? [] :
                    xelib.GetElements(ingredientsHandle).map(ingredientHandle => ({
                        item: xelib.GetValue(xelib.GetElement(ingredientHandle, 'CNTO - Item\\Item')),
                        count: xelib.GetUIntValue(xelib.GetElement(ingredientHandle, 'CNTO - Item\\Count'))
                    }));
            }
        );

        return recipeObject;
    }

    this.objectToRecord = function(recipeObject, recipeRecordHandle) {
        if (xelib.GetValue(recipeRecordHandle, 'EDID') !== recipeObject.editorId) {
            xelib.Release(
                xelib.AddElementValue(recipeRecordHandle, 'EDID', recipeObject.editorId)
            );
        }
        if (xelib.GetValue(recipeRecordHandle, 'CNAM') !== recipeObject.createdObject) {
            xelib.Release(
                xelib.AddElementValue(recipeRecordHandle, 'CNAM', recipeObject.createdObject)
            );
        }
        if (xelib.GetUIntValue(recipeRecordHandle, 'NAM1') !== recipeObject.createdObjectCount) {
            xelib.Release(
                xelib.AddElementValue(recipeRecordHandle, 'NAM1', recipeObject.createdObjectCount.toString())
            );
        }
        if (xelib.GetValue(recipeRecordHandle, 'BNAM') !== recipeObject.craftingStation) {
            xelib.Release(
                xelib.AddElementValue(recipeRecordHandle, 'BNAM', recipeObject.craftingStation)
            );
        }


        let recordConditionPerk = '';
        let recordConditionPerkHandle = 0;
        xelib.WithHandle(
            xelib.GetElement(recipeRecordHandle, 'Conditions'),
            conditionsHandle => {
                if (conditionsHandle !== 0) {
                    let perk = recipeConditionService.getSmithingPerkLongNameFromConditionsHandle(
                        conditionsHandle
                    );
                    recordConditionPerk = perk.conditionPerk;
                    recordConditionPerkHandle = perk.handle;
                }
            }
        );

        // the record has a smithing perk condition
        if (recordConditionPerk) {
            xelib.WithHandle(recordConditionPerkHandle, recordConditionPerkHandle => {
                // we do not want a smithing perk condition -> need to remove the record
                if (!recipeObject.conditionPerk) {
                    xelib.WithHandle(
                        xelib.GetContainer(recordConditionPerkHandle),
                        handle => xelib.RemoveElement(handle)
                    );
                }
                // we want a smithing perk condition -> need to modify the record
                else if (recordConditionPerk !== recipeObject.conditionPerk) {
                    xelib.SetValue(recordConditionPerkHandle, 'Parameter #1', recipeObject.conditionPerk);
                }
            });
        }
        // we want a smithing perk condition, and the record doesn't have one -> need to add one
        else if (recipeObject.conditionPerk) {
            xelib.WithHandle(
                addArrayOrArrayItem(recipeRecordHandle, 'Conditions'),
                conditionHandle => {
                    xelib.SetValue(conditionHandle, 'CTDA\\Function', 'HasPerk');
                    xelib.SetValue(conditionHandle, 'CTDA\\Comparison Value', '1');
                    xelib.SetValue(conditionHandle, 'CTDA\\Parameter #1', recipeObject.conditionPerk);
                }
            );
        }


        let recordIngredientHandles = [];
        xelib.WithHandle(
            xelib.GetElement(recipeRecordHandle, 'Items'),
            recordIngredientsHandle => {
                if (recordIngredientsHandle !== 0) {
                    recordIngredientHandles = xelib.GetElements(recordIngredientsHandle);
                }
            }
        )

        // sort by form ID, since the Items array is
        let ingredients = recipeObject.ingredients.slice().sort((i1, i2) =>
            getFormIdFromLongName(i1.item) - getFormIdFromLongName(i2.item)
        );

        xelib.WithHandles(
            recordIngredientHandles,
            recordIngredientHandles => {
                let objIdx = 0; // index of current "object ingredient" (ingredients we are writing to the record)
                let recIdx = 0; // index of current "record ingredient" (ingredients that are already in the record)
                while (objIdx < ingredients.length || recIdx < recordIngredientHandles.length) {
                    let objFormId = objIdx < ingredients.length ?
                        getFormIdFromLongName(ingredients[objIdx].item) : 0;
                    let recFormId = recIdx < recordIngredientHandles.length ?
                        getFormIdFromLongName(xelib.GetValue(recordIngredientHandles[recIdx], 'CNTO\\Item')) : 0;
        
                    // delete the record ingredient if:
                    //   a) we reached the end of the object ingredients but still have record ingredients left
                    //   b) we found a record ingredient that isn't in the list of object ingredients
                    //      (we can tell this because the lists are sorted)
                    if (objFormId === 0 || (recFormId < objFormId && recFormId !== 0)) {
                        xelib.RemoveElement(recordIngredientHandles[recIdx]);
                        ++recIdx;
                    }
                    // add a new record ingredient if:
                    //   a) we reached the end of the record ingredients but still have object ingredients left
                    //   b) we found an object ingredient that isn't in the list of record ingredients
                    else if (recFormId === 0 || objFormId < recFormId) {
                        xelib.WithHandle(
                            addArrayOrArrayItem(recipeRecordHandle, 'Items'),
                            recordIngredientHandle => {
                                xelib.SetValue(recordIngredientHandle, 'CNTO\\Item', ingredients[objIdx].item);
                                xelib.SetUIntValue(recordIngredientHandle, 'CNTO\\Count', ingredients[objIdx].count);
                                ++objIdx;
                            }
                        );
                    }
                    // otherwise they are referring to the same item; edit the count if necessary
                    else {
                        if (
                            ingredients[objIdx].count !==
                            xelib.GetUIntValue(recordIngredientHandles[recIdx], 'CNTO\\Count')
                        ) {
                            xelib.SetUIntValue(
                                recordIngredientHandles[recIdx],
                                'CNTO\\Count',
                                ingredients[objIdx].count
                            );
                        }
                        ++objIdx;
                        ++recIdx;
                    }
                }
            }
        )
    }
});


ngapp.run(function($q, contextMenuFactory, recipeSerializeService, itemSignatureService, editModalFactory) {
    let addRecipeRequiredMasters = function(fileHandle, recipeObject) {
        xelib.WithHandles(
            getRecipeMasters(recipeObject),
            masterFileHandles => {
                masterFileHandles.forEach(
                    masterFileHandle => xelib.AddMaster(fileHandle, xelib.GetFileName(masterFileHandle))
                );
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

    let addNewRecipe = function(scope, filename, recipeObject) {
        if (filename == '< new file >') {
            editModalFactory.addFile(scope, addedFilename => {
                xelib.WithHandle(
                    xelib.AddFile(addedFilename),
                    fileHandle => createRecipeRecord(scope, fileHandle, recipeObject)
                );
            });
        }
        else {
            xelib.WithHandle(
                xelib.FileByName(filename),
                fileHandle => createRecipeRecord(scope, fileHandle, recipeObject)
            );
        }
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

        let recipeObjectBefore = recipeObject;
        let action = $q.defer();

        scope.$emit('openModal', 'editRecipe', {
            basePath: `${modulePath}/partials`,
            recipeObject: recipeObject,
            action: action
        });

        action.promise.then(recipeObject => {
            if (recipeHandle === 0) {
                let chooseFileAction = $q.defer();

                scope.$emit('openModal', 'chooseNewRecipeFile', {
                    basePath: `${modulePath}/partials`,
                    recipeObject: recipeObject,
                    action: chooseFileAction
                });

                chooseFileAction.promise.then(filename => {
                    addNewRecipe(scope, filename, recipeObject)
                });
            }
            else {
                writeRecipeToRecord(scope, recipeHandle, recipeObject);
            }
        });
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
