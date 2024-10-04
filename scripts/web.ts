#!/usr/bin/env zx
import { echo, $ } from "zx";

$.verbose = true;

echo("开始构建 production ...");
echo("当前所在的目录是:", process.cwd());

await $`npm run types:renderer`;

await $`npm run build:backend`;

await $`npm run build:web`;
