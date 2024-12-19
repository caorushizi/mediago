import { app, protocol } from "electron";
import isDev from "electron-is-dev";
import { pathExists, readFile } from "fs-extra";
import { injectable } from "inversify";
import path, { join } from "path";
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
        // If the file is not found, return index.html directly, react history mode
        filePath = join(__dirname, "../renderer/index.html");
      }
      const mimeType = mime.lookup(filePath);
      const data = await readFile(filePath);
      return new Response(data, {
        headers: { "Content-Type": mimeType || "text/html" },
      });
    });

    if (process.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(defaultScheme, process.execPath, [
          path.resolve(process.argv[1]),
        ]);
      }
    } else {
      app.setAsDefaultProtocolClient(defaultScheme);
    }
  }
}
