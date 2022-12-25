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

  // url
  @Column({
    type: "text",
  })
  url: string;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
