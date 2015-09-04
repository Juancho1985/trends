var _          = require('lodash'),
  watchify     = require('watchify'),
  browserify   = require('browserify'),
handleErrors     = require('../../util/handleErrors'),
  bundleLogger = require('../../util/bundleLogger'),
  browserifyConfig;
/**
 * Browserify with bundle config
 * @param {} bundleConfig
 */
function defaultConfig(bundleConfig){
  var b;
  b = browserify(bundleConfig);
  if (bundleConfig.require) {
    b.require(bundleConfig.require);
  }
  return b;
}
/**
 * Browserify config
 * Config before create bundle for each release mode
 */
browserifyConfig = {
  /**
   * Ommit external and require, this options where preventing watchify to recompile
   * @param {} bundleConfig
   */
  development: function (bundleConfig, bundle) {
    var b;
    _.extend(bundleConfig, watchify.args, { debug: true });
    bundleConfig = _.omit(bundleConfig, ['external', 'require']);
    b = browserify(bundleConfig);
    b = watchify(b);
    b.on('update', function () {
      return bundle(bundleConfig, b, 'development');
    });
    bundleLogger.watch(bundleConfig.outputName);
    return b;
  },
  production: function (bundleConfig, bundle) {
    return defaultConfig(bundleConfig);
  },
  staging: function (bundleConfig) {
    return defaultConfig(bundleConfig);
  },
  testing: function (bundleConfig) {
    return defaultConfig(bundleConfig);
  }
};

module.exports = browserifyConfig;
