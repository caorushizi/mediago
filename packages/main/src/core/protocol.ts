import { protocol } from "electron";
import isDev from "electron-is-dev";
import { pathExists, readFile } from "fs-extra";
import { injectable } from "inversify";
import { join } from "path";
import { URL } from "url";
import { defaultScheme } from "../helper/index.ts";
import mime from "mime-types";

@injectable()
export default class ProtocolService {
  create(): void {
    if (isDev) return;

    protocol.handle(defaultScheme, async (req) => {
      const pathName = new URL(req.url).pathname;
      let filePath = join(__dirname, "../renderer", pathName);
      const fileExist = await pathExists(filePath);
      if (!fileExist) {
        // 如果没有找到文件，直接返回 index.html ， react history 模式
        filePath = join(__dirname, "../renderer/index.html");
      }
      const mimeType = mime.lookup(filePath);
      const data = await readFile(filePath);
      return new Response(data, {
        headers: { "Content-Type": mimeType || "text/html" },
      });
    });
  }
}
