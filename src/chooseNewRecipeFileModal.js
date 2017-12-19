ngapp.controller('chooseNewRecipeFileModalController', function($scope) {
    // helper functions
    let initPlugins = function() {
        let plugins = [];
        xelib.WithHandles(
            xelib.GetElements(),
            fileHandles => {
                plugins = fileHandles.filter(xelib.GetIsEditable).map(fileHandle => ({
                    filename: xelib.Name(fileHandle),
                    loadOrder: xelib.GetFileLoadOrder(fileHandle)
                }));
            }
        );
        $scope.plugins = plugins.concat({
            filename: '< new file >'
        });
    };

    // scope functions
    $scope.save = function() {
        $scope.modalOptions.action.resolve($scope.destinationFileName);
        $scope.$emit('closeModal');
    };

    $scope.cancel = function() {
        $scope.modalOptions.action.reject();
        $scope.$emit('closeModal');
    };

    $scope.label = $scope.modalOptions.recipeObject.editorId;
    $scope.destinationFileName = 'ayy lmao';
    initPlugins();
});
