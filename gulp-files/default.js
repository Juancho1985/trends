var
    gulp = require('gulp');

gulp.task('default', ['assets', 'watch'], function () {
    gulp.start('replace');
});
