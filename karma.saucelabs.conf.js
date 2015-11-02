// https://saucelabs.com/platforms/
var browsers = {
  sl_chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7',
    version: '35'
  },
  /*
  sl_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: '30'
  },
  sl_ios_safari: {
    base: 'SauceLabs',
    browserName: 'iphone',
    platform: 'OS X 10.9',
    version: '7.1'
  },
  */
  sl_ie_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11'
  }
};

var key,
  defCfg = {},
  cfg = {
    // all other options that are defined in
    // local.karma.conf.js
    reporters: ['saucelabs', 'spec'],
    browsers: Object.keys(browsers),
    customLaunchers: browsers,
    //logLevel: 'LOG_INFO',
    captureTimeout: 1200000,
    maxDuration: 10800000,
    commandTimeout: 600000,
    idleTimeout: 1000000,
    browserNoActivityTimeout: 600000,

    // https://docs.saucelabs.com/reference/test-configuration
    sauceLabs: {
      testName: 'trends-tests',
      build: 'local ' + Date.now(),
      recordLogs: true,
      recordVideo: false,
      startConnect: true,
      recordScreenshots: true,
      captureHtml: true,
      passed: true,
      public: 'public',
      connectOptions: {
        port: 5757,
        logfile: 'sauce-connect.log'
      }
    },
    singleRun: true,
    autoWatch : false
  };

require('./karma.local.conf.js')({
  set: function(obj) {
    defCfg = obj;
  }
});

for (key in defCfg) {
  if (!(key in cfg) && defCfg.hasOwnProperty(key)) {
    cfg[key] = defCfg[key];
  }
}

module.exports = function(config) {
  config.set(cfg);
};
