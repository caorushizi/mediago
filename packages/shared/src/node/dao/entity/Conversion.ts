import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({
  name: "conversion",
})
export class Conversion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "text",
    nullable: true,
  })
  name!: string;

  @Column({
    type: "text",
    nullable: false,
    default: "",
  })
  path!: string;

  @CreateDateColumn()
  createdDate?: Date;

  @UpdateDateColumn()
  updatedDate?: Date;
}
