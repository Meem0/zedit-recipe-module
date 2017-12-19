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
            xelib.WithHandle(
                xelib.AddElementValue(recipeRecordHandle, 'EDID', recipeObject.editorId),
                handle => {}
            );
        }
        if (xelib.GetValue(recipeRecordHandle, 'CNAM') !== recipeObject.createdObject) {
            xelib.WithHandle(
                xelib.AddElementValue(recipeRecordHandle, 'CNAM', recipeObject.createdObject),
                handle => {}
            );
        }
        if (xelib.GetUIntValue(recipeRecordHandle, 'NAM1') !== recipeObject.createdObjectCount) {
            xelib.WithHandle(
                xelib.AddElementValue(recipeRecordHandle, 'NAM1', recipeObject.createdObjectCount.toString()),
                handle => {}
            );
        }
        if (xelib.GetValue(recipeRecordHandle, 'BNAM') !== recipeObject.craftingStation) {
            xelib.WithHandle(
                xelib.AddElementValue(recipeRecordHandle, 'BNAM', recipeObject.craftingStation),
                handle => {}
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
