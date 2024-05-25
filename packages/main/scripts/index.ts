import { deleteSync } from "del";
import { ElectronApp, mainResolve, Env, isMac, isLinux } from "./utils";
import gulp from "gulp";
import chmod from "gulp-chmod";
import * as esbuild from "esbuild";
import consola from "consola";
import { browserOptions, nodeOptions, getReleaseConfig } from "./config";
import gulpIf from "gulp-if";
import semver from "semver";
import pkg from "../app/package.json";
import * as builder from "electron-builder";

process.env.NODE_ENV = "development";

const env = Env.getInstance();
env.loadDotEnvRuntime();

async function clean() {
  return deleteSync([
    mainResolve("app/build"),
    mainResolve("app/bin"),
    mainResolve("release"),
  ]);
}

// function copySqlLite() {
//   const path = "build/Release/better_sqlite3.node";
//   const from = mainResolve("node_modules/better-sqlite3", path);
//   const to = mainResolve("app/build/Release");
//   return gulp.src(from).pipe(gulp.dest(to));
// }

function copyBin() {
  return gulp
    .src(mainResolve("bin", process.platform, "*"), {
      ignore: [".gitignore", "Logs/**/*"],
    })
    .pipe(gulp.dest(mainResolve("app/bin")));
}

function chmodBin() {
  return gulp
    .src(mainResolve("app/bin/*"))
    .pipe(gulpIf(isMac || isLinux, chmod(0o777)));
}

const copy = gulp.parallel(copyBin);

async function watchTask() {
  const app = new ElectronApp();
  const main = await esbuild.context(nodeOptions("src/index.ts"));
  const preload = await esbuild.context(browserOptions("src/preload.ts"));

  const watcher = gulp.watch(["./src"]);
  watcher
    .on("ready", async () => {
      await main.rebuild();
      await preload.rebuild();
      app.start();
    })
    .on("change", async () => {
      await main.rebuild();
      await preload.rebuild();
      app.restart();
    })
    .on("error", (error) => {
      consola.error(error);
      process.exit();
    });
  return Promise.resolve();
}

async function buildTask() {
  await esbuild.build(nodeOptions("src/index.ts"));
  await esbuild.build(browserOptions("src/preload.ts"));
}

async function pack() {
  if (semver.neq(process.env.APP_VERSION || "", pkg.version)) {
    throw new Error("请先同步构建版本和发布版本");
  }
  const config = getReleaseConfig();
  if (process.env.GH_TOKEN) {
    config.publish = {
      provider: "github",
      repo: "mediago",
      owner: "caorushizi",
      releaseType: "release",
    };
  }
  await builder.build({ config });
}

// 开发环境
export const dev = gulp.series(clean, copy, chmodBin, watchTask);
// 构建打包
export const build = gulp.series(clean, copy, chmodBin, buildTask);
// release
export const release = gulp.series(pack);
