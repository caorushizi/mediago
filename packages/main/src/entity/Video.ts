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
    nullable: true,
  })
  name: string;

  @Column({
    type: "text",
    nullable: false,
  })
  url: string;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
