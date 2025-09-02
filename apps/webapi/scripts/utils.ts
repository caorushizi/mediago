import dotenv from "dotenv";
import { resolve } from "path";
import fs from "fs-extra";

const baseResolve = (...r: any[]) => resolve(__dirname, ...r);
export const mainResolve = (...r: string[]) => baseResolve("..", ...r);
export const rootResolve = (...r: string[]) => baseResolve("../../..", ...r);

export const isDev = process.env.NODE_ENV === "development";

export const isLinux = process.platform === "linux";
export const isMac = process.platform === "darwin";
export const isWin = process.platform === "win32";

export class Env {
  env: Record<string, string> = {};
  nodeEnv = "";
  static instance: Env;

  private constructor(nodeEnv = process.env.NODE_ENV) {
    const env = this.parseEnv(rootResolve(".env"));
    const modeEnv = this.parseEnv(rootResolve(`.env.${nodeEnv}`));
    const localEnv = this.parseEnv(rootResolve(`.env.${nodeEnv}.local`));

    this.nodeEnv = nodeEnv || "development";
    this.env = { ...env, ...modeEnv, ...localEnv };
  }

  static getInstance() {
    if (!Env.instance) {
      Env.instance = new Env();
    }

    return Env.instance;
  }

  private parseEnv(path: string) {
    if (!fs.existsSync(path)) {
      return null;
    }

    const parsed = dotenv.parse(fs.readFileSync(path));
    if (!parsed) {
      return null;
    }

    return Object.keys(parsed).reduce((prev: any, curr) => {
      prev[curr] = parsed[curr];
      return prev;
    }, {});
  }

  loadDotEnvRuntime() {
    Object.keys(this.env).forEach((key) => {
      if (process.env[key] != null || !this.env[key]) return;
      process.env[key] = this.env[key];
    });
  }

  loadDotEnvDefined() {
    return Object.keys(this.env).reduce<Record<string, string>>((prev, cur) => {
      prev[`process.env.${[cur]}`] = JSON.stringify(this.env[cur]);
      return prev;
    }, {});
  }

  get isDev() {
    return this.nodeEnv === "development";
  }
}
