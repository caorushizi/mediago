import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AppLanguage, AppTheme } from "../types.ts";
import { DOWNLOAD_DIR } from "../const.ts";

@Entity({
  name: "config",
})
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
    nullable: false,
    default: DOWNLOAD_DIR,
  })
  local: string;

  @Column({
    type: "enum",
    enum: AppTheme,
    nullable: false,
    default: AppTheme.System,
  })
  theme: AppTheme;

  @Column({
    type: "enum",
    enum: AppLanguage,
    nullable: false,
    default: AppLanguage.System,
  })
  language: AppLanguage;

  @Column({
    type: "varchar",
    nullable: false,
    default: "",
  })
  proxy: string;

  @Column({
    type: "boolean",
    default: false,
    nullable: false,
  })
  isLive: boolean;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
  })
  downloadProxySwitch: boolean;

  @Column({
    type: "boolean",
    nullable: false,
    default: true,
  })
  deleteSegments: boolean;

  @Column({
    type: "int",
    nullable: false,
    default: 2,
  })
  maxRunner: number;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;
}
