var gulp    = require('gulp'),
sourcemaps   = require('gulp-sourcemaps'),
config  = require('../../config').production,
size    = require('gulp-filesize'),
rename = require('gulp-rename'),
uglify = require('gulp-uglify');

gulp.task('uglifyJs', ['browserify'], function() {
  return gulp.src(config.dest + '/app.js')
    .pipe(uglify())
    .pipe(gulp.dest(config.dest))
    .pipe(size());
});
