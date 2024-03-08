import { inject, injectable } from "inversify";
import { execa } from "execa";
import { mobilePath, videoServerBin } from "../helper";
import { TYPES } from "../types";
import ElectronStore from "../vendor/ElectronStore";

@injectable()
export default class VideoService {
  constructor(
    @inject(TYPES.ElectronStore)
    private readonly store: ElectronStore,
  ) {}

  init(): void {
    const local = this.store.get("local");
    const child = execa(
      videoServerBin,
      [
        "--static-path",
        mobilePath,
        "--video-path",
        local,
        "--port",
        process.env.APP_SERVER_PORT || "",
      ],
      {
        env: {
          GIN_MODE: "release",
        },
      },
    );

    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
  }
}
