import type esbuild from "esbuild";
import nodeExternalsPlugin from "esbuild-node-externals";
import { Env, isDev, mainResolve } from "./utils";

export function buildOptions(): esbuild.BuildOptions {
  const getDefine = (): Record<string, string> => {
    const vars: Record<string, string> = {
      "process.env.NODE_ENV": isDev ? '"development"' : '"production"',
    };
    if (isDev) {
      vars.__bin__ = `"${mainResolve("bin").replace(/\\/g, "\\\\")}"`;
      Object.assign(vars, Env.getInstance().loadDotEnvDefined());
    }

    return vars;
  };

  return {
    entryPoints: [mainResolve("src/index.ts")],
    bundle: true,
    sourcemap: process.env.NODE_ENV === "development",
    define: getDefine(),
    outdir: mainResolve("dist"),
    loader: { ".png": "file" },
    minify: process.env.NODE_ENV === "production",
    // packages: "external",
    format: "esm",
    target: ["node16"],
    platform: "node",
    plugins: [
      nodeExternalsPlugin({
        allowList: ["@mediago/shared-common", "@mediago/shared-node"],
      }),
    ],
  };
}
