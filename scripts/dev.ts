#!/usr/bin/env zx

import { os, echo, path, fs, $ } from "zx";

const platform = os.platform();

echo("开始构建 development ...");
echo("当前所在的目录是:", process.cwd());

const root = path.resolve(__dirname, "..");
const main = path.resolve(root, "packages/main");
const app = path.resolve(main, "app");
const bin = path.resolve(app, "bin");

let filename = path.resolve(bin, `${platform}/server`);
if (platform == "win32") {
  filename += ".exe";
}

if (!fs.existsSync(filename)) {
  await $`npm run build:server`;
}

if (!fs.existsSync(path.resolve(app, "plugin"))) {
  await $`npm run build:plugin`;
}

await $`npm run types`;
