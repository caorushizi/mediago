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
    private readonly videoRepository: VideoRepository
  ) {}

  @handle("get-video-list")
  async getVideoList(): Promise<Video[]> {
    return await this.videoRepository.getVideoList();
  }

  @handle("add-video")
  async addVideo(event: IpcMainInvokeEvent, video: Video): Promise<Video> {
    console.log("video:", video);
    return await this.videoRepository.insertVideo(video);
  }

  @handle("update-video")
  async updateVideo(
    event: IpcMainInvokeEvent,
    id: number,
    video: Partial<Video>
  ) {
    return await this.videoRepository.updateVideo(id, video);
  }

  @handle("remove-video")
  async removeVideo(event: IpcMainInvokeEvent, id?: number) {
    return await this.videoRepository.removeVideo(id);
  }
}
