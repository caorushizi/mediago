import { existsSync } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import {
  ASSETS_UI_DIR,
  DIST_DIR,
  IS_WINDOWS,
  NPM_DIR,
  type PlatformTarget,
  PLATFORM_TARGETS,
  RELEASE_NPM_DIR,
  SERVER_BINARY_PATH,
  UI_DIR,
} from "./constants";
import {
  copyDirectory,
  ensureDir,
  pathExists,
  removeDirectoriesNamed,
  removeIfExists,
  runCommand,
} from "./utils";

// Documentation tasks
export async function docsTask() {
  await runCommand("swag", ["init", "-g", "cmd/server/main.go", "-o", "docs"]);
}

// Development tasks
export async function devServerTask() {
  await runCommand("go", [
    "run",
    "./cmd/server",
    "-enable-docs",
    "-video-root",
    "/mnt/c/Users/Microsoft/Desktop/mediago_download",
  ]);
}

export async function devUiTask() {
  await runCommand("pnpm", ["dev"]);
}

// Test tasks
export async function testTask() {
  await runCommand("go", ["test", "./..."]);
}

// Build tasks
export async function buildUiTask() {
  await runCommand("pnpm", ["build"], { cwd: UI_DIR });
  const distDir = path.join(UI_DIR, "dist");
  if (!existsSync(distDir)) {
    throw new Error("Expected UI build output at ui/dist but it was not found");
  }
  await copyDirectory(distDir, ASSETS_UI_DIR);
}

export async function buildServerTask() {
  await ensureDir(DIST_DIR);
  await runCommand("go", ["build", "-o", SERVER_BINARY_PATH, "./cmd/server"]);
}

// Run task
export async function runBinaryTask() {
  const absolutePath = path.resolve(SERVER_BINARY_PATH);
  if (!(await pathExists(absolutePath))) {
    throw new Error(
      `Server binary not found at ${absolutePath}. Run "pnpm gulp build" first.`,
    );
  }
  await runCommand(absolutePath);
}

// Release npm tasks
export async function releaseNpmCleanTask() {
  await removeIfExists(RELEASE_NPM_DIR);
  await removeDirectoriesNamed(NPM_DIR, "bin");
}

export async function releaseNpmBuildUiTask() {
  await docsTask();
  await buildUiTask();
}

export async function releaseNpmBuildBinary(target: PlatformTarget) {
  const outputDir = path.join(
    NPM_DIR,
    `@mediago/player-${target.platform}`,
    "bin",
  );
  await ensureDir(outputDir);
  const outputPath = path.join(outputDir, target.binaryName);
  console.log(`Building ${target.platform} binary → ${outputPath}`);
  await runCommand(
    "go",
    ["build", "-ldflags=-s -w", "-o", outputPath, "./cmd/server"],
    {
      env: {
        CGO_ENABLED: "0",
        GOOS: target.goos,
        GOARCH: target.goarch,
      },
    },
  );
}

export async function releaseNpmBuildBinaryFromEnv() {
  const { GOOS, GOARCH, PLATFORM } = process.env;
  if (!GOOS || !GOARCH || !PLATFORM) {
    throw new Error(
      "GOOS, GOARCH, and PLATFORM environment variables are required",
    );
  }

  const binaryName =
    GOOS === "windows" ? "mediago-player.exe" : "mediago-player";
  await releaseNpmBuildBinary({
    goos: GOOS,
    goarch: GOARCH,
    platform: PLATFORM,
    binaryName,
  });
}

export async function releaseNpmBuildBinariesTask() {
  await releaseNpmBuildUiTask();
  for (const target of PLATFORM_TARGETS) {
    await releaseNpmBuildBinary(target);
  }
}

export async function releaseNpmSetPermissionsTask() {
  if (IS_WINDOWS) {
    return;
  }

  for (const target of PLATFORM_TARGETS) {
    if (target.binaryName.endsWith(".exe")) {
      continue;
    }
    const binaryPath = path.join(
      NPM_DIR,
      `@mediago/player-${target.platform}`,
      "bin",
      target.binaryName,
    );
    await fsp.chmod(binaryPath, 0o755);
  }
}

interface PlatformPackageInfo {
  name: string;
  os: string[];
  cpu: string[];
  bin: string;
}

const TEMPLATES_DIR = path.join(__dirname, "templates");

async function renderTemplate(
  templatePath: string,
  variables: Record<string, string>,
): Promise<string> {
  const template = await fsp.readFile(templatePath, "utf-8");
  return Object.entries(variables).reduce(
    (content, [key, value]) => content.replaceAll(`{{${key}}}`, value),
    template,
  );
}

async function generatePlatformPackage(
  platform: PlatformPackageInfo,
  version: string,
): Promise<string> {
  const templatePath = path.join(TEMPLATES_DIR, "platform-package.json.tpl");
  return renderTemplate(templatePath, {
    PLATFORM_NAME: platform.name,
    VERSION: version,
    OS: platform.os[0],
    CPU: platform.cpu[0],
    BINARY_NAME: platform.bin,
  });
}

async function generateRootPackage(version: string): Promise<string> {
  const platforms: PlatformPackageInfo[] = [
    { name: "darwin-x64", os: ["darwin"], cpu: ["x64"], bin: "mediago-player" },
    {
      name: "darwin-arm64",
      os: ["darwin"],
      cpu: ["arm64"],
      bin: "mediago-player",
    },
    { name: "linux-x64", os: ["linux"], cpu: ["x64"], bin: "mediago-player" },
    {
      name: "linux-arm64",
      os: ["linux"],
      cpu: ["arm64"],
      bin: "mediago-player",
    },
    {
      name: "win32-x64",
      os: ["win32"],
      cpu: ["x64"],
      bin: "mediago-player.exe",
    },
    {
      name: "win32-arm64",
      os: ["win32"],
      cpu: ["arm64"],
      bin: "mediago-player.exe",
    },
  ];

  const optionalDependencies: Record<string, string> = {};
  for (const platform of platforms) {
    optionalDependencies[`@mediago/player-${platform.name}`] = version;
  }

  const templatePath = path.join(TEMPLATES_DIR, "root-package.json.tpl");
  return renderTemplate(templatePath, {
    VERSION: version,
    OPTIONAL_DEPENDENCIES: JSON.stringify(optionalDependencies, null, 2),
  });
}

async function writePackageJson(pkgPath: string, content: string) {
  await ensureDir(pkgPath);
  const pkgFile = path.join(pkgPath, "package.json");
  // Parse and re-stringify to ensure proper formatting
  const data = JSON.parse(content);
  await fsp.writeFile(pkgFile, JSON.stringify(data, null, 2) + "\n");
  console.log(`Generated ${pkgFile}`);
}

async function generateREADME(
  pkgPath: string,
  platform?: PlatformPackageInfo,
): Promise<void> {
  const readmePath = path.join(pkgPath, "README.md");

  let content: string;
  if (platform) {
    const templatePath = path.join(TEMPLATES_DIR, "platform-readme.md.tpl");
    content = await renderTemplate(templatePath, {
      PLATFORM_NAME: platform.name,
      OS: platform.os[0],
      CPU: platform.cpu[0],
    });
  } else {
    const templatePath = path.join(TEMPLATES_DIR, "root-readme.md.tpl");
    content = await fsp.readFile(templatePath, "utf-8");
  }

  await fsp.writeFile(readmePath, content);
  console.log(`Generated ${readmePath}`);
}

async function generateGitignore(pkgPath: string): Promise<void> {
  const gitignorePath = path.join(pkgPath, ".gitignore");
  const content =
    "# Ignore bin directories containing compiled binaries\nbin/\n";
  await fsp.writeFile(gitignorePath, content);
  console.log(`Generated ${gitignorePath}`);
}

async function generateInstallScript(pkgPath: string): Promise<void> {
  const templatePath = path.join(TEMPLATES_DIR, "root-install.js.tpl");
  const content = await fsp.readFile(templatePath, "utf-8");
  const installPath = path.join(pkgPath, "install.js");
  await fsp.writeFile(installPath, content);
  // Make executable on Unix
  if (!IS_WINDOWS) {
    await fsp.chmod(installPath, 0o755);
  }
  console.log(`Generated ${installPath}`);
}

async function releaseNpmGeneratePackages(version: string) {
  console.log(`Generating npm packages for version ${version}...`);

  const platforms: PlatformPackageInfo[] = [
    { name: "darwin-x64", os: ["darwin"], cpu: ["x64"], bin: "mediago-player" },
    {
      name: "darwin-arm64",
      os: ["darwin"],
      cpu: ["arm64"],
      bin: "mediago-player",
    },
    { name: "linux-x64", os: ["linux"], cpu: ["x64"], bin: "mediago-player" },
    {
      name: "linux-arm64",
      os: ["linux"],
      cpu: ["arm64"],
      bin: "mediago-player",
    },
    {
      name: "win32-x64",
      os: ["win32"],
      cpu: ["x64"],
      bin: "mediago-player.exe",
    },
    {
      name: "win32-arm64",
      os: ["win32"],
      cpu: ["arm64"],
      bin: "mediago-player.exe",
    },
  ];

  // Generate root package
  const rootPkgPath = path.join(NPM_DIR, "@mediago", "player");
  await writePackageJson(rootPkgPath, await generateRootPackage(version));
  await generateREADME(rootPkgPath);
  await generateGitignore(rootPkgPath);
  await generateInstallScript(rootPkgPath);

  // Generate platform packages
  for (const platform of platforms) {
    const platformPkgPath = path.join(
      NPM_DIR,
      "@mediago",
      `player-${platform.name}`,
    );
    await writePackageJson(
      platformPkgPath,
      await generatePlatformPackage(platform, version),
    );
    await generateREADME(platformPkgPath, platform);
    await generateGitignore(platformPkgPath);
  }

  console.log(
    `Successfully generated all package files for version ${version}`,
  );
}

export async function releaseNpmAssemblePackagesTask() {
  const version = process.env.VERSION ?? "0.0.0";
  await releaseNpmBuildBinariesTask();
  await releaseNpmGeneratePackages(version);
  await releaseNpmSetPermissionsTask();
  console.log(`Assembled npm packages for version ${version}`);
}

export async function releaseNpmVerifyPublishTask() {
  if (process.env.PUBLISH !== "true") {
    throw new Error("Set PUBLISH=true to publish to npm");
  }
  if (!process.env.VERSION) {
    throw new Error("VERSION must be set (e.g., VERSION=1.2.3)");
  }
}

export async function releaseNpmPublishTask() {
  const version = process.env.VERSION as string;
  const packages = [
    ...PLATFORM_TARGETS.map((target) => `@mediago/player-${target.platform}`),
    "@mediago/player",
  ];

  for (const pkg of packages) {
    const packageDir = path.join(NPM_DIR, pkg);
    console.log(`Publishing ${pkg} (version ${version})`);
    await runCommand("npm", ["publish", "--access", "public"], {
      cwd: packageDir,
    });
  }

  console.log(`Published version ${version} to npm`);
}

export async function releaseNpmTask() {
  const publish = process.env.PUBLISH === "true";
  const version = process.env.VERSION ?? "0.0.0";

  await releaseNpmCleanTask();
  await releaseNpmAssemblePackagesTask();

  if (publish) {
    await releaseNpmVerifyPublishTask();
    await releaseNpmPublishTask();
  } else {
    console.log(
      `Dry run completed for version ${version}. Set PUBLISH=true to publish to npm.`,
    );
  }
}

// Simplified npm tasks for gulpfile
export async function npmAssembleTask() {
  const version = process.env.VERSION ?? "0.0.0";
  console.log(`Assembling npm packages for version ${version}...`);
  // Clean npm bin directories to remove old binaries
  await removeDirectoriesNamed(NPM_DIR, "bin");
  await releaseNpmAssemblePackagesTask();
  console.log(`\nNPM packages assembled successfully!`);
  console.log(
    `To publish, run: VERSION=${version} PUBLISH=true pnpm run gulp npm:publish`,
  );
}

export async function npmPublishTask() {
  const version = process.env.VERSION;
  const publish = process.env.PUBLISH;

  if (!version) {
    throw new Error(
      "VERSION environment variable is required (e.g., VERSION=1.2.3)",
    );
  }

  if (publish !== "true") {
    throw new Error("PUBLISH=true is required to publish to npm registry");
  }

  console.log(`Publishing npm packages for version ${version}...`);
  await releaseNpmVerifyPublishTask();
  await releaseNpmPublishTask();
  console.log(`\nSuccessfully published version ${version} to npm!`);
}
