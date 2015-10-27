var
    gulp = require('gulp');

gulp.task('staging', ['assets', 'minify-css', 'uglify'], function () {
    gulp.start('replace');
});
