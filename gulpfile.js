var gulp = require('gulp');
var jshint = require('gulp-jshint');


gulp.task('default', function() {
  return gulp.src(['./*.js', './public/js/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

