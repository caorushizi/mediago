import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  createPnpmLauncher,
  probePnpmPath,
  resolvePnpmEntrypoint,
} from "../process/bundle-env-runtime.ts";
import { assertCleanAudit, auditFailureSummary } from "./policy.ts";

const root = path.resolve(import.meta.dirname, "../../../..");
const mode = process.argv[2];
if (mode === "js") {
  const entrypoint = await resolvePnpmEntrypoint({
    environment: process.env,
    platform: process.platform,
    probe: probePnpmPath,
  });
  const launcher = createPnpmLauncher({
    args: ["audit", "--json"],
    entrypoint,
    nodeExecutable: process.execPath,
    platform: process.platform,
  });
  const result = spawnSync(launcher.command, launcher.args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  try {
    assertCleanAudit(result.status, result.stdout);
  } catch (error) {
    console.error(
      "Dependency audit diagnostic:",
      auditFailureSummary(result.status, result.stdout),
    );
    throw error;
  }
  console.log(
    "Dependency audit passed: zero low/moderate/high/critical findings.",
  );
} else if (mode === "go") {
  const result = spawnSync("govulncheck", ["./..."], {
    cwd: path.join(root, "apps/core"),
    env: { ...process.env, CGO_ENABLED: "0" },
    stdio: "inherit",
    shell: false,
    timeout: 600_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error("Go vulnerability scan failed or found affected calls.");
} else {
  throw new Error("Usage: node packages/tooling/src/security/scan.ts <js|go>");
}
