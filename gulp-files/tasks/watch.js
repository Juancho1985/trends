var gulp = require('gulp'),
  config = require('../config');

/**
 * Browserify for recompilyng with watchify,
 * BrowserSync reloads with compiled files
 */
gulp.task('watch', ['browser-sync'], function () {
  gulp.watch(config.sass.srcWatch, ['sass']);
  gulp.watch(config.images.src, ['images']);
  gulp.watch(config.markup.src, ['markup']);
});
