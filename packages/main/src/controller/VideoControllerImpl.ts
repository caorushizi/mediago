import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Controller, VideoRepository } from "../interfaces";
import { handle } from "../decorator/ipc";
import { Video } from "../entity";
import { IpcMainInvokeEvent } from "electron";

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
  @handle("add-video")
  addVideo(event: IpcMainInvokeEvent, video: Video): Promise<Video> {
    return this.videoRepository.insertVideo(video);
  }

  @handle("update-video")
  updateVideo(event: IpcMainInvokeEvent, id: number, video: Partial<Video>) {
    return this.videoRepository.updateVideo(id, video);
  }

  @handle("remove-video")
  removeVideo(event: IpcMainInvokeEvent, id?: number) {
    return this.videoRepository.removeVideo(id);
  }
}
