import "reflect-metadata";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { ServiceRunner } from "@mediago/service-runner";
import { resolveCoreBinaries, resolveDepsBinaries } from "./binaryResolver";

const DATA_DIR = path.resolve(os.homedir(), ".mediago-server");
const LOG_DIR = path.resolve(DATA_DIR, "logs");
const DB_PATH = path.resolve(DATA_DIR, "app.db");
const CONFIG_DIR = DATA_DIR;

// Ensure data directories exist
fs.mkdirSync(LOG_DIR, { recursive: true });

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
    `--schema-path=${core.coreConfig}`,
    `--m3u8-bin=${deps.n_m3u8dl_re}`,
    `--bilibili-bin=${deps.bbdown}`,
    `--direct-bin=${deps.gopeed}`,
    `--db-path=${DB_PATH}`,
    `--config-dir=${CONFIG_DIR}`,
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
