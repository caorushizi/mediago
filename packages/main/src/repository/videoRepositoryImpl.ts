import { Video } from "../entity/Video";
import { inject, injectable } from "inversify";
import {
  DatabaseService,
  DownloadFilter,
  DownloadItem,
  DownloadItemPagination,
  DownloadStatus,
  LoggerService,
  VideoRepository,
} from "../interfaces";
import { TYPES } from "../types";
import { In, Not } from "typeorm";

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
    item.headers = video.headers;
    return await this.dataService.manager.save(item);
  }

  // 编辑视频
  async editVideo(video: DownloadItem) {
    const item = await this.dataService.appDataSource
      .getRepository(Video)
      .findOneBy({ id: video.id });
    if (!item) {
      throw new Error("视频不存在");
    }
    item.name = video.name;
    item.url = video.url;
    return await this.dataService.manager.save(item);
  }

  // 查找所有视频
  async findAllVideos() {
    return await this.dataService.appDataSource.getRepository(Video).find({
      order: {
        createdDate: "DESC",
      },
    });
  }

  async findVideos(pagination: DownloadItemPagination) {
    const {
      current = 0,
      pageSize = 50,
      filter = DownloadFilter.list,
    } = pagination;
    const filterCondition =
      filter === DownloadFilter.done
        ? DownloadStatus.Success
        : Not(DownloadStatus.Success);

    const [items, count] = await this.dataService.appDataSource
      .getRepository(Video)
      .findAndCount({
        where: {
          status: filterCondition,
        },
        order: {
          createdDate: "DESC",
        },
        skip: (current - 1) * pageSize,
        take: pageSize,
      });
    return {
      total: count,
      list: items,
    };
  }

  async findVideo(id: number) {
    return this.dataService.appDataSource.getRepository(Video).findOneBy({
      id,
    });
  }

  async changeVideoStatus(id: number | number[], status: DownloadStatus) {
    const ids = !Array.isArray(id) ? [id] : id;
    return this.dataService.appDataSource
      .createQueryBuilder()
      .update(Video)
      .set({ status })
      .where({ id: In(ids) })
      .execute();
  }

  async changeVideoIsLive(id: number | number[], isLive: boolean) {
    const ids = !Array.isArray(id) ? [id] : id;
    return this.dataService.appDataSource
      .createQueryBuilder()
      .update(Video)
      .set({ isLive })
      .where({ id: In(ids) })
      .execute();
  }

  async findWattingAndDownloadingVideos() {
    return await this.dataService.appDataSource.getRepository(Video).find({
      where: {
        status: In([DownloadStatus.Downloading, DownloadStatus.Watting]),
      },
    });
  }

  async deleteDownloadItem(id: number) {
    return await this.dataService.appDataSource.getRepository(Video).delete(id);
  }

  async findVideoByUrl(url: string) {
    return this.dataService.appDataSource.getRepository(Video).findOneBy({
      url,
    });
  }
}
