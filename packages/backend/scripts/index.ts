import { deleteSync } from "del";
import { mainResolve, Env, isDev } from "./utils";
import gulp from "gulp";
import * as esbuild from "esbuild";
import consola from "consola";
import { buildOptions } from "./config";
import fs from "fs";
import spawn from "cross-spawn";

const env = Env.getInstance();
env.loadDotEnvRuntime();

async function clean() {
  return deleteSync([mainResolve("dist/server")]);
}

async function buildClean() {
  return deleteSync([mainResolve("dist")]);
}

async function copyBin() {
  const source = mainResolve(
    "../main/bin",
    isDev ? process.platform : "linux",
    process.arch,
  );
  const target = mainResolve("dist/server/bin");
  fs.cpSync(source, target, {
    recursive: true,
    filter: (src) => {
      if (!isDev && src.endsWith("ffmpeg")) {
        return false;
      }

      return true;
    },
  });
}

const copy = gulp.parallel(copyBin);

async function watchTask() {
  const main = await esbuild.context(buildOptions());
  await main.rebuild();

  const watcher = gulp.watch(["./src"]);
  watcher
    .on("change", async () => {
      await main.rebuild();
    })
    .on("error", (error: any) => {
      consola.error(error);
    });

  return Promise.resolve();
}

async function startNodemon() {
  const nodemon = spawn("npm", ["start"], {
    stdio: "pipe",
  });

  nodemon.stdout?.on("data", (data) => {
    consola.log(data.toString());
  });

  // Listen for stderr data events
  nodemon.stderr?.on("data", (data) => {
    consola.error(`stderr: ${data.toString()}`);
  });

  // Listens for closing events of the child process
  nodemon.on("close", (code) => {
    consola.log(`子进程退出，退出码 ${code}`);
  });
  return Promise.resolve();
}

async function buildTask() {
  await esbuild.build(buildOptions());
}

// Development environment
export const dev = gulp.series(clean, copy, watchTask, startNodemon);
// Build packaging
export const build = gulp.series(buildClean, copy, buildTask);
