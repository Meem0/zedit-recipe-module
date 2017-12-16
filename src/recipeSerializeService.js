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
