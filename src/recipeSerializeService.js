ngapp.service('recipeSerializeService', function(recipeConditionService) {
    let addArrayOrArrayItem = function(handle, arrayName) {
        let arrayHandle = xelib.GetElement(handle, arrayName);
        // need to create the conditions array
        if (arrayHandle === 0) {
            arrayHandle = xelib.AddElement(handle, arrayName);
            return xelib.GetElement(arrayHandle, '[0]');
        }
        // need to add an element to the existing conditions array
        else {
            return xelib.AddArrayItem(arrayHandle, '', '', '');
        }
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
            recipeObject.conditionPerk = recipeConditionService.getSmithingPerkLongNameFromConditionsHandle(
                conditionsHandle
            ).conditionPerk;
        }

        let ingredientsHandle = xelib.GetElement(recipeRecordHandle, 'Items');
        recipeObject.ingredients = ingredientsHandle === 0 ? [] :
            xelib.GetElements(ingredientsHandle).map(ingredientHandle => ({
                item: xelib.GetValue(xelib.GetElement(ingredientHandle, 'CNTO - Item\\Item')),
                count: xelib.GetUIntValue(xelib.GetElement(ingredientHandle, 'CNTO - Item\\Count'))
            }));

        return recipeObject;
    }

    this.objectToRecord = function(recipeObject, recipeRecordHandle) {
        if (xelib.GetValue(recipeRecordHandle, 'EDID') !== recipeObject.editorId) {
            xelib.AddElementValue(recipeRecordHandle, 'EDID', recipeObject.editorId);
        }
        if (xelib.GetValue(recipeRecordHandle, 'CNAM') !== recipeObject.createdObject) {
            xelib.AddElementValue(recipeRecordHandle, 'CNAM', recipeObject.createdObject);
        }
        if (xelib.GetUIntValue(recipeRecordHandle, 'NAM1') !== recipeObject.createdObjectCount) {
            xelib.AddElementValue(recipeRecordHandle, 'NAM1', recipeObject.createdObjectCount.toString());
        }
        if (xelib.GetValue(recipeRecordHandle, 'BNAM') !== recipeObject.craftingStation) {
            xelib.AddElementValue(recipeRecordHandle, 'BNAM', recipeObject.craftingStation);
        }


        let recordConditionPerk = '';
        let recordConditionPerkHandle = 0;
        let conditionsHandle = xelib.GetElement(recipeRecordHandle, 'Conditions');
        if (conditionsHandle !== 0) {
            let perk = recipeConditionService.getSmithingPerkLongNameFromConditionsHandle(
                conditionsHandle
            );
            recordConditionPerk = perk.conditionPerk;
            recordConditionPerkHandle = perk.handle;
        }

        // we want a smithing perk condition
        if (recipeObject.conditionPerk) {
            // the record has no smithing perk condition -> need to add one
            if (!recordConditionPerk) {
                conditionHandle = addArrayOrArrayItem(recipeRecordHandle, 'Conditions');

                xelib.SetValue(conditionHandle, 'CTDA\\Function', 'HasPerk');
                xelib.SetValue(conditionHandle, 'CTDA\\Comparison Value', '1');
                xelib.SetValue(conditionHandle, 'CTDA\\Parameter #1', recipeObject.conditionPerk);
            }
            // the record has a smithing perk condition -> need to modify it
            else if (recordConditionPerk !== recipeObject.conditionPerk) {
                xelib.SetValue(recordConditionPerkHandle, 'Parameter #1', recipeObject.conditionPerk);
            }
        }
        // we do not want a smithing perk condition, and the record has one -> need to remove it
        else if (recordConditionPerk) {
            xelib.RemoveElement(xelib.GetContainer(recordConditionPerkHandle));
        }

        let recordIngredientsHandle = xelib.GetElement(recipeRecordHandle, 'Items');
        let recordIngredientHandles = [];
        if (recordIngredientsHandle !== 0) {
            recordIngredientHandles = xelib.GetElements(recordIngredientsHandle);
        }

        // sort by form ID, since the Items array is
        let ingredients = recipeObject.ingredients.slice().sort((i1, i2) =>
            getFormIdFromLongName(i1.item) - getFormIdFromLongName(i2.item)
        );

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
                let recordIngredientHandle = addArrayOrArrayItem(recipeRecordHandle, 'Items');
                xelib.SetValue(recordIngredientHandle, 'CNTO\\Item', ingredients[objIdx].item);
                xelib.SetUIntValue(recordIngredientHandle, 'CNTO\\Count', ingredients[objIdx].count);
                ++objIdx;
            }
            // otherwise they are referring to the same item; edit the count if necessary
            else {
                if (
                    ingredients[objIdx].count !==
                    xelib.GetUIntValue(recordIngredientHandles[recIdx], 'CNTO\\Count')
                ) {
                    xelib.SetUIntValue(recordIngredientHandles[recIdx], 'CNTO\\Count', ingredients[objIdx].count);
                }
                ++objIdx;
                ++recIdx;
            }
        }
    }
});
