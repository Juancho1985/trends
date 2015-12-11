var gulp = require('gulp'),
  _ = require('lodash'),
  environment      = require('yargs').argv._[0] || 'default',
  pathsConfig  = require('../config'),
  urlsConfig = require('../../configs/trends-config.json'),
  replaceValues  = require('gulp-replace');

gulp.task('replace', ['browserify'], function () {
  var
    environmentConfig = _.merge(pathsConfig, urlsConfig)[environment];

  return gulp.src(environmentConfig.dest + 'factory.js')
    .pipe(replaceValues(/__([\w|-]*?)__/g, function ($0, $1) {
      return environmentConfig[$1];
    }))
    .pipe(gulp.dest(environmentConfig.dest));
});
