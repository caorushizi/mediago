import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import dotenv from "dotenv";
import { resolve } from "path";
import consola from "consola";
import fs from "fs-extra";
import electron from "electron";

const baseResolve = (...r: any[]) => resolve(__dirname, ...r);
export const mainResolve = (...r: string[]) => baseResolve("..", ...r);
export const rootResolve = (...r: string[]) => baseResolve("../../..", ...r);

export const isDev = process.env.NODE_ENV === "development";

export const isLinux = process.platform === "linux";
export const isMac = process.platform === "darwin";
export const isWin = process.platform === "win32";

export class ElectronApp {
  process: ChildProcessWithoutNullStreams | null = null;

  start() {
    const args = ["--inspect=5858", mainResolve("app/build/main/index.js")];

    this.process = spawn(String(electron), args);

    this.process.stdout.on("data", (data) => {
      consola.log(String(data));
    });

    this.process.stderr.on("data", (data) => {
      consola.log(String(data));
    });
  }

  restart() {
    this.kill();
    this.start();
  }

  kill() {
    if (this.process && this.process.pid) {
      if (isMac) {
        spawn("kill", ["-9", String(this.process.pid)]);
      } else {
        process.kill(this.process.pid);
      }
      this.process = null;
    }
  }
}

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
      if (!cur.startsWith("APP_")) return prev;
      prev[`process.env.${[cur]}`] = JSON.stringify(this.env[cur]);
      return prev;
    }, {});
  }

  get isDev() {
    return this.nodeEnv === "development";
  }
}
