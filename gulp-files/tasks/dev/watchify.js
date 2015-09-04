var gulp           = require('gulp'),
browserifyTask = require('../commons/browserifyTask');

gulp.task('watchify', ['browserSync'], function () {
  return browserifyTask('development');
});
