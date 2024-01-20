import { inject, injectable } from "inversify";
import { execa } from "execa";
import { mobilePath, videoServerBin } from "../helper";
import { TYPES } from "../types";
import StoreService from "./StoreService";

@injectable()
export default class VideoService {
  constructor(
    @inject(TYPES.StoreService)
    private readonly storeService: StoreService,
  ) {}

  init(): void {
    const local = this.storeService.get("local");
    // empty
    const child = execa(videoServerBin, [
      "--static-path",
      mobilePath,
      "--video-path",
      local,
      "--port",
      process.env.APP_SERVER_PORT || "",
    ]);

    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
  }
}
