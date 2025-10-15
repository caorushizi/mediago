import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { DownloadStatus, DownloadType } from "@mediago/shared-common";

/**
 * Video Entity (Database Layer)
 *
 * 注意：由于历史原因，数据库表名和实体名称为 "video"，但实际上这是一个下载任务实体。
 * Note: For historical reasons, the table name and entity class are named "video",
 * but this actually represents a download task entity.
 *
 * 分层命名约定：
 * - 数据库层（本文件）：Video 实体 → 映射到 "video" 表
 * - 业务逻辑层：DownloadTask 类型 → 表达业务概念"下载任务"
 * - 前端展示层：task 变量 → 用户界面中的任务项
 *
 * @see DownloadTask - 业务逻辑层使用的类型
 * @see DownloadTaskWithFile - 包含本地文件信息的扩展类型
 */
@Entity({
  name: "video",
})
export class Video {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "text",
    nullable: false,
    unique: true,
  })
  name!: string;

  @Column({
    type: "text",
    nullable: false,
    default: DownloadType.m3u8,
  })
  type!: DownloadType;

  @Column({
    type: "text",
    nullable: false,
  })
  url!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  folder?: string;

  @Column({
    type: "text",
    nullable: true,
  })
  headers?: string;

  @Column({
    type: "boolean",
    default: false,
    nullable: false,
  })
  isLive!: boolean;

  @Column({
    type: "text",
    nullable: false,
    default: DownloadStatus.Ready,
  })
  status!: DownloadStatus;

  @Column({
    type: "text",
    default: "",
  })
  log!: string;

  @CreateDateColumn()
  createdDate!: Date;

  @UpdateDateColumn()
  updatedDate!: Date;
}
