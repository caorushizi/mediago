import { DownloadStatus, DownloadType } from "../interfaces.ts";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({
  name: "video",
})
export class Video {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "text",
    nullable: false,
    unique: true,
  })
  name: string;

  @Column({
    type: "text",
    nullable: false,
    default: DownloadType.m3u8,
  })
  type: DownloadType;

  @Column({
    type: "text",
    nullable: false,
  })
  url: string;

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
  isLive: boolean;

  @Column({
    type: "text",
    nullable: false,
    default: DownloadStatus.Ready,
  })
  status: DownloadStatus;

  @Column({
    type: "text",
    default: "",
  })
  log: string;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
