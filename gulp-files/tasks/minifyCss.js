var gulp      = require('gulp'),
    config    = require('../config').production,
    minifyCSS = require('gulp-minify-css'),
    size      = require('gulp-filesize');

gulp.task('minify-css', ['sass'], function() {
  return gulp.src(config.cssSrc)
    .pipe(minifyCSS())
    .pipe(gulp.dest(config.dest))
    .pipe(size());
});
