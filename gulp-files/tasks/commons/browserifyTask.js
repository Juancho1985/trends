/**
 * Browserify dependencies
 * vinyl dependence is for gulp stream compatible
 */
var browserify   = require('browserify'),
replace          = require('gulp-replace'),
browserSync      = require('browser-sync'),
watchify         = require('watchify'),
sourcemaps       = require('gulp-sourcemaps'),
streamify        = require('gulp-streamify'),
mergeStream      = require('merge-stream'),
bundleLogger     = require('../../util/bundleLogger'),
gulp             = require('gulp'),
handleErrors     = require('../../util/handleErrors'),
source           = require('vinyl-source-stream'),
config           = require('../../config').browserify,
appConfig        = require('../../config'),
_                = require('lodash'),
browserifyConfig = require('./browserifyConfig'),
browserifyTask;

/**
 * Bundle everything
 * with the configuration you need
 * @param {} bundleConfig
 * @param {} b
 */
function bundle(bundleConfig, b, mode) {
  bundleLogger.start(bundleConfig.outputName);
  return b
    .bundle()
    .on('error', handleErrors)
    .pipe(source(bundleConfig.outputName))
    .pipe(streamify(replace(/__api__/g, appConfig[mode].api)))
    .pipe(gulp.dest(bundleConfig.dest))
    .pipe(browserSync.reload({
      stream: true
    }));
}
/**
 * Run browserify in the mode specified
 * @param {} bundleConfig
 * @param String mode
 */
function runBrowserify(bundleConfig, mode) {
  var b;
  b = browserifyConfig[mode](bundleConfig, bundle);
  return bundle(bundleConfig, b, mode);
}
/**
 * Browserify task
 * Bundle for app and bundle for vendors, load strategy
 * @param string mode
 */
function browserifyTask(mode) {
  return mergeStream.apply(gulp, _.map(config.bundleConfigs, function (bundleConfig) {
    return runBrowserify(bundleConfig, mode);
  }));
}
/**
 * Gulp task browserify
 */
gulp.task('browserify', function () {
  return browserifyTask('production');
});

/**
 * Exports browserify task so we can call it directly in our watch task, with
 * development mode
 */
module.exports = browserifyTask;
