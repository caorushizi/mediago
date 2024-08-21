import { Env, isDev, mainResolve } from "./utils";
import esbuild from "esbuild";

const external = [
  "electron",
  "nock",
  "aws-sdk",
  "mock-aws-s3",
  "@cliqz/adblocker-electron-preload",
  "node-pty",
];

function getConfig(): esbuild.BuildOptions {
  const getDefine = (): Record<string, string> => {
    if (isDev) {
      return {
        __bin__: `"${mainResolve("app/bin").replace(/\\/g, "\\\\")}"`,
      };
    }

    return {
      ...Env.getInstance().loadDotEnvDefined(),
      "process.env.NODE_ENV": '"production"',
    };
  };

  return {
    bundle: true,
    sourcemap: process.env.NODE_ENV === "development",
    external,
    define: getDefine(),
    outdir: mainResolve("dist"),
    loader: { ".png": "file" },
    minify: process.env.NODE_ENV === "production",
  };
}

function buildOptions(
  entry: string,
  platform: esbuild.Platform,
  target: string,
): esbuild.BuildOptions {
  return {
    ...getConfig(),
    entryPoints: [mainResolve(entry)],
    platform: platform,
    target: [target],
  };
}

export function browserOptions(entry: string): esbuild.BuildOptions {
  return buildOptions(entry, "browser", "chrome89");
}

export function nodeOptions(entry: string): esbuild.BuildOptions {
  return buildOptions(entry, "node", "node16.13");
}
