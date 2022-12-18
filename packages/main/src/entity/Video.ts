import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

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
  })
  headers: string;

  @CreateDateColumn()
  createdDate?: Date;

  @UpdateDateColumn()
  updatedDate?: Date;
}
