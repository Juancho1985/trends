var gulp = require('gulp'),
config   = require('../config'),
replace  = require('./commons/replace');

gulp.task('production', ['fonts', 'markup', 'images', 'minifyCss', 'uglifyJs'], function () {
  return replace('production', config);
});
