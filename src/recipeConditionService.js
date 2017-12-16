keyValueArraysToObject = function(keys, values) {
    let obj = {};
    if (keys.length === values.length) {
        for (let i = 0; i < keys.length; ++i) {
            obj[keys[i]] = values[i];
        }
    }
    return obj;
}

const conditionKeys = [
    'Type',
    'Comparison Value',
    'Function',
    'Parameter #1',
    'Parameter #2',
    'Run On',
    'Reference',
    'Parameter #3'
];

const conditionIsEnchantedJson = JSON.stringify(keyValueArraysToObject(
    conditionKeys,
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

const conditionHasPerk = keyValueArraysToObject(
    conditionKeys,
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
const conditionHasPerkJson = JSON.stringify(conditionHasPerk);

conditionHandleToObject = function(conditionHandle) {
    return keyValueArraysToObject(
        conditionKeys,
        conditionKeys.map(key => xelib.GetValue(xelib.GetElement(conditionHandle, key)))
    );
}

isConditionEnchanted = function(conditionHandle) {
    return JSON.stringify(conditionHandleToObject(conditionHandle)) === conditionIsEnchantedJson;
}

let conditionArcane = {};
Object.assign(conditionArcane, conditionHasPerk);
conditionArcane['Parameter #1'] = arcanePerk.longName;
const conditionArcaneJson = JSON.stringify(conditionArcane);

isConditionArcane = function(conditionHandle) {
    return JSON.stringify(conditionHandleToObject(conditionHandle)) === conditionArcaneJson;
}

const perkLongNames = smithingPerks.map(perk => perk.longName);

// if the condition is a HasPerk for a smithing material perk, return the perk long name
getConditionPerk = function(conditionHandle) {
    let conditionObject = conditionHandleToObject(conditionHandle);
    let perk = conditionObject['Parameter #1'];
    // check if the condition is on a recognized smithing material perk
    if (perkLongNames.includes(perk)) {
        conditionObject['Parameter #1'] = '';
        // check if the condition matches the HasPerk condition template
        if (JSON.stringify(conditionObject) === conditionHasPerkJson) {
            return perk;
        }
    }
    return '';
}
