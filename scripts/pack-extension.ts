/**
 * Zip the built Chromium extension into `release/` so the user can
 * share a single file. Matches the cross-platform pattern in
 * `scripts/download-deps.ts` (PowerShell on Windows, `zip` on Unix).
 *
 * Run via:
 *   pnpm build:extension
 *   tsx scripts/pack-extension.ts
 * (or `pnpm pack:extension` which chains both).
 */

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extDir = join(root, "packages", "mediago-extension");
const distDir = join(extDir, "dist");
const releaseDir = join(root, "release");

interface PkgJson {
  version?: string;
}

function readVersion(): string {
  const pkg = JSON.parse(
    readFileSync(join(extDir, "package.json"), "utf8"),
  ) as PkgJson;
  return pkg.version ?? "0.0.0";
}

function zipDirectory(sourceDir: string, outputZip: string): void {
  // Make sure any stale zip at the target path is gone — Windows'
  // Compress-Archive refuses to overwrite silently.
  if (existsSync(outputZip)) rmSync(outputZip);

  if (process.platform === "win32") {
    const ps = `Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${outputZip}' -Force`;
    execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: "inherit" });
  } else {
    // -r recursive, run inside sourceDir so paths are relative, use -q
    // to silence per-file output.
    execSync(`cd "${sourceDir}" && zip -r -q "${outputZip}" .`, {
      stdio: "inherit",
    });
  }
}

function main(): void {
  if (!existsSync(distDir)) {
    console.error(
      `[pack-extension] ${distDir} does not exist. Run \`pnpm build:extension\` first.`,
    );
    process.exit(1);
  }

  mkdirSync(releaseDir, { recursive: true });

  const version = readVersion();
  const outputZip = join(releaseDir, `mediago-extension-v${version}.zip`);

  console.log(`[pack-extension] zipping ${distDir} → ${outputZip}`);
  zipDirectory(distDir, outputZip);
  console.log(`[pack-extension] ✓ created ${outputZip}`);
}

main();
