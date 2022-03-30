const child = require('child_process');
const gulp = require('gulp');
const copy = require('gulp-copy');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');

const tsTestServerProject = ts.createProject('tsconfig.json');
const tsLibProject = ts.createProject('tsconfig.lib.json');

let node = null;

gulp.task('copy-lib', function() {
    return gulp.src([
        'package.json',
        '.npmignore'
    ]).pipe(copy('dist', { prefix: 1 }))
});

gulp.task('build-lib', gulp.series(function() {
    return tsLibProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsLibProject())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));
}, 'copy-lib'));

gulp.task('build', gulp.series(function () {
    return tsTestServerProject.src()
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(tsTestServerProject())
        .js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build'));
}));

gulp.task('start', gulp.series('build', function(done) {
    if (!!node) {
        node.kill();
    }

    node = child.spawn('node', ['build/test-server/server.js'], {stdio: 'inherit'});
    node.on('close', function (code) {
        if (code === 8) {
            gulp.log('Error detected, waiting for changes...');
        }
    });

    done();
}));

gulp.task('watch', function() {
    gulp.watch(tsTestServerProject.config.include, gulp.series('build', 'start'));
});

gulp.task('default', gulp.parallel('watch', 'start'));

process.on('exit', function() {
    if (!!node) {
        node.kill();
    }
});
