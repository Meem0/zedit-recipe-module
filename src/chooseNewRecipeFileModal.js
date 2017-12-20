ngapp.controller('chooseNewRecipeFileModalController', function($scope) {
    // helper functions
    let initPlugins = function() {
        let lastMasterLoadOrder = 0;
        xelib.WithHandles(
            getRecipeMasters($scope.modalOptions.recipeObject),
            masterFileHandles => {
                lastMasterLoadOrder = xelib.GetFileLoadOrder(masterFileHandles[masterFileHandles.length - 1]);
            }
        );

        let plugins = [];
        xelib.WithHandles(
            xelib.GetElements(),
            fileHandles => {
                plugins = fileHandles.filter(fileHandle =>
                    xelib.GetIsEditable(fileHandle) && xelib.GetFileLoadOrder(fileHandle) >= lastMasterLoadOrder
                ).map(fileHandle => ({
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
    $scope.destinationFileName = '';
    initPlugins();
});
