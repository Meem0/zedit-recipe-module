# zedit-module-boilerplate
A comprehensive boilerplate module for zEdit.

## tooling
- [node.js + npm](https://nodejs.org/) - javascript runtime and package manager
- [gulp](https://www.npmjs.com/package/gulp) - build system
- [gulp-include](https://www.npmjs.com/package/gulp-include) - gulp plugin for file concatenation
- [gulp-rename](https://www.npmjs.com/package/gulp-rename) - gulp plugin for renaming files and folders
- [gulp-zip](https://www.npmjs.com/package/gulp-zip) - gulp plugin for creating a ZIP archive
- [gulp-clean](https://www.npmjs.com/package/gulp-clean) - gulp plugin for cleaning dist directory before building

## structure
- `index.js`: The main javascript file.  You can use `//= require` to include other javascript files in it.
- `dist`: The "distribution" folder.  It contains all the assets your module needs for distribution.
- `src`: The "source" folder.  It contains javascript files which get included into `index.js`.
- `partials`: Folder for HTML partials.  This folder copied into `dist`.

## building
If you haven't already, open a command prompt in the module folder and run `npm install` to install dependencies.  You can then build the module using `npm run build`.  The module's files will be saved to the `dist` folder.

You can test your module with zEdit by copying the contents of the `dist` folder to a folder with the same name as the module's `id` from `module.json`.

When you're ready to publish a release you can use `npm run release` to create a properly packaged and named release archive.
