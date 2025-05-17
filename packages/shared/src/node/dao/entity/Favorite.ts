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
  id!: number;

  @Column({
    type: "text",
    nullable: false,
  })
  title!: string;

  @Column({
    type: "text",
    nullable: false,
  })
  url!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  icon?: string;

  @CreateDateColumn()
  createdDate!: Date;

  @UpdateDateColumn()
  updatedDate!: Date;
}
