import { readFileSync } from "node:fs";
import { build } from "esbuild";

interface PackageJson {
  version: string;
  [key: string]: any;
}

async function buildPreload(): Promise<void> {
  const pkg: PackageJson = JSON.parse(readFileSync("package.json", "utf8"));

  try {
    await build({
      entryPoints: ["src/index.ts"],
      bundle: true,
      outfile: "dist/preload.js",
      platform: "node",
      target: "node18",
      format: "cjs",
      external: ["electron"],
      minify: process.env.NODE_ENV === "production",
      sourcemap: process.env.NODE_ENV !== "production",
      define: {
        __VERSION__: JSON.stringify(pkg.version),
      },
      logLevel: "info",
    });

    console.log("✅ Preload script built successfully");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

buildPreload();
