import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum VideoStatus {
  Ready = "ready",
  Downloading = "downloading",
  Failed = "failed",
  Success = "success",
}

@Entity()
export class Video {
  @PrimaryGeneratedColumn()
  id?: number;

  // 视频名称
  @Column({
    type: "text",
  })
  name: string;

  // 视频url
  @Column({
    type: "text",
  })
  url: string;

  // 请求标头
  @Column({
    type: "text",
    nullable: true,
  })
  headers?: string;

  @Column({
    type: "text",
  })
  status: VideoStatus;

  @CreateDateColumn()
  createdDate?: Date;

  @UpdateDateColumn()
  updatedDate?: Date;
}
