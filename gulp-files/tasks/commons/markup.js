var gulp     = require('gulp'),
config       = require('../../config').markup,
replace      = require('gulp-replace'),
bundleLogger = require('../../util/bundleLogger'),
browserSync  = require('browser-sync');

gulp.task('markup', function () {
  return gulp.src(config.src)
    .pipe(replace(/__version__/g, config.version))
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.reload({
      stream: true
    }));
});
