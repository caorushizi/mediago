import { existsSync, cpSync, rmSync } from "node:fs";
import dotenv from "dotenv";
import { resolve } from "node:path";

// FIXME: 有没有什么办法可以不用这么写？
const con = console;
export const log = con.log;

export const mainResolve = (...r: any[]) => resolve(__dirname, "..", ...r);
export const rootResolve = (...r: any[]) =>
  resolve(__dirname, "../../..", ...r);
const nodeEnv = process.env.NODE_ENV;
log("当前的环境是： ", nodeEnv);

function loadEnv(path: string) {
  const result: Record<string, string> = {};

  const _loadEnv = (path: string) => {
    if (!existsSync(path)) {
      return null;
    }

    const { error, parsed } = dotenv.config({ path });
    if (error != null || !parsed) {
      return null;
    }

    Object.keys(parsed).forEach((key) => {
      result[key] = parsed[key];
    });
  };

  _loadEnv(path);
  _loadEnv(`${path}.local`);

  return result;
}

function loadDotEnv() {
  const env = loadEnv(rootResolve(".env"));
  const envMode = loadEnv(rootResolve(`.env.${nodeEnv}`));

  return { ...env, ...envMode };
}

export function loadDotEnvRuntime() {
  const env = loadDotEnv();

  Object.keys(env).forEach((key) => {
    if (!process.env[key]) {
      process.env[key] = env[key];
    }
  });
}

export function loadDotEnvDefined() {
  const env = loadDotEnv();

  return Object.keys(env).reduce<Record<string, string>>((prev, cur) => {
    if (!cur.startsWith("APP_")) return prev;
    prev[`process.env.${[cur]}`] = JSON.stringify(env[cur]);
    return prev;
  }, {});
}

export function copyResource(resource: { from: string; to: string }[]) {
  resource.forEach((r) => {
    const { from, to } = r;
    cpSync(from, to, {
      recursive: true,
    });
  });
}

export function removeResource(resource: string[]) {
  resource.forEach((r) => {
    rmSync(r, { recursive: true, force: true });
  });
}
