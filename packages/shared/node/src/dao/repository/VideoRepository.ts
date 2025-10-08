import { provide } from "@inversifyjs/binding-decorators";
import { inject, injectable } from "inversify";
import { In, Not } from "typeorm";
import { i18n } from "../../i18n";
import {
  DownloadFilter,
  type DownloadItem,
  type DownloadItemPagination,
  DownloadStatus,
} from "@mediago/shared-common";
import TypeORM from "../../vendor/TypeORM";
import { Video } from "../entity/Video";

@injectable()
@provide()
export default class VideoRepository {
  constructor(
    @inject(TypeORM)
    private readonly db: TypeORM,
  ) {}

  async addVideo(video: Omit<DownloadItem, "id">) {
    // Let's see if there's a video with the same name
    // const exist = await this.findVideoByName(video.name);
    // if (exist) {
    //   throw new Error(i18n.t("videoExistsPleaseChangeName"));
    // }
    const item = new Video();
    item.name = video.name;
    item.url = video.url;
    item.type = video.type;
    if (video.headers) {
      item.headers = video.headers;
    }
    if (video.folder) {
      item.folder = video.folder;
    }
    return await this.db.manager.save(item);
  }

  async addVideos(videos: Omit<DownloadItem, "id">[]) {
    // Check for videos with the same name
    // const names = videos.map((item) => item.name);
    // const existItems = await this.db.appDataSource
    //   .getRepository(Video)
    //   .findBy({ name: In(names) });
    // if (existItems.length) {
    //   const existNames = existItems.map((item) => item.name);
    //   throw new Error(
    //     i18n.t("videoExistsPleaseChangeName") +
    //       "[" +
    //       existNames.join(", ") +
    //       "]",
    //   );
    // }

    const items = videos.map((video) => {
      const item = new Video();
      item.name = video.name;
      item.url = video.url;
      item.type = video.type;
      if (video.headers) {
        item.headers = video.headers;
      }
      if (video.folder) {
        item.folder = video.folder;
      }
      return item;
    });
    return await this.db.manager.save(items);
  }

  // Edit video
  async editVideo(video: DownloadItem) {
    const item = await this.db.manager.getRepository(Video).findOneBy({
      id: video.id,
    });
    if (!item) {
      throw new Error(i18n.t("videoNotExists"));
    }
    item.name = video.name;
    item.url = video.url;
    if (video.headers) {
      item.headers = video.headers;
    }
    if (video.folder) {
      item.folder = video.folder;
    }
    return await this.db.manager.save(item);
  }

  // Find all Videos
  async findAllVideos() {
    return await this.db.manager.getRepository(Video).find({
      order: {
        createdDate: "DESC",
      },
    });
  }

  async findVideos(pagination: DownloadItemPagination) {
    const { current = 0, pageSize = 50, filter = DownloadFilter.list } = pagination;
    const filterCondition = filter === DownloadFilter.done ? DownloadStatus.Success : Not(DownloadStatus.Success);

    const [items, count] = await this.db.manager.getRepository(Video).findAndCount({
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
    const repository = this.db.manager.getRepository(Video);
    const video = await repository.findOneBy({ id });

    if (!video) {
      throw new Error(i18n.t("videoNotExists"));
    }

    return video;
  }

  async findVideoByName(name: string) {
    return this.db.manager.getRepository(Video).findOneBy({
      name,
    });
  }

  async changeVideoStatus(id: number | number[], status: DownloadStatus) {
    const ids = !Array.isArray(id) ? [id] : id;
    const videoRepository = this.db.manager.getRepository(Video);
    const videos = await videoRepository.findBy({ id: In(ids) });
    for (const video of videos) {
      video.status = status;
    }
    await videoRepository.save(videos);
  }

  async changeVideoIsLive(id: number) {
    const video = await this.findVideo(id);
    video.isLive = true;
    return this.db.manager.save(video);
  }

  async findWattingAndDownloadingVideos() {
    return await this.db.manager.getRepository(Video).find({
      where: {
        status: In([DownloadStatus.Downloading, DownloadStatus.Watting]),
      },
    });
  }

  async deleteDownloadItem(id: number) {
    return await this.db.manager.getRepository(Video).delete(id);
  }

  async findVideoByUrl(url: string) {
    return this.db.manager.getRepository(Video).findOneBy({
      url,
    });
  }

  async appendDownloadLog(id: number, message: string) {
    const video = await this.findVideo(id);
    video.log = video.log ? `${video.log}\n${message}` : message;
    return await this.db.manager.save(video);
  }

  async getDownloadLog(id: number) {
    const video = await this.findVideo(id);
    return video.log;
  }

  async getVideoFolders() {
    const videos = await this.db.manager.getRepository(Video).find();
    const folders = new Set<string>();
    for (const video of videos) {
      if (video.folder) {
        folders.add(video.folder);
      }
    }
    return Array.from(folders);
  }
}
