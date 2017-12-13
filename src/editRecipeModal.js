ngapp.controller('editRecipeModalController', function($scope) {
    // initialize scope variables
    $scope.message = 'ayy lets make some recipes';

    // scope functions
    $scope.closeModal = function() {
        patcherService.saveSettings();
        $scope.$emit('closeModal');
    };
});