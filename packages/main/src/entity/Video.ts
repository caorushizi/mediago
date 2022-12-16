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

  @CreateDateColumn()
  createdDate?: Date;

  @UpdateDateColumn()
  updatedDate?: Date;
}
