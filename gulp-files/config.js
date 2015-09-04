var dest      = "./dist",
    src       = './src',
    appConfig = require('../configs/app-config.json');

/**
 * Main configuration for gulp.
 */
module.exports = {
  /**
   * Browser sync config
   */
  browserSync: {
    server: {
      baseDir: dest
    }
  },
  /**
   * Fonts
   */
  fonts: {
    src  : src + "/assets/fonts/**",
    dest : dest + "/assets/fonts"
  },
  /**
   * Sass
   */
  sass: {
    src      : src + "/sass/custom.scss",
    srcWatch : src + "/sass/**/*.scss",
    dest     : dest + "/css",
    settings : {
      indentedSyntax: true
    }
  },
  /**
   * Images
   */
  images: {
    src  : src + "/assets/images/**",
    dest : dest + "/assets/images"
  },
  /**
   * Markup
   */
  markup: {
    src     : src + "/*.html",
    dest    : dest,
    version : appConfig.global.version
  },
  /**
   * Browserify config,
   * each bundle configuration will produce a separate bundle
   */
  browserify: {
    bundleConfigs: [{
      entries    : src + '/js/main.js',
      dest       : dest + '/js/',
      outputName : 'app.js',
      extensions : ['.hbs']
    }, {
      entries    : src + '/js/vendors.js',
      dest       : dest + '/js/',
      outputName : 'vendors.js',
      // list of modules to make require-able externally
      require    : ['jquery', 'backbone/node_modules/underscore']
      // See https://github.com/greypants/gulp-starter/issues/87 for note about
      // why this is 'backbone/node_modules/underscore' and not 'underscore'
    }]
  },
  /**
   * Development configuration
   * src files are the entire folder being watched
   * and destination is defined in each case
   */
  development: {
    cssSrc : src + '/css/*.scss',
    jsSrc  : src + '/js/main.js',
    dest   : dest + '/js/',
    api    : appConfig.development.api_url
  },
  /**
   * Production configuration
   */
  production: {
    cssSrc : src + '/css/*.scss',
    jsSrc  : src + '/js/main.js',
    dest   : dest + '/js/',
    api    : appConfig.production.api_url
  },
  /**
   * Staging configuration
   */
  staging: {
    cssSrc : src + '/css/*.scss',
    jsSrc  : src + '/js/app.js',
    dest   : dest + '/js/',
    api    : appConfig.staging.api_url
  },
  /**
   * Testing configuration
   */
  testing: {
    cssSrc : src + '/css/*.scss',
    jsSrc  : src + '/js/app.js',
    dest   : dest + '/js/',
    api    : appConfig.testing.api_url
  }
};
