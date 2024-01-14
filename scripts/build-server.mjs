#!/usr/bin/env zx

const platform = os.platform();

let GOOS = "";
let GOARCH = "amd64";
let filename = "../packages/main/bin/win32/server";

if (platform == "linux") {
  GOOS = "linux";
} else if (platform == "darwin") {
  GOOS = "darwin";
} else if (platform == "win32") {
  GOOS = "windows";
  filename += ".exe";
} else {
  console.error(`Unsupported OS: ${platform}`);
  process.exit(1);
}

await $`cd internal && npx cross-env GIN_MODE=release GOOS=${GOOS} GOARCH=${GOARCH} go build -o ${filename}`;
