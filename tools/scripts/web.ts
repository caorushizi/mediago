#!/usr/bin/env zx
import { echo, $ } from "zx";

$.verbose = true;
if (process.platform === "win32") {
  $.prefix = "";
  $.shell = "pwsh.exe";
}

echo("开始构建 production ...");
echo("当前所在的目录是:", process.cwd());

await $`npm run types`;

await $`npm run build:backend`;

await $`npm run build:web`;
