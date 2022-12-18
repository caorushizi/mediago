import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Controller, VideoRepository } from "../interfaces";
import { handle } from "../decorator/ipc";
import { Video } from "../entity";

@injectable()
export default class VideoControllerImpl implements Controller {
  constructor(
    @inject(TYPES.VideoRepository)
    private videoRepository: VideoRepository
  ) {}
  @handle("get-video-list")
  getVideoList(): Promise<Video[]> {
    return this.videoRepository.getVideoList();
  }
}
