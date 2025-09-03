import { inject, injectable } from "inversify";
import { i18n } from "../../../common/index.js";
import { TYPES } from "../../types/index.js";
import type TypeORM from "../../vendor/TypeORM";
import { Favorite } from "../entity/Favorite.js";

@injectable()
export default class FavoriteRepository {
  constructor(
    @inject(TYPES.TypeORM)
    private readonly db: TypeORM,
  ) {}

  async findFavorites(): Promise<Favorite[]> {
    return await this.db.manager.find(Favorite, {
      order: {
        createdDate: "desc",
      },
    });
  }

  async addFavorite(favorite: Favorite): Promise<Favorite> {
    const exist = await this.db.manager.findOne(Favorite, {
      where: {
        url: favorite.url,
      },
    });

    if (exist) {
      throw new Error(i18n.t("urlExist"));
    }

    const item = new Favorite();
    item.title = favorite.title;
    item.url = favorite.url;
    item.icon = favorite.icon;
    return await this.db.manager.save(item);
  }

  async removeFavorite(id: number): Promise<void> {
    await this.db.manager.getRepository(Favorite).delete(id);
  }

  async importFavorites(favorites: Favorite[]): Promise<void> {
    await this.db.manager.save(Favorite, favorites);
  }
}
