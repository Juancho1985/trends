/**
 * Gulpfile is separated each stream in the gulp directory.
 * Default and production are the two ambients created
 */
var requireDir = require('require-dir');
//Require tasks and subdirectories
requireDir('./gulp-files', { recurse: true });
