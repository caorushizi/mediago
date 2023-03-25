import { Video } from "../entity/Video";
import { inject, injectable } from "inversify";
import {
  DatabaseService,
  DownloadItem,
  LoggerService,
  VideoRepository,
} from "../interfaces";
import { TYPES } from "../types";

@injectable()
export default class VideoRepositoryImpl implements VideoRepository {
  constructor(
    @inject(TYPES.DatabaseService)
    private readonly dataService: DatabaseService,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService
  ) {}

  async addVideo(video: DownloadItem) {
    const item = new Video();
    item.name = video.name;
    item.url = video.url;
    return await this.dataService.manager.save(item);
  }

  async findVideos({ current = 0, pageSize = 50 }) {
    const items = await this.dataService.appDataSource
      .getRepository(Video)
      .createQueryBuilder("video")
      .orderBy("createdDate", "DESC")
      .skip((current - 1) * pageSize)
      .take(pageSize)
      .getMany();
    const count = await this.dataService.appDataSource
      .getRepository(Video)
      .count();
    return {
      total: count,
      list: items,
    };
  }
}
