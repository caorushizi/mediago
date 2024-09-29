import { Env, isDev, mainResolve } from "./utils";
import esbuild from "esbuild";

export function buildOptions(): esbuild.BuildOptions {
  const getDefine = (): Record<string, string> => {
    if (isDev) {
      return {
        __bin__: `"${mainResolve("bin").replace(/\\/g, "\\\\")}"`,
      };
    }

    return {
      ...Env.getInstance().loadDotEnvDefined(),
      "process.env.NODE_ENV": '"production"',
    };
  };

  return {
    entryPoints: [mainResolve("src/index.ts")],
    bundle: true,
    sourcemap: process.env.NODE_ENV === "development",
    define: getDefine(),
    outdir: mainResolve("dist"),
    loader: { ".png": "file" },
    minify: process.env.NODE_ENV === "production",
    packages: "external",
    format: "esm",
    target: ["node20"],
    platform: "node",
  };
}
