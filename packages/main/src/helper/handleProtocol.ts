import { protocol } from "electron";
import { defaultScheme } from "../utils/variables";
import { URL } from "url";
import { readFile, pathExists } from "fs-extra";
import { extname, join } from "path";
import isDev from "electron-is-dev";

export default function handleProtocol() {
  if (isDev) return;

  protocol.registerBufferProtocol(defaultScheme, async (request, callback) => {
    let pathName = new URL(request.url).pathname;
    pathName = decodeURI(pathName);

    const filePath = join(__dirname, "../renderer", pathName);
    const fileExist = await pathExists(filePath);

    if (fileExist) {
      const data = await readFile(filePath);
      const extension = extname(pathName).toLowerCase();
      let mimeType = "";

      if (extension === ".js") {
        mimeType = "text/javascript";
      } else if (extension === ".html") {
        mimeType = "text/html";
      } else if (extension === ".css") {
        mimeType = "text/css";
      } else if (extension === ".svg" || extension === ".svgz") {
        mimeType = "image/svg+xml";
      } else if (extension === ".json") {
        mimeType = "application/json";
      }

      callback({ mimeType, data });
    } else {
      // 如果没有找到文件，直接返回 index.html ， react history 模式
      const filePath = join(__dirname, "../renderer/index.html");
      const data = await readFile(filePath);
      callback({ mimeType: "text/html", data });
    }
  });
}
