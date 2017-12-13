ngapp.controller('editRecipeModalController', function($scope) {
    // initialize scope variables
    $scope.message = `ayy lets make some recipes for ${xelib.FullName($scope.modalOptions.handle)}`;

    // scope functions
    $scope.closeModal = function() {
        $scope.$emit('closeModal');
    };
});
