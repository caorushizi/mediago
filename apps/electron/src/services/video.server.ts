import path from "node:path";
import { provide } from "@inversifyjs/binding-decorators";
import { ServiceRunner } from "@mediago/service-runner";
import { injectable } from "inversify";
import { resolvePlayerBinary } from "../utils/binaryResolver";

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
    const { playerBin } = resolvePlayerBinary();

    const fs = await import("node:fs");
    if (!fs.existsSync(playerBin)) {
      console.warn(
        `[VideoServer] Player binary not found: ${playerBin}. Run "pnpm player:build" first.`,
      );
      return;
    }

    this.runner = new ServiceRunner({
      executableDir: path.dirname(playerBin),
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
        internal: !enable,
      });
    }
  }

  getURL() {
    return this.url;
  }
}
