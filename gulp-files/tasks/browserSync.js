var browserSync = require('browser-sync'),
    gulp        = require('gulp'),
    config      = require('../config').browserSync;

gulp.task('browser-sync', ['replace'], function() {
  browserSync(config);
});
