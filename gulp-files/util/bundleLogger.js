/**
 * Bundle Logger
 * Provides gulp style logs to the bundle method in browserify.js
 */
var gutil        = require('gulp-util'),
prettyHrtime = require('pretty-hrtime'),
startTime;

module.exports = {
  start: function(filepath) {
    startTime = process.hrtime();
    gutil.log('Bundling', gutil.colors.green(filepath) + '...');
  },

  watch: function(bundleName) {
    gutil.log('Watching files required by', gutil.colors.yellow(bundleName));
  },
  end: function(filepath) {
    var taskTime = process.hrtime(startTime),
    prettyTime = prettyHrtime(taskTime);
    gutil.log('Bundled', gutil.colors.green(filepath), 'in', gutil.colors.magenta(prettyTime));
  },
  log: function (message) {
    gutil.log(message, gutil.colors.blue('Log'));
  },
  error: function (err) {
    gutil.log(err, gutil.colors.error('Error'));
  }
};
