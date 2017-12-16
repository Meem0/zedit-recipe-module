ngapp.service('itemSignatureService', function() {
    const itemSignatures = ['ALCH', 'AMMO', 'ARMO', 'BOOK', 'INGR', 'MISC', 'SCRL', 'SLGM', 'WEAP'];

    // returns an array of signatures that correspond to inventory items
    this.getItemSignatures = function() {
        return itemSignatures;
    }
});
