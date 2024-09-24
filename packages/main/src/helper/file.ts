import fs from "fs/promises";

export function fileExists(path: string): Promise<boolean> {
  return fs
    .access(path, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}
