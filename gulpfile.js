'use strict';

var path = require('path');
var gulp = require('gulp');
var del = require('del');
var typescript = require('typescript');
var buildTools = require('via-build-tools');

var locations = new buildTools.config.Locations({
  root: path.resolve(__dirname)
});

buildTools.tasks.build(gulp, locations, {
  tsc: {
    typescript: typescript,
    forceConsistentCasingInFileNames: true,
    allowSyntheticDefaultImports: true
  }
});
buildTools.tasks.install(gulp, locations);
buildTools.tasks.project(gulp, locations);
buildTools.tasks.test(gulp, locations);

gulp.task('build.browser.assets', function(){
  return gulp.src([
      'src/browser/**/*.css',
      'src/browser/**/*.html',
      'src/browser/**/*.jpg',
      'src/browser/**/*.png'
    ], {base: 'src/browser'})
    .pipe(gulp.dest('build/browser'));
});

gulp.task("build.browser", ["build.browser.systemjs", "build.browser.assets"]);
gulp.task("build", ["build.browser", "build.node"]);

gulp.task('clean.node', function () {
  return del(['build/node/**/*']);
});

gulp.task('clean.browser', function () {
  return del(['build/browser/**/*', 'build/systemjs/**/*']);
});

gulp.task('clean', function () {
  return del(['build/**/*']);
});


