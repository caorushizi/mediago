import { inject, injectable } from "inversify";
import { Video } from "../entity";
import { Repository } from "typeorm/repository/Repository";
import { DataService, VideoRepository } from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class VideoRepositoryImpl implements VideoRepository {
  private repository: Repository<Video>;
  constructor(
    @inject(TYPES.DataService)
    private dataSource: DataService
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
}
