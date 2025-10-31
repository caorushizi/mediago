import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { ServiceRunner } from "@mediago/service-runner";
import { injectable } from "inversify";
import { loadModule } from "../utils";

@injectable()
@provide()
export class VideoServer {
  private runner?: ServiceRunner;
  private url?: string;

  async start({
    local,
    enableMobilePlayer,
  }: {
    local: string;
    enableMobilePlayer?: boolean;
  }) {
    const binaryUrl = loadModule("@mediago/player");

    this.runner = new ServiceRunner({
      executableDir: path.resolve(path.dirname(binaryUrl), "bin"),
      executableName: "mediago-player",
      preferredPort: 9800,
      internal: !enableMobilePlayer,
      extraArgs: ["-video-root", local],
    });

    await this.runner.start();

    this.url = this.runner.getURL();
  }

  enableMobilePlayer(enable: boolean) {
    if (this.runner) {
      this.runner.restart({
        internal: enable,
      });
    }
  }

  getURL() {
    return this.url;
  }
}
