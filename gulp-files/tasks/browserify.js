/**
 * Browserify dependencies
 * vinyl dependence is for gulp stream compatible
 */

var gulp = require('gulp'),
  browserify = require('browserify'),
  browserSync = require('browser-sync'),
  mergeStream = require('merge-stream'),
  handleErrors = require('../util/handleErrors'),
  bundleLogger = require('../util/bundleLogger'),
  source = require('vinyl-source-stream'),
  gulpReplace = require('gulp-replace'),
  streamify = require('gulp-streamify'),
  watchify = require('watchify'),
  environment = require('yargs').argv._[0] || 'default',
  _ = require('lodash'),
  appConfig = require('../config'),
  urlConfig = require('../../configs/trends-config.json'),
  config = require('../config').browserify;


/**
 * Browserify with bundle config
 * @param {} bundleConfig
 */
function browserifyConfigBuilder (options) {
  var b,
    bundleConfig = options.bundleConfig,
    bundle = options.bundle,
    jshint = options.jshint;

  b = browserify(bundleConfig);
  if (bundleConfig.require) {
    b.require(bundleConfig.require);
  }

  if (bundleConfig.debug) {
    b = watchify(b);
  }

  if (options.watch) {
    b.on('update', function () {
      if (bundle) {
        bundle(bundleConfig, b);
      }
      if (jshint) {
        jshint();
      }
    });

    bundleLogger.watch(bundleConfig.outputName);
  }

  return b;
}


/**
 * Bundle everything
 * with the configuration you need
 * @param {} bundleConfig
 * @param {} b
 */
function bundle(bundleConfig, b) {
  bundleLogger.start(bundleConfig.outputName);
  return b
    .bundle()
    .on('error', handleErrors)
    .pipe(source(bundleConfig.outputName))
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

function runBrowserify (bundleConfig) {

  var b,
    watch = appConfig[environment].watch,
    debug = appConfig[environment].debug,
    params;

  if (bundleConfig && debug) {
    bundleConfig.debug = debug;
  }

  params = {
    bundleConfig: bundleConfig,
    envirorment: environment,
    watch: watch
  };

  if (watch) {
    params.bundle = bundle;
    params.jshint = function () {
      gulp.start('jshint');
    };
  }

  b = browserifyConfigBuilder(params);

  return bundle(bundleConfig, b);
}


gulp.task('browserify', function () {
  return mergeStream.apply(gulp, _.map(config.bundleConfigs, function (bundleConfig) {
    return runBrowserify(bundleConfig);
  }));
});
