var changed    = require('gulp-changed'),
    gulp       = require('gulp'),
    config     = require('../config').images,
    browserSync  = require('browser-sync');

gulp.task('images', function() {
  return gulp.src(config.src)
    .pipe(changed(config.dest)) // Ignore unchanged files
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.reload({stream:true}));
});
