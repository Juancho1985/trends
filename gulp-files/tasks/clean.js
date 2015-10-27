var gulp = require('gulp'),
    gutil    = require('gulp-util'),
    del      = require('del');

gulp.task('clean', function (cb) {
  del(['./dist/*'], function (err, paths) {
    if (err) {
      gutil.log('Error on clean dist', err);
    } else {
      gutil.log('Deleted files/folders:\n', paths.join('\n'));
    }

    if (cb) {
        cb();
    }
  });
});
