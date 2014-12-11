// Include gulp
var gulp = require('gulp');

// Include dependencies
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('static/app/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src('static/app/**/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('static/dist'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('static/dist'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('static/app/**/*.js', ['lint', 'scripts']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'watch']);