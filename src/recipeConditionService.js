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
