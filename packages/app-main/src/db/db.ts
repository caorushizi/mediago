import { db } from "../utils/variables";
import { DataTypes, Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: db,
});

export const Favorite = sequelize.define("Favorite", {
  title: DataTypes.STRING,
  url: DataTypes.STRING,
});

export const Video = sequelize.define("Video", {
  title: DataTypes.STRING,
  url: DataTypes.STRING,
});
