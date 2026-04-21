/**
 * download-deps.ts
 *
 * Provisions third-party tool binaries for the current (or all) platform(s).
 *
 * Two source types are supported:
 *   - `source: "github"` (default) — fetch from a GitHub Release.
 *   - `source: "local"` — copy from a repo-tracked directory (e.g. `extra/<tool>/`).
 *     Used for tools we can't reliably fetch from a single upstream (aria2's
 *     static builds are scattered across different repos per-platform), so we
 *     vendor them in-tree instead.
 *
 * Tools: ffmpeg, N_m3u8DL-RE, BBDown, aria2, yt-dlp, mediago.
 *
 * Usage:
 *   tsx scripts/download-deps.ts           # Download for current platform only
 *   tsx scripts/download-deps.ts --all     # Download for all platforms
 */

import {
  createWriteStream,
  createReadStream,
  existsSync,
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { rename, unlink, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load tool definitions
const depsVersions = JSON.parse(
  readFileSync(path.join(__dirname, "deps-versions.json"), "utf-8"),
);

// ============================================================
// Types
// ============================================================

interface ToolDef {
  /**
   * Where to fetch the binary from.
   * - "github" (default): download from a GitHub Release using `repo`, `version`, `assets`.
   * - "local": copy from a repo-tracked directory at `path/<os>/<arch>/<binaryName>`.
   */
  source?: "github" | "local";
  /** Repo-relative directory holding vendored binaries. Required for `source: "local"`. */
  path?: string;
  /** GitHub repo in `owner/name` form. Required for `source: "github"`. */
  repo?: string;
  /** Release tag (e.g. `v1.6.5`). Required for `source: "github"`. */
  version?: string;
  /** Per-platform asset filename on the GitHub release. Required for `source: "github"`. */
  assets?: Record<string, string>;
  binaryName: { default: string; win32?: string };
  extractBinary?: { default: string; win32?: string };
}

// ============================================================
// Platform helpers
// ============================================================

const PLATFORM_MAP: Record<string, string> = {
  darwin: "darwin",
  linux: "linux",
  win32: "win32",
};

const ARCH_MAP: Record<string, string> = {
  x64: "x64",
  arm64: "arm64",
};

function getCurrentPlatformKey(): string {
  const platform = PLATFORM_MAP[process.platform];
  const arch = ARCH_MAP[process.arch];
  if (!platform || !arch) {
    throw new Error(
      `Unsupported platform: ${process.platform}-${process.arch}`,
    );
  }
  return `${platform}-${arch}`;
}

function getAllPlatformKeys(): string[] {
  const keys: string[] = [];
  for (const p of Object.values(PLATFORM_MAP)) {
    for (const a of Object.values(ARCH_MAP)) {
      keys.push(`${p}-${a}`);
    }
  }
  return keys;
}

function getBinaryName(tool: ToolDef, platformKey: string): string {
  const isWin = platformKey.startsWith("win32");
  return isWin && tool.binaryName.win32
    ? tool.binaryName.win32
    : tool.binaryName.default;
}

function getExtractBinaryName(
  tool: ToolDef,
  platformKey: string,
): string | undefined {
  if (!tool.extractBinary) return undefined;
  const isWin = platformKey.startsWith("win32");
  return isWin && tool.extractBinary.win32
    ? tool.extractBinary.win32
    : tool.extractBinary.default;
}

// ============================================================
// Download and extraction
// ============================================================

const DEPS_DIR = path.resolve(__dirname, "..", ".deps");

async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url, {
    redirect: "follow",
    headers: process.env.GITHUB_TOKEN
      ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      : {},
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const fileStream = createWriteStream(dest);
  // @ts-expect-error Node.js ReadableStream compatibility
  await pipeline(response.body, fileStream);
}

async function extractGz(filePath: string, outputPath: string): Promise<void> {
  const gunzip = createGunzip();
  const source = createReadStream(filePath);
  const dest = createWriteStream(outputPath);
  await pipeline(source, gunzip, dest);
}

async function extractZip(zipPath: string, outputDir: string): Promise<void> {
  if (process.platform === "win32") {
    const psCommand = `Add-Type -AssemblyName System.IO.Compression.FileSystem; if (Test-Path -LiteralPath '${outputDir}') { Remove-Item -LiteralPath '${outputDir}' -Recurse -Force }; [System.IO.Compression.ZipFile]::ExtractToDirectory('${zipPath}', '${outputDir}')`;
    execSync(`powershell -NoProfile -Command "${psCommand}"`, {
      stdio: "pipe",
    });
  } else {
    execSync(`unzip -o "${zipPath}" -d "${outputDir}"`, { stdio: "pipe" });
  }
}

async function extractTarGz(
  tarGzPath: string,
  outputDir: string,
): Promise<void> {
  execSync(`tar -xzf "${tarGzPath}" -C "${outputDir}"`, { stdio: "pipe" });
}

/**
 * Copy a vendored (repo-tracked) binary from `<repoRoot>/<tool.path>/<os>/<arch>/<binaryName>`
 * into `.deps/<os>-<arch>/<binaryName>`. Used for tools whose per-platform
 * static builds live in the repo rather than upstream releases.
 *
 * The layout intentionally diverges from `.deps/`:
 *   - source:  `<tool.path>/<os>/<arch>/...`  (two-level `os/arch`)
 *   - dest:    `.deps/<os>-<arch>/...`        (flat `os-arch`)
 * which keeps the vendored tree navigable in a file browser while letting
 * binaryResolver.ts keep its single-directory-per-platform convention.
 */
function copyLocalTool(
  toolName: string,
  tool: ToolDef,
  platformKey: string,
): void {
  if (!tool.path) {
    console.log(`  ⚠ ${toolName} has source:"local" but no path; skipping`);
    return;
  }

  const [os, arch] = platformKey.split("-");
  const binaryName = getBinaryName(tool, platformKey);
  const srcFile = path.resolve(
    __dirname,
    "..",
    tool.path,
    os,
    arch,
    binaryName,
  );
  const destDir = path.join(DEPS_DIR, platformKey);
  const destFile = path.join(destDir, binaryName);

  if (!existsSync(srcFile)) {
    console.log(
      `  ⚠ No vendored ${toolName} at ${path.relative(process.cwd(), srcFile)}, skipping`,
    );
    return;
  }

  // Skip if destination already matches source (size-based heuristic —
  // cheap and catches the common case of "already provisioned once").
  if (existsSync(destFile)) {
    const srcSize = statSync(srcFile).size;
    const destSize = statSync(destFile).size;
    if (srcSize === destSize) {
      console.log(`  ✓ ${toolName} already exists for ${platformKey}`);
      return;
    }
  }

  mkdirSync(destDir, { recursive: true });
  copyFileSync(srcFile, destFile);

  if (!platformKey.startsWith("win32")) {
    try {
      chmodSync(destFile, 0o755);
    } catch {
      // Ignore permission errors on Windows host
    }
  }

  console.log(`  ✓ ${toolName} ready for ${platformKey} (local)`);
}

async function downloadTool(
  toolName: string,
  tool: ToolDef,
  platformKey: string,
): Promise<void> {
  // Vendored tools: bypass the GitHub release path entirely.
  if (tool.source === "local") {
    copyLocalTool(toolName, tool, platformKey);
    return;
  }

  if (!tool.assets) {
    console.log(`  ⚠ ${toolName} has no assets defined; skipping`);
    return;
  }
  const assetName = tool.assets[platformKey];
  if (!assetName) {
    console.log(`  ⚠ No asset for ${toolName} on ${platformKey}, skipping`);
    return;
  }
  if (!tool.repo || !tool.version) {
    console.log(`  ⚠ ${toolName} missing repo/version; skipping`);
    return;
  }

  const destDir = path.join(DEPS_DIR, platformKey);
  mkdirSync(destDir, { recursive: true });

  const binaryName = getBinaryName(tool, platformKey);
  const binaryPath = path.join(destDir, binaryName);

  // Skip if already downloaded
  if (existsSync(binaryPath)) {
    console.log(`  ✓ ${toolName} already exists for ${platformKey}`);
    return;
  }

  const url = `https://github.com/${tool.repo}/releases/download/${tool.version}/${assetName}`;
  const tempFile = path.join(destDir, assetName);

  console.log(`  ↓ Downloading ${toolName} for ${platformKey}...`);
  await downloadFile(url, tempFile);

  // Extract based on file type
  const extractBinaryName = getExtractBinaryName(tool, platformKey);

  if (assetName.endsWith(".gz") && !assetName.endsWith(".tar.gz")) {
    // Simple gzip (e.g., ffmpeg-static)
    await extractGz(tempFile, binaryPath);
    await unlink(tempFile);
  } else if (assetName.endsWith(".tar.gz")) {
    // tar.gz archive
    const extractDir = path.join(destDir, `_extract_${toolName}`);
    mkdirSync(extractDir, { recursive: true });
    await extractTarGz(tempFile, extractDir);

    // Find the binary in extracted directory
    const found = await findBinaryInDir(
      extractDir,
      extractBinaryName || binaryName,
    );
    if (found) {
      await rename(found, binaryPath);
    } else {
      throw new Error(
        `Could not find ${extractBinaryName || binaryName} in extracted archive`,
      );
    }

    await rm(extractDir, { recursive: true, force: true });
    await unlink(tempFile);
  } else if (assetName.endsWith(".zip")) {
    // zip archive
    const extractDir = path.join(destDir, `_extract_${toolName}`);
    mkdirSync(extractDir, { recursive: true });
    await extractZip(tempFile, extractDir);

    // Find the binary in extracted directory
    const found = await findBinaryInDir(
      extractDir,
      extractBinaryName || binaryName,
    );
    if (found) {
      await rename(found, binaryPath);
    } else {
      throw new Error(
        `Could not find ${extractBinaryName || binaryName} in extracted archive`,
      );
    }

    await rm(extractDir, { recursive: true, force: true });
    await unlink(tempFile);
  } else {
    // Direct binary
    await rename(tempFile, binaryPath);
  }

  // Set executable permission on non-Windows
  if (!platformKey.startsWith("win32")) {
    try {
      chmodSync(binaryPath, 0o755);
    } catch {
      // Ignore permission errors on Windows host
    }
  }

  console.log(`  ✓ ${toolName} ready for ${platformKey}`);
}

async function findBinaryInDir(
  dir: string,
  name: string,
): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name === name) {
      return path.join(entry.parentPath || dir, entry.name);
    }
  }
  return null;
}

// ============================================================
// Main
// ============================================================

async function main() {
  const isAll = process.argv.includes("--all");
  const platformIdx = process.argv.indexOf("--platform");
  const explicitPlatform =
    platformIdx !== -1 ? process.argv[platformIdx + 1] : undefined;

  let platforms: string[];
  if (isAll) {
    platforms = getAllPlatformKeys();
  } else if (explicitPlatform) {
    platforms = [explicitPlatform];
  } else {
    platforms = [getCurrentPlatformKey()];
  }

  console.log(
    `Downloading third-party tools for ${isAll ? "all platforms" : platforms[0]}...`,
  );

  const tools = depsVersions as Record<string, ToolDef>;

  for (const platformKey of platforms) {
    console.log(`\n📦 Platform: ${platformKey}`);
    for (const [toolName, tool] of Object.entries(tools)) {
      try {
        await downloadTool(toolName, tool, platformKey);
      } catch (err) {
        console.error(
          `  ✗ Failed to download ${toolName} for ${platformKey}: ${err}`,
        );
      }
    }
  }

  console.log("\n✅ Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
