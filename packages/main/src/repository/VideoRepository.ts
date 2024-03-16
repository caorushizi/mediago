import { Video } from "../entity/Video";
import { inject, injectable } from "inversify";
import {
  DownloadFilter,
  DownloadItem,
  DownloadItemPagination,
  DownloadStatus,
} from "../interfaces";
import { TYPES } from "../types";
import { In, Not } from "typeorm";
import TypeORM from "../vendor/TypeORM";

@injectable()
export default class VideoRepository {
  constructor(
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
  ) {}

  async addVideo(video: Omit<DownloadItem, "id">) {
    const item = new Video();
    item.name = video.name;
    item.url = video.url;
    item.type = video.type;
    video.headers && (item.headers = video.headers);
    return await this.db.manager.save(item);
  }

  async addVideos(videos: DownloadItem[]) {
    const items = videos.map((video) => {
      const item = new Video();
      item.name = video.name;
      item.url = video.url;
      item.type = video.type;
      video.headers && (item.headers = video.headers);
      return item;
    });
    return await this.db.manager.save(items);
  }

  // 编辑视频
  async editVideo(video: DownloadItem) {
    const item = await this.db.appDataSource
      .getRepository(Video)
      .findOneBy({ id: video.id });
    if (!item) {
      throw new Error("视频不存在");
    }
    item.name = video.name;
    item.url = video.url;
    video.headers && (item.headers = video.headers);
    return await this.db.manager.save(item);
  }

  // 查找所有视频
  async findAllVideos() {
    return await this.db.appDataSource.getRepository(Video).find({
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

    const [items, count] = await this.db.appDataSource
      .getRepository(Video)
      .findAndCount({
        where: {
          status: filterCondition,
        },
        order: {
          createdDate: "ASC",
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
    return this.db.appDataSource.getRepository(Video).findOneBy({
      id,
    });
  }

  async findVideoByName(name: string) {
    return this.db.appDataSource.getRepository(Video).findOneBy({
      name,
    });
  }

  async changeVideoStatus(id: number | number[], status: DownloadStatus) {
    const ids = !Array.isArray(id) ? [id] : id;
    return this.db.appDataSource
      .createQueryBuilder()
      .update(Video)
      .set({ status })
      .where({ id: In(ids) })
      .execute();
  }

  async changeVideoIsLive(id: number | number[], isLive: boolean) {
    const ids = !Array.isArray(id) ? [id] : id;
    return this.db.appDataSource
      .createQueryBuilder()
      .update(Video)
      .set({ isLive })
      .where({ id: In(ids) })
      .execute();
  }

  async findWattingAndDownloadingVideos() {
    return await this.db.appDataSource.getRepository(Video).find({
      where: {
        status: In([DownloadStatus.Downloading, DownloadStatus.Watting]),
      },
    });
  }

  async deleteDownloadItem(id: number) {
    return await this.db.appDataSource.getRepository(Video).delete(id);
  }

  async findVideoByUrl(url: string) {
    return this.db.appDataSource.getRepository(Video).findOneBy({
      url,
    });
  }

  async appendDownloadLog(id: number, message: string) {
    const video = await this.findVideo(id);
    if (!video) {
      throw new Error("视频不存在");
    }
    video.log = video.log ? `${video.log}\n${message}` : message;
    return await this.db.manager.save(video);
  }

  async getDownloadLog(id: number) {
    const video = await this.findVideo(id);
    if (!video) {
      throw new Error("视频不存在");
    }
    return video.log;
  }
}
