var gulp = require('gulp'),
replace  = require('gulp-replace');

function replace(config, mode) {
  return gulp.src([config[mode].dest + 'app.js'])
             .pipe(replace(/__api__/g, config[mode].api))
             .pipe(gulp.dest(config[mode].dest));
}
module.exports = replace;
