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
            recipeObject.conditionPerk = recipeConditionService.getSmithingPerkLongNameFromConditionsHandle(
                conditionsHandle
            ).conditionPerk;
        }

        let ingredientsHandle = xelib.GetElement(recipeRecordHandle, 'Items');
        recipeObject.ingredients = xelib.GetElements(ingredientsHandle).map(ingredientHandle => ({
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
                let conditionHandle = 0;
                // need to create the conditions array
                if (conditionsHandle === 0) {
                    conditionsHandle = xelib.AddElement(recipeRecordHandle, 'Conditions');
                    conditionHandle = xelib.GetElement(conditionsHandle, '[0]');
                }
                // need to add an element to the existing conditions array
                else {
                    conditionHandle = xelib.AddArrayItem(conditionsHandle, '', '', '');
                }

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

        // ingredients
    }
});
