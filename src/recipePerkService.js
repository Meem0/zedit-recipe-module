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
