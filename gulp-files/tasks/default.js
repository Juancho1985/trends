var gulp = require('gulp'),
config   = require('../config'),
replace  = require('./commons/replace');

gulp.task('default', ['fonts', 'sass', 'images', 'markup','watch'], function () {
  return replace('development', config);
});
