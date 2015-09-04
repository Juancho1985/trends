var gulp = require('gulp'),
config   = require('../config'),
replace  = require('gulp-replace');

gulp.task('testing', ['fonts', 'markup', 'images', 'minifyCss', 'uglifyJs'], function () {
  return replace('testing', config);
});
