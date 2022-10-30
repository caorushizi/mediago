const gulp = require("gulp");
const ts = require("gulp-typescript");

const tsProject = ts.createProject("tsconfig.json");

function dev() {
    return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"));
}

module.exports = {dev}
