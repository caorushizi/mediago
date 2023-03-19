import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({
  name: "favorite",
})
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "text",
    nullable: true,
  })
  title: string;

  @Column({
    type: "text",
    nullable: true,
  })
  url: string;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
