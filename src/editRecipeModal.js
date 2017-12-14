ngapp.controller('editRecipeModalController', function($scope) {
    // initialize scope variables
    $scope.message = `ayy lets make some recipes for ${xelib.FullName($scope.modalOptions.handle)}`;
    $scope.ref_handle = $scope.modalOptions.handle;
    $scope.ref_value = '';
    $scope.ref_signature = xelib.Signature($scope.ref_handle);
    $scope.ref_signatures = ['ARMO', 'WEAP'];

    // scope functions
    $scope.closeModal = function() {
        $scope.$emit('closeModal');
    };
});
