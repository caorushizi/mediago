import "reflect-metadata";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { ServiceRunner } from "@mediago/service-runner";
import { resolveCoreBinaries, resolveDepsBinaries } from "./binaryResolver";

// All persistent data under one root: ~/.mediago-server/
//   data/       — database + config
//   logs/       — runtime & task logs
//   downloads/  — downloaded files (also video-root for player)
const ROOT_DIR = path.resolve(os.homedir(), ".mediago-server");
const DATA_DIR = path.resolve(ROOT_DIR, "data");
const LOG_DIR = path.resolve(ROOT_DIR, "logs");
const DOWNLOAD_DIR = path.resolve(ROOT_DIR, "downloads");
const DB_PATH = path.resolve(DATA_DIR, "mediago.db");

// Ensure directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const core = resolveCoreBinaries();
const deps = resolveDepsBinaries();

console.log("Resolved core binary:", path.dirname(core.coreBin));

const runner = new ServiceRunner({
  executableName: "mediago-core",
  executableDir: path.dirname(core.coreBin),
  preferredPort: 9900,
  internal: true,
  extraArgs: [
    `--enable-auth`,
    `--log-level=debug`,
    `--log-dir=${LOG_DIR}`,
    `--local-dir=${DOWNLOAD_DIR}`,
    `--schema-path=${core.coreConfig}`,
    `--m3u8-bin=${deps.n_m3u8dl_re}`,
    `--bilibili-bin=${deps.bbdown}`,
    `--direct-bin=${deps.gopeed}`,
    `--db-path=${DB_PATH}`,
    `--config-dir=${DATA_DIR}`,
  ],
});

runner.on("stdout", (chunk) => {
  process.stdout.write(chunk);
});

runner.on("stderr", (chunk) => {
  process.stderr.write(chunk);
});

runner.on("exit", (code, signal) => {
  console.log(`Go Core exited with code=${code}, signal=${signal}`);
});

const state = await runner.start();
console.log(`Go Core started at ${state.url} (pid: ${state.pid})`);
console.log(`Player UI available at ${state.url}/player/`);

// Handle graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...");
  await runner.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
