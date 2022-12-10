import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  // 收藏url
  @Column()
  title: string;

  // 描述
  @Column({
    type: "text",
  })
  desc?: string;

  // url
  @Column({
    type: "text",
  })
  url: string;

  // 是否置顶
  @Column({
    type: "boolean",
    default: false,
  })
  is_favorite: boolean;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
