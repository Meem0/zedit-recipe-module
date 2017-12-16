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
