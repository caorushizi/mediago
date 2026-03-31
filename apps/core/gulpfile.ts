import { dev, devBuild } from './scripts/dev';
import {
  buildCorePackages,
  buildDepsPackages,
  publishCorePackages,
  publishDepsPackages,
} from './scripts/npm';

// ============================================================
// 开发任务 (Development Tasks)
// ============================================================

export { dev, devBuild };
export const build = devBuild;

// ============================================================
// NPM 任务 (NPM Tasks)
// ============================================================

export const buildCore = buildCorePackages;
export const buildDeps = buildDepsPackages;
export const publishCore = publishCorePackages;
export const publishDeps = publishDepsPackages;

