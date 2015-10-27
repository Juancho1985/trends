var gulp     = require('gulp'),
    config       = require('../config').jshint,
    stylish      = require('gulp-jscs-stylish'),
    jscs         = require('gulp-jscs'),
    noop         = function () {},
    jshint       = require('gulp-jshint');


/**
* Start jshint
*/

gulp.task('jshint', function () {
  return gulp.src(config.src)
    .pipe(jshint())
    .pipe(jscs())
    .on('error', noop) //In order to stop jscs error to combine with jshint
    .pipe(stylish.combineWithHintResults())
    .pipe(jshint.reporter('default'));
});
