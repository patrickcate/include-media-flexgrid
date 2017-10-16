/* eslint strict: ["error", "global"] */
/* eslint-disable no-console */
'use strict';

const gulp = require('gulp');
const fs = require('fs');
const cp = require('child_process');
const config = JSON.parse(fs.readFileSync('./gulp.config.json'));
const assets = require('postcss-assets');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync');
const easysprite = require('postcss-easysprites');
const flexbox_fixer = require('postcss-flexbugs-fixes');
const gulpif = require('gulp-if');
const imagemin = require('gulp-imagemin');
const inline_svg = require('postcss-inline-svg');
const modernizr = require('gulp-modernizr');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const shell = require('gulp-shell');
const sourcemaps = require('gulp-sourcemaps');
const svgo = require('postcss-svgo');
const uglify = require('gulp-uglify');

// Error notifications
const reportError = function (error) {
  notify({
    title: 'Gulp Task Error',
    message: 'Check the console.'
  }).write(error);
  console.log(error.toString());
  this.emit('end');
};


// Build the Jekyll Site
gulp.task('jekyll-build', function (done) {
  // browserSync.notify(messages.jekyllBuild);
  return cp.spawn('bundle', ['exec', 'jekyll', 'build'], {stdio: 'inherit'}).on('error', reportError).on('close', done);
});


// Rebuild Jekyll & do page reload
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
  browserSync.reload();
});


// Wait for jekyll-build, then launch the Server
gulp.task('browser-sync', ['sass', 'jekyll-build'], function() {
  browserSync({
    server: {
      baseDir: '_site'
    }
  });
});


// Generate CSS and autoprefix
gulp.task('sass', function () {
  gulp.src(config.sass.src + '**/*.scss')
  .pipe(plumber(reportError))
  .pipe(gulpif(config.sourcemaps.enable, sourcemaps.init({
    loadMaps: true
  })))
  .pipe(sass(config.sass.settings))
  
  // Run CSS through postcss plugins
  .pipe(
    postcss([
      flexbox_fixer(),
      autoprefixer(config.postcss.autoprefixer),
      inline_svg(),
      assets({
        loadPaths: [config.postcss.assets.loadPaths]
      }),
      svgo(),
      easysprite({
        imagePath: config.postcss.easysprite.imagePath,
        spritePath: config.postcss.easysprite.spritePath,
        stylesheetPath: config.postcss.easysprite.stylesheetPath
      })
    ])
  )
  
  // Create sourcemaps
  .pipe(gulpif(config.sourcemaps.enable, sourcemaps.write(config.sass.sourcemaps)))
  
  // Save to theme CSS folder
  .pipe(gulp.dest(config.sass.dest))
  
  // Reload changes with browsersync
  .pipe(browserSync.stream({match: '**/*.css'}))
  
  // Let me know when it's finished
  .pipe(notify({
    onLast: true,
    title: 'SASS',
    message: 'CSS has finished compiling.'
  }));
});


// BrowserSync
gulp.task('browser-sync', ['sass', 'jekyll-build'], function () {
  
  if (config.browserSync.enable) {
    
    // Watch files
    const files = [
      'assets/css/**/*.css',
      'assets/js/**/*.js',
      '**/*.html',
      '**/*.md',
      '**/*.yml'
    ];
    
    // Initialize browsersync
    browserSync.init(files, {
      
      // Browsersync with a php server
      // proxy: config.browserSync.dev.url,
      notify: config.browserSync.dev.notify,
      open: config.browserSync.dev.open,
      server: {
        baseDir: '_site',
        index: 'index.html'
      }
    });
  }
});


// Compress Images
gulp.task('compress-images', function () {
  gulp.src(config.images.src)
  .pipe(plumber())
  .pipe(imagemin())
  .pipe(gulp.dest(config.sass.dest))
  
  // Let me know when it's finished
  .pipe(notify({
    onLast: true,
    title: 'Images',
    message: 'Images have been minified.'
  }));
});


// Modernizr build tasks
gulp.task('modernizr', function () {
  gulp.src(config.modernizr.src + '**/*.css')
  .pipe(modernizr('modernizr-custom.js', {
    tests: [
      'details',
      'touchevents',
      'inputtypes'
    ],
    options: [
      'addtest',
      'prefixes',
      'setClasses',
      'teststyles'
    ]
  }))
  .pipe(gulp.dest(config.modernizr.dest));
});


// JavaScript
gulp.task('js', function () {
  return gulp.src(config.js.src + '**/*.js')
  .pipe(plumber())
  .pipe(gulpif(config.sourcemaps.enable, sourcemaps.init({
    loadMaps: true
  })))
  .pipe(uglify())
  
  // Create sourcemaps
  .pipe(gulpif(config.sourcemaps.enable, sourcemaps.write(config.js.sourcemaps)))
  .pipe(gulp.dest(config.js.dest))
  
  // Let me know when it's finished
  .pipe(notify({
    onLast: true,
    title: 'JavaScript',
    message: 'JavaScript has been minified and moved.'
  }));
});


// Create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('js-watch', ['js'], function (done) {
  browserSync.reload();
  done();
});

// Run Drupal Console to clear all Drupal caches.
gulp.task('drupal', shell.task([
  'drupal cache:rebuild all']
));

// Watch Files For Changes
gulp.task('watch', function () {
  gulp.watch(config.sass.src + '**/*.scss', ['sass']);
  gulp.watch(config.images.src + '**/*.{jpg,png,gif}', ['compress-images']);
  gulp.watch(config.js.src + '**/*.js', ['js-watch']);
  gulp.watch(['_data/*.*', '_pages/*.*', '_layouts/*.*', '_includes/*.*', '_examples/*', './assets/**/*.*'], ['jekyll-rebuild']);
});


// Run watch task by default
gulp.task('default', ['sass', 'modernizr', 'compress-images', 'browser-sync', 'watch'], function () {
  // place code for your default task here
});
