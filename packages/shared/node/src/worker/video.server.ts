import { provide } from "@inversifyjs/binding-decorators";
import { injectable } from "inversify";
import { findFreePort, getLocalIP, ServiceRunner } from "../utils";

@injectable()
@provide()
export class VideoServer {
  private host: string;
  private port: number;
  private runner: ServiceRunner;

  async start({ local }: { local: string }) {
    this.port = await findFreePort({ startPort: 8888 });
    this.host = await getLocalIP();

    this.runner = new ServiceRunner({
      binName: "mediago-player",
      devDir: "F:\\Workspace\\Projects\\MediaGo\\mediago-player\\dist",
      extraArgs: ["-video-root", local, "-port", this.port.toString()],
      host: this.host,
      port: this.port,
    });

    this.runner.start();
  }
}
