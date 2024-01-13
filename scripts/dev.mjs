#!/usr/bin/env zx

echo("开始构建 development ...");
echo("当前所在的目录是:", process.cwd());

await $`npm run build:server`;

await $`npm run build:mobile`;

await $`npm run build:plugin`;

await $`npm run types`;
