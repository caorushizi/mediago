import { session } from "electron";
import path from "path";

export default function createSession(partition: string): Electron.Session {
  const ses = session.fromPartition(partition);

  ses.protocol.registerFileProtocol("webview", (request, callback) => {
    const url = request.url.substr(10);
    callback({ path: path.normalize(`${__dirname}/${url}`) });
  });

  return ses;
}
