import { sequelize } from "./db";

(async function () {
  await sequelize.sync();
})();
