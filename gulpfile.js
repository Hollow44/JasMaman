'use strict'

var gulp = require("gulp"),
    debug = require("gulp-debug"),
    rename = require('gulp-rename'),
    babel = require("gulp-babel"),
	sass = require('gulp-sass')(require('node-sass')),
	autoprefixer = require('autoprefixer'),
	postcss = require('gulp-postcss');	

let {clean, restore, build, test, pack, publish, run} = require('gulp-dotnet-cli');
const { series } = require('gulp');

process.env.NODE_ENV = 'production';

gulp.task("transpile", function () {
    return gulp.src(["./**/*.jsx"], { base: "." })
        //.pipe(debug({ title: 'babel:' }))
        .pipe(babel({
            presets: ["react-app"]
        }))
        .pipe(rename({prefix:"_compiled_"}))
        .pipe(gulp.dest("."))
        .pipe(debug({ title: 'babel:' }));
});

var sassFiles = ['./**/*.scss', "!node_modules/", "!node_modules/**"];
function scss() {
    return gulp.src(sassFiles, { base: "." })
        .pipe(sass({
            includePaths: ['Scss']
        }).on('error', sass.logError))
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(postcss([autoprefixer()]))
        .pipe(gulp.dest("."));
}

gulp.task("scss-compile", scss);



gulp.task('watch', () => {
    gulp.watch(sassFiles, (done) => {
        gulp.series(['scss-compile'])(done);
    });
});

gulp.task('default', series(['watch']));
