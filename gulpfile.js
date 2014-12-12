// Include gulp and dependencies
var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    fileInclude = require('gulp-file-include');

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

gulp.task('html', function(){
    return gulp.src('static/app/shared/layout.html')
        .pipe(fileInclude({
            prefix: '@@',
            basepath: 'static/app/'
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('templates/'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('static/app/**/*.js', ['lint', 'scripts']);
});

// Default Task
gulp.task('default', ['lint', 'scripts', 'html', 'watch']);