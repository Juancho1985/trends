var gulp = require('gulp'),
    karma = require('karma'),
    karmaTask;

karmaTask = function(done) {
  karma.server.start({
    configFile: process.cwd() + '/karma.conf.js',
    singleRun: true
  }, function(){
    done();
  });
};

gulp.task('karma', karmaTask);

module.exports = karmaTask;
