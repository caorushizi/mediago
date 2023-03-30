import { inject, injectable } from "inversify";
import {
  DatabaseService,
  FavoriteRepository,
  LoggerService,
} from "../interfaces";
import { TYPES } from "../types";
import { Favorite } from "entity/Favorite";

@injectable()
export default class FavoriteRepositoryImpl implements FavoriteRepository {
  constructor(
    @inject(TYPES.DatabaseService)
    private readonly dataService: DatabaseService,
    @inject(TYPES.LoggerService)
    private readonly logger: LoggerService
  ) {}

  async findFavorites(): Promise<Favorite[]> {
    return await this.dataService.manager.find(Favorite, {
      order: {
        createdDate: "desc",
      },
    });
  }

  async addFavorite(favorite: Favorite): Promise<Favorite> {
    const exist = await this.dataService.manager.findOne(Favorite, {
      where: {
        url: favorite.url,
      },
    });

    if (exist) {
      return exist;
    }

    const item = new Favorite();
    item.title = favorite.title;
    item.url = favorite.url;
    item.icon = favorite.icon;
    return await this.dataService.manager.save(item);
  }

  async removeFavorite(id: number): Promise<void> {
    await this.dataService.manager.getRepository(Favorite).delete(id);
  }
}
