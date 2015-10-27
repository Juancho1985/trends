var
    gulp = require('gulp');

gulp.task('development', ['assets', 'minify-css', 'uglify'], function () {
    gulp.start('replace');
});
