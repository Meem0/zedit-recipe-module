// modalOptions.args interface:
//   recipeObject: the recipeObject to be saved
//   callback(filename): called when a file is selected. passes the selected filename
ngapp.controller('chooseNewRecipeFileModalController', function($scope) {
    // helper functions
    let initPlugins = function() {
        let lastMasterLoadOrder = 0;
        xelib.WithHandles(
            getRecipeMasters($scope.modalOptions.args.recipeObject),
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
        $scope.modalOptions.args.callback($scope.destinationFileName);
    };

    $scope.label = $scope.modalOptions.args.recipeObject.editorId;
    $scope.destinationFileName = '';
    initPlugins();
});
