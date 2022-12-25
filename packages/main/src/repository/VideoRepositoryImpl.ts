import { inject, injectable } from "inversify";
import { Video } from "../entity";
import { Repository } from "typeorm/repository/Repository";
import { DataService, VideoRepository } from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class VideoRepositoryImpl implements VideoRepository {
  private readonly repository: Repository<Video>;
  constructor(
    @inject(TYPES.DataService)
    private readonly dataSource: DataService
  ) {
    this.repository = this.dataSource.getRepository(Video);
  }

  async insertVideo(item: Video): Promise<Video> {
    const result = await this.repository.insert(item);
    return result.raw;
  }

  async getVideoList(): Promise<Video[]> {
    return await this.repository.find();
  }

  async updateVideo(id: number, video: Partial<Video>): Promise<void> {
    await this.repository.update({ id }, { ...video });
  }

  async findById(id: number): Promise<Video | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async removeVideo(id?: number): Promise<void> {
    if (id) {
      const video = await this.repository.findOne({ where: { id } });
      if (video != null) {
        await this.repository.remove(video);
      }
    } else {
      const videos = await this.repository.find();
      await this.repository.remove(videos);
    }
  }
}
