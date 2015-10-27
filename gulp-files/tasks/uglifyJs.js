var gulp    = require('gulp'),
    config  = require('../config'),
    size    = require('gulp-filesize'),
    uglify = require('gulp-uglify'),
    environment      = require('yargs').argv._[0] || 'default';

gulp.task('uglify', ['browserify'], function () {
  var
      environmentConfig = config[environment],
      source = environmentConfig.dest;

  return gulp.src(source + '/factory.js')
      .pipe(uglify())
      .pipe(size())
      .pipe(gulp.dest(source));

});
