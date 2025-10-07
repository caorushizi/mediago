import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import dotenvFlow from "dotenv-flow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../..");
const appRoot = path.resolve(__dirname, "..");

dotenvFlow.config({
  path: projectRoot,
});

const webTask: Array<{ src: string; dest: string }> = [
  {
    src: "apps/server/build",
    dest: ".mediago-server/backend",
  },
  {
    src: "apps/ui/build/server",
    dest: ".mediago-server/frontend",
  },
];

for (const task of webTask) {
  await fs.cp(path.resolve(projectRoot, task.src), path.resolve(appRoot, task.dest), {
    recursive: true,
    force: true,
  });
}
