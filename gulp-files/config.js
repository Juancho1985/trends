var dest = "./dist",
    src = './src',
    appConfig = require('../configs/trends-config.json');

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
   * Jshint
   */
  jshint: {
    src: src + '/js/**/*.js'
  },
  /**
   * JSCS
   */
  jscs: {
    src: src + '/js/**/*.js'
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
   * Templates
   * (like import reference)
   */
  templates: {
    src: src + "/assets/templates/**",
    dest: dest + "/assets/templates"
  },
  /**
   * Fonts
   */
  fonts: {
    src: src + "/assets/fonts/**",
    dest: dest + "/assets/fonts"
  },
  /**
   * Assets
   */
  i18n: {
    src: src + "/assets/i18n/**",
    dest: dest + "/assets/i18n"
  },
  /**
   * Images
   */
  images: {
    src: src + "/assets/images/**",
    dest: dest + "/assets/images"
  },
  /**
   * Markup
   */
  markup: {
    src: src + "/**/*.html",
    dest: dest,
    version: appConfig.version
  },
  /**
   * Browserify config,
   * each bundle configuration will produce a separate bundle
   */
  browserify: {
    bundleConfigs: [{
      entries: src + '/js/start.js',
      dest: dest + '/js/',
      outputName: 'app.js',
      extensions: ['.hbs']
    }, {
      entries: src + '/js/vendors.js',
      dest: dest + '/js/',
      outputName: 'vendors.js',
      // list of modules to make require-able externally
      require: ['jquery', './node_modules/underscore/underscore']
      // See https://github.com/greypants/gulp-starter/issues/87 for note about
      // why this is 'backbone/node_modules/underscore' and not 'underscore'
    }]
  },
  /**
   * Development configuration
   * src files are the entire folder being watched
   * and destination is defined in each case
   */
  default: {
    cssSrc: src + '/css/*.scss',
    dest: dest + '/js/',
    jsSrc: src + '/js/start.js',
    watch: true,
    debug: true
  },
  /**
   * Development configuration
   * src files are the entire folder being watched
   * and destination is defined in each case
   */
  development: {
    cssSrc: src + '/css/*.scss',
    jsSrc: src + '/js/start.js',
    destCss : dest + '/css/',
    dest: dest + '/js/'
  },
  /**
   * Production configuration
   */
  production: {
    cssSrc  : src + '/css/*.scss',
    jsSrc   : src + '/js/start.js',
    dest    : dest + '/js/',
    destCss : dest + '/css/'
  }
};
