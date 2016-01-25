var istanbul = require('browserify-istanbul');

module.exports = function(config) {
  config.set({
    //logLevel: 'LOG_DEBUG',

    reporters: ['spec', 'coverage'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun : true,

    autoWatch : false,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    port: 9876,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: [
      'mocha',
      'browserify'
    ],

    files: [
      'src/js/vendors.js',
      'src/js/commons/**/*.js',
      'src/js/**/!(start).js',
      'test/**/**.test.js'
    ],

    global: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50
    },

    // list of files to exclude
    exclude: [],

    preprocessors: {
      'src/js/**/*.js': ['browserify', 'coverage'],
      'test/**/**.test.js': ['browserify']
    },

    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        { type: 'html'},
        { type: 'text'},
        { type: 'lcov', subdir: 'lcov/'}
      ],
      instrumenterOptions: {
        istanbul: {
          noCompact: true
        }
      },
      instrumenter: {
        'test/**/*.js': 'istanbul'
      },
      includeAllSources: true
    },

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [
      'PhantomJS2'//, 'Firefox'
    ],
    browserify: {
      debug: true,
      extensions: [ ".js", ".hbs" ],
      transform: [['hbsfy', { "extensions": "hbs"}], 'babelify', 'brfs', istanbul({
        ignore: ['**/node_modules/**', '**/test/**']
      })]
    },
    babelPreprocessor: {
      options: {
        presets: ['es2015']
      }
    },
    plugins: [
      require("karma-nyan-reporter"),
      require("karma-mocha"),
      require("karma-firefox-launcher"),
      require("karma-phantomjs2-launcher"),
      require("karma-coverage"),
      require("karma-browserify"),
      require("karma-spec-reporter"),
      require("karma-babel-preprocessor"),
      require("babel-preset-es2015")
    ]
  });
};
