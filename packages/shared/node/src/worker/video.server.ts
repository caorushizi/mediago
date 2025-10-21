import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { ServiceRunner } from "@mediago/service-runner";
import { injectable } from "inversify";

@injectable()
@provide()
export class VideoServer {


  async start({ local }: { local: string }) {
    const binaryUrl = require.resolve("@mediago/player");

    console.log('path.resolve(path.dirname(binaryUrl), "bin")', path.resolve(path.dirname(binaryUrl), "bin"))

    const runner = new ServiceRunner({
      executableDir: path.resolve(path.dirname(binaryUrl), "bin"),
      executableName: "mediago-player",
      preferredPort: 9800,
      internal: true,
      extraArgs: ["-video-root", local],
    });

    await runner.start();

    console.log("Video server started successfully.", runner.getURL());
  }
}
