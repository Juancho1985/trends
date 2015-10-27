var gulp = require('gulp'),
    environment      = require('yargs').argv._[0] || 'default',
    config  = require('../config'),
    replaceValues  = require('gulp-replace');

gulp.task('replace', function () {
    var
        environmentConfig = config[environment],
        source = environmentConfig.src,
        apiUrl = environmentConfig.apiUrl,
        i18nUrl = environmentConfig.i18nUrl,
        destUrl = environmentConfig.destUrl;

    return gulp.src(source + 'factory.js')
        .pipe(replaceValues(/__api__/g, apiUrl))
        .pipe(replaceValues(/__i18n_url__/g, i18nUrl))
        .pipe(gulp.dest('../../' + destUrl));
});
