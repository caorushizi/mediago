import { existsSync, cpSync, rmSync } from "fs";
import dotenv from "dotenv";
import { resolve } from "path";
import consola from "consola";
import fs from "fs-extra";

export const mainResolve = (...r: string[]) => resolve(__dirname, "..", ...r);
export const rootResolve = (...r: string[]) =>
  resolve(__dirname, "../../..", ...r);
const nodeEnv = process.env.NODE_ENV;
consola.log("当前的环境是： ", nodeEnv);

function loadEnv(path: string) {
  const result: Record<string, string> = {};

  if (!existsSync(path)) {
    return null;
  }

  const parsed = dotenv.parse(fs.readFileSync(path));
  if (!parsed) {
    return null;
  }

  Object.keys(parsed).forEach((key) => {
    result[key] = parsed[key];
  });

  return result;
}

function loadDotEnv() {
  const env = loadEnv(rootResolve(".env"));
  const envMode = loadEnv(rootResolve(`.env.${nodeEnv}`));
  const envModeLocal = loadEnv(rootResolve(`.env.${nodeEnv}.local`));

  return { ...env, ...envMode, ...envModeLocal };
}

export function loadDotEnvRuntime() {
  const env = loadDotEnv();

  Object.keys(env).forEach((key) => {
    if (process.env[key] != null || !env[key]) return;
    process.env[key] = env[key];
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
