import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * This script installs all platform-specific binaries for @mediago packages
 * to support cross-platform builds in Electron.
 *
 * Problem: When building on Windows x64, only win32-x64 binaries are installed.
 * This causes the app to fail on Windows ARM64.
 *
 * Solution: Install all platform binaries before building, so the final
 * package can run on any platform/architecture.
 */

const packages = ["@mediago/core", "@mediago/player", "@mediago/deps"];
const versions = {
  "@mediago/core": "0.0.13",
  "@mediago/player": "0.0.10",
  "@mediago/deps": "0.0.4",
};

const platforms = [
  { platform: "win32", arch: "x64" },
  { platform: "win32", arch: "arm64" },
  { platform: "darwin", arch: "x64" },
  { platform: "darwin", arch: "arm64" },
  { platform: "linux", arch: "x64" },
  { platform: "linux", arch: "arm64" },
];

async function installAllBinaries() {
  console.log("📦 Installing all platform-specific binaries...\n");

  const appPackageJsonPath = path.resolve(process.cwd(), "app/package.json");
  const appPackageJson = JSON.parse(fs.readFileSync(appPackageJsonPath, "utf-8"));

  // Ensure dependencies object exists
  if (!appPackageJson.dependencies) {
    appPackageJson.dependencies = {};
  }

  let packagesAdded = 0;

  for (const pkg of packages) {
    const basePackageName = pkg.replace("@mediago/", "");
    const version = versions[pkg];

    console.log(`\n📦 Processing ${pkg}@${version}...`);

    for (const { platform, arch } of platforms) {
      const platformPackageName = `@mediago/${basePackageName}-${platform}-${arch}`;

      // Add to app/package.json dependencies if not already there
      if (!appPackageJson.dependencies[platformPackageName]) {
        appPackageJson.dependencies[platformPackageName] = version;
        packagesAdded++;
        console.log(`  ✓ Added ${platformPackageName}@${version}`);
      } else {
        console.log(`  - ${platformPackageName} already exists`);
      }
    }
  }

  if (packagesAdded > 0) {
    // Write updated package.json
    fs.writeFileSync(
      appPackageJsonPath,
      JSON.stringify(appPackageJson, null, 2) + "\n"
    );
    console.log(`\n✅ Added ${packagesAdded} platform-specific packages to app/package.json`);

    // Install dependencies
    console.log("\n📦 Installing dependencies...");
    try {
      execSync("pnpm install", {
        cwd: path.resolve(process.cwd(), "app"),
        stdio: "inherit",
      });
      console.log("✅ All dependencies installed successfully!");
    } catch (error) {
      console.error("❌ Failed to install dependencies:", error);
      process.exit(1);
    }
  } else {
    console.log("\n✅ All platform-specific packages already installed");
  }
}

installAllBinaries().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
