const gulp = require("gulp");
const ts = require("gulp-typescript");
const {join} = require("path")
const {spawn} = require('child_process')
const electron = require("electron");

const tsProject = ts.createProject("tsconfig.json");

let electronProcess = null;
let manualRestart = false;

function build() {
    return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"));
}

const dev = gulp.series(build, startElectron)
const restart = gulp.series(build, restartElectron)

gulp.watch(['src/**/*'], restart);

function restartElectron() {
    console.log("watch build succeed.");
    if (electronProcess && electronProcess.kill) {
        manualRestart = true;
        process.kill(electronProcess.pid);
        electronProcess = null;
        startElectron();

        setTimeout(() => {
            manualRestart = false;
        }, 5000);
    }
}

function startElectron() {
    let args = ["--inspect=5858", join(__dirname, "./dist/main.js")];

    electronProcess = spawn(String(electron), args);

    electronProcess.stdout.on("data", electronLog);

    electronProcess.stderr.on("data", electronLog);

    electronProcess.on("close", () => {
        if (!manualRestart) process.exit();
    });
}

function electronLog(data) {
    let log = "";
    data = data.toString().split(/\r?\n/);
    data.forEach((line) => {
        if (line.trim()) log += `${line}\n`;
    });
    console.log(log);
}

module.exports = {dev}
