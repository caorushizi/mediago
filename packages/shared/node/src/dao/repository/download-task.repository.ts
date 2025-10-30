import { provide } from "@inversifyjs/binding-decorators";
import { inject, injectable } from "inversify";
import { In, Not, Repository } from "typeorm";
import { i18n } from "../../i18n";
import { DownloadFilter, type DownloadTask, type DownloadTaskPagination, DownloadStatus } from "@mediago/shared-common";
import TypeORM from "../../vendor/TypeORM";
import { Video } from "../entity/video.entity";

/**
 * Download Task Repository (Data Access Layer)
 *
 * 下载任务数据访问层，负责下载任务的数据库操作。
 * Download task data access layer, responsible for database operations of download tasks.
 *
 * 注意：虽然类名是 DownloadTaskRepository，但操作的数据库表名为 "video"（历史原因）。
 * Note: Although the class name is DownloadTaskRepository, it operates on the "video" table (for historical reasons).
 *
 * 命名说明：
 * - 类名：DownloadTaskRepository（反映业务概念）
 * - 操作实体：Video（数据库 ORM 实体，映射到 "video" 表）
 * - 方法参数：DownloadTask（业务层类型）
 * - 返回类型：Video（数据库实体，可自动转换为 DownloadTask）
 *
 * 这种设计将业务概念与数据库实现细节分离，避免数据库表重命名的风险。
 * This design separates business concepts from database implementation details,
 * avoiding the risk of database table renaming.
 *
 * @see Video - 数据库实体（ORM 映射到 "video" 表）
 * @see DownloadTask - 业务逻辑层类型
 */
@injectable()
@provide()
export default class DownloadTaskRepository {
  private get repository(): Repository<Video> {
    return this.db.manager.getRepository(Video);
  }

  constructor(
    @inject(TypeORM)
    private readonly db: TypeORM,
  ) {}

  // Create operations
  async create(task: Omit<DownloadTask, "id">): Promise<Video> {
    const item = this.repository.create({
      name: task.name,
      url: task.url,
      type: task.type,
      headers: task.headers,
      folder: task.folder,
    });
    return await this.repository.save(item);
  }

  async createMany(tasks: Omit<DownloadTask, "id">[]): Promise<Video[]> {
    const items = tasks.map((task) =>
      this.repository.create({
        name: task.name,
        url: task.url,
        type: task.type,
        headers: task.headers,
        folder: task.folder,
      }),
    );
    return await this.repository.save(items);
  }

  // Read operations
  async findById(id: number): Promise<Video | null> {
    return await this.repository.findOneBy({ id });
  }

  async findByIdOrFail(id: number): Promise<Video> {
    const task = await this.findById(id);
    if (!task) {
      throw new Error(i18n.t("videoNotExists"));
    }
    return task;
  }

  async findByName(name: string): Promise<Video | null> {
    return await this.repository.findOneBy({ name });
  }

  async findByUrl(url: string): Promise<Video | null> {
    return await this.repository.findOneBy({ url });
  }

  async findAll(order: "ASC" | "DESC" = "DESC"): Promise<Video[]> {
    return await this.repository.find({
      order: {
        createdDate: order,
      },
    });
  }

  async findByStatus(statuses: DownloadStatus[]): Promise<Video[]> {
    return await this.repository.find({
      where: {
        status: In(statuses),
      },
    });
  }

  async findWithPagination(pagination: DownloadTaskPagination) {
    const { current = 1, pageSize = 50, filter } = pagination;

    if (!filter) {
      const [items, total] = await this.repository.findAndCount({
        order: {
          createdDate: "DESC",
        },
        skip: (current - 1) * pageSize,
        take: pageSize,
      });

      return {
        items,
        total,
        current,
        pageSize,
      };
    }

    const filterCondition = filter === DownloadFilter.done ? DownloadStatus.Success : Not(DownloadStatus.Success);

    const [items, total] = await this.repository.findAndCount({
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
      items,
      total,
      current,
      pageSize,
    };
  }

  async findDistinctFolders(): Promise<string[]> {
    const tasks = await this.repository.find({
      select: ["folder"],
      where: {
        folder: Not(""),
      },
    });
    return Array.from(new Set(tasks.map((t) => t.folder).filter(Boolean))) as string[];
  }

  // Update operations
  async update(id: number, data: Partial<DownloadTask>): Promise<Video> {
    const task = await this.findByIdOrFail(id);
    Object.assign(task, {
      name: data.name,
      url: data.url,
      headers: data.headers,
      folder: data.folder,
    });
    return await this.repository.save(task);
  }

  async updateStatus(ids: number | number[], status: DownloadStatus): Promise<void> {
    const idArray = Array.isArray(ids) ? ids : [ids];
    await this.repository.update({ id: In(idArray) }, { status });
  }

  async updateIsLive(id: number, isLive: boolean = true): Promise<Video> {
    const task = await this.findByIdOrFail(id);
    task.isLive = isLive;
    return await this.repository.save(task);
  }

  async appendLog(id: number, message: string): Promise<Video> {
    const task = await this.findByIdOrFail(id);
    task.log = task.log ? `${task.log}\n${message}` : message;
    return await this.repository.save(task);
  }

  // Delete operations
  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteMany(ids: number[]): Promise<void> {
    await this.repository.delete(ids);
  }
}
