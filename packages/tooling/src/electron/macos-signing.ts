/* eslint-disable no-await-in-loop -- Validate each artifact before detaching its mount or deleting extracted files. */
import { spawnSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { withAppleNetworkRetry } from "./macos-network-retry.ts";

export const MACOS_SIGNING_ENVIRONMENT_VARIABLES = [
  "CSC_LINK",
  "CSC_KEY_PASSWORD",
  "APPLE_ID",
  "APPLE_APP_SPECIFIC_PASSWORD",
  "APPLE_TEAM_ID",
] as const;

export interface MacOSSigningSettings {
  enabled: boolean;
  forceCodeSigning: boolean;
  hardenedRuntime: boolean;
  notarize: boolean;
  signDmg: boolean;
}

export function resolveMacOSSigningSettings(options: {
  platform: NodeJS.Platform;
  isDir: boolean;
  environment?: Readonly<NodeJS.ProcessEnv>;
}): MacOSSigningSettings {
  const enabled = options.platform === "darwin" && !options.isDir;
  if (enabled) {
    assertMacOSSigningEnvironment(options.environment ?? process.env);
  }

  return {
    enabled,
    forceCodeSigning: enabled,
    hardenedRuntime: enabled,
    notarize: enabled,
    signDmg: enabled,
  };
}

export function assertMacOSSigningEnvironment(
  environment: Readonly<NodeJS.ProcessEnv>,
): void {
  const missing = MACOS_SIGNING_ENVIRONMENT_VARIABLES.filter(
    (name) => !environment[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(`macOS distribution requires: ${missing.join(", ")}`);
  }
}

export function hasHardenedRuntimeFlag(signature: string): boolean {
  return /(?:^|\s)flags=[^\r\n]*\bruntime\b/m.test(signature);
}

export async function verifyMacOSDistributionArtifacts(options: {
  releaseDirectory: string;
  artifacts: readonly string[];
  platform?: NodeJS.Platform;
}): Promise<void> {
  const platform = options.platform ?? process.platform;
  if (platform !== "darwin") {
    throw new Error("macOS distribution verification requires macOS");
  }

  const releaseDirectory = path.resolve(options.releaseDirectory);
  const appBundles = findAppBundles(releaseDirectory);
  const dmgFiles = options.artifacts.filter(
    (artifact) => path.extname(artifact).toLowerCase() === ".dmg",
  );
  const zipFiles = options.artifacts.filter(
    (artifact) => path.extname(artifact).toLowerCase() === ".zip",
  );

  requireArtifacts("built app bundle", appBundles);
  requireArtifacts("DMG", dmgFiles);
  requireArtifacts("ZIP", zipFiles);

  for (const appBundle of appBundles) {
    await verifyAppBundle(appBundle, true);
  }
  for (const dmgFile of dmgFiles) {
    await verifyDmg(dmgFile);
  }
  for (const zipFile of zipFiles) {
    await verifyZip(zipFile);
  }
}

function requireArtifacts(label: string, files: readonly string[]): void {
  if (files.length === 0) {
    throw new Error(`macOS distribution did not produce a ${label}`);
  }
}

async function verifyAppBundle(
  appBundle: string,
  verifyBundledTools: boolean,
): Promise<void> {
  runTool("codesign", [
    "--verify",
    "--deep",
    "--strict",
    "--verbose=2",
    appBundle,
  ]);

  const signature = runTool("codesign", [
    "--display",
    "--verbose=4",
    appBundle,
  ]);
  if (!/^Authority=Developer ID Application:/m.test(signature)) {
    throw new Error(`${appBundle} is not signed with Developer ID Application`);
  }
  const teamIdentifier = /^TeamIdentifier=(.+)$/m.exec(signature)?.[1]?.trim();
  if (!teamIdentifier || teamIdentifier === "not set") {
    throw new Error(`${appBundle} does not contain a Team Identifier`);
  }
  if (!hasHardenedRuntimeFlag(signature)) {
    throw new Error(`${appBundle} does not enable Hardened Runtime`);
  }

  await withAppleNetworkRetry(
    () => runTool("xcrun", ["stapler", "validate", appBundle]),
    { label: "stapler validate" },
  );
  runTool("spctl", ["--assess", "--type", "execute", "--verbose=4", appBundle]);

  if (verifyBundledTools) {
    verifyBundledMachOFiles(appBundle);
  }
  process.stdout.write(
    `[macos-signing] verified ${appBundle} (${teamIdentifier})\n`,
  );
}

function verifyBundledMachOFiles(appBundle: string): void {
  const resourcesDirectory = path.join(appBundle, "Contents", "Resources");
  const roots = ["bin", "deps"].map((name) =>
    path.join(resourcesDirectory, name),
  );
  let verified = 0;

  for (const root of roots) {
    if (!isDirectory(root)) continue;
    for (const file of findRegularFiles(root)) {
      const description = runTool("file", ["-b", file]);
      if (!description.includes("Mach-O")) continue;
      runTool("codesign", ["--verify", "--strict", "--verbose=2", file]);
      verified += 1;
    }
  }

  if (verified === 0) {
    throw new Error(
      `${appBundle} does not contain signed bundled Mach-O tools`,
    );
  }
}

async function verifyDmg(dmgFile: string): Promise<void> {
  runTool("codesign", ["--verify", "--verbose=2", dmgFile]);

  const temporaryDirectory = mkdtempSync(
    path.join(tmpdir(), "mediago-dmg-verification-"),
  );
  const mountPoint = path.join(temporaryDirectory, "mounted");
  mkdirSync(mountPoint);
  let mounted = false;
  try {
    runTool("hdiutil", [
      "attach",
      "-nobrowse",
      "-readonly",
      "-mountpoint",
      mountPoint,
      dmgFile,
    ]);
    mounted = true;
    const appBundles = findAppBundles(mountPoint);
    requireArtifacts("app bundle inside the DMG", appBundles);
    for (const appBundle of appBundles) {
      await verifyAppBundle(appBundle, false);
    }
  } finally {
    if (mounted) runTool("hdiutil", ["detach", mountPoint]);
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

async function verifyZip(zipFile: string): Promise<void> {
  const temporaryDirectory = mkdtempSync(
    path.join(tmpdir(), "mediago-zip-verification-"),
  );
  try {
    runTool("ditto", ["-x", "-k", zipFile, temporaryDirectory]);
    const appBundles = findAppBundles(temporaryDirectory);
    requireArtifacts("app bundle inside the ZIP", appBundles);
    for (const appBundle of appBundles) {
      await verifyAppBundle(appBundle, false);
    }
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function findAppBundles(root: string): string[] {
  const bundles: string[] = [];
  visitDirectories(root, (directory) => {
    if (directory.endsWith(".app")) {
      bundles.push(directory);
      return false;
    }
    return true;
  });
  return bundles;
}

function visitDirectories(
  root: string,
  visitor: (directory: string) => boolean,
): void {
  if (!isDirectory(root)) return;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = path.join(root, entry.name);
    if (visitor(directory)) visitDirectories(directory, visitor);
  }
}

function findRegularFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...findRegularFiles(file));
    else if (entry.isFile()) files.push(file);
  }
  return files;
}

function isDirectory(target: string): boolean {
  try {
    return lstatSync(target).isDirectory();
  } catch {
    return false;
  }
}

function runTool(command: string, args: readonly string[]): string {
  const result = spawnSync(command, [...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: command === "xcrun" && args[0] === "stapler" ? 120_000 : undefined,
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (result.error) {
    throw new Error(
      command +
        " " +
        args.slice(0, 2).join(" ") +
        " failed: " +
        result.error.message,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${String(result.status)}: ${output.trim()}`,
    );
  }
  return output;
}
