var gulp = require('gulp'),
config   = require('../config'),
replace  = require('gulp-replace');

gulp.task('staging', ['fonts', 'markup', 'images', 'minifyCss', 'uglifyJs'], function () {
  return replace('staging', config);
});
