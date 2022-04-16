import fs from "fs";
import axios from "axios";
import { Agent } from "https";
import { move, pathExists } from "fs-extra";

export async function downloader(url: string, output: string): Promise<void> {
  const exist = await pathExists(output);
  if (exist) {
    return;
  }

  const tmpFile = `${output}.tmp`;

  const writer = fs.createWriteStream(tmpFile);
  const resp = await axios.get(url, {
    httpsAgent: new Agent({
      rejectUnauthorized: false,
    }),
    responseType: "stream",
  });

  resp.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", async () => {
      await move(tmpFile, output);
      resolve();
    });
    writer.on("error", reject);
  });
}
