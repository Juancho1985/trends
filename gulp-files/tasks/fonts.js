var  changed    = require('gulp-changed'),
     gulp       = require('gulp'),
     config     = require('../config').fonts,
     browserSync  = require('browser-sync');

gulp.task('fonts', function() {
  return gulp.src(config.src)
    .pipe(changed(config.dest)) // Ignore unchanged files
    .pipe(gulp.dest(config.dest))
    .pipe(browserSync.reload({stream:true}));
});
