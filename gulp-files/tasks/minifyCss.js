var gulp      = require('gulp'),
    config    = require('../config'),
    minifyCSS = require('gulp-minify-css'),
    environment      = require('yargs').argv._[0] || 'default',
    size      = require('gulp-filesize');

gulp.task('minify-css', ['sass'], function () {
  var
      environmentConfig = config[environment],
      source = environmentConfig.destCss;
  return gulp.src(source + '/factory.css')
    .pipe(minifyCSS())
    .pipe(gulp.dest(source))
    .pipe(size());
});
