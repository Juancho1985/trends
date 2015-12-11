var gulp    = require('gulp'),
    config  = require('../config'),
    size    = require('gulp-filesize'),
    uglify = require('gulp-uglify'),
    environment      = require('yargs').argv._[0] || 'default';

function minifyJs(sourceFile) {
  var
      environmentConfig = config[environment],
      source = environmentConfig.dest;

  return gulp.src(source + sourceFile)
      .pipe(uglify())
      .pipe(gulp.dest(source));
}

gulp.task('uglify:vendors', ['browserify'], function () {
  minifyJs('vendors.js');
});


gulp.task('uglify', ['uglify:vendors'], function () {
  return minifyJs('factory.js');
});
