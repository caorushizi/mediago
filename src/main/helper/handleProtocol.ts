import { protocol } from "electron";
import { defaultScheme } from "main/utils/variables";
import { URL } from "url";
import { readFile, readFileSync } from "fs";
import { extname, join } from "path";

export default function handleProtocol() {
  protocol.registerBufferProtocol(defaultScheme, (request, callback) => {
    let pathName = new URL(request.url).pathname;
    pathName = decodeURI(pathName);

    readFile(join(__dirname, "../renderer", pathName), (error, data) => {
      if (error) {
        console.error(
          `Failed to register ${defaultScheme} protocol\n`,
          error,
          "\n"
        );
        const data = readFileSync(join(__dirname, "../renderer/index.html"));
        callback({ mimeType: "text/html", data });
      } else {
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
      }
    });
  });
}
