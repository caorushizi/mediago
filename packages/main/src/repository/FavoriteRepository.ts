import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { Favorite } from "../entity/Favorite";
import TypeORM from "../vendor/TypeORM";

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
      throw new Error("网址已经存在");
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
}
