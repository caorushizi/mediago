import { provide } from "@inversifyjs/binding-decorators";
import { inject, injectable } from "inversify";
import type { Favorite } from "../dao/entity/Favorite";
import FavoriteRepository from "../dao/repository/FavoriteRepository";
import { TYPES } from "../types";

@injectable()
@provide(TYPES.FavoriteManagementService)
export class FavoriteManagementService {
  constructor(
    @inject(FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async getFavorites() {
    return this.favoriteRepository.findFavorites();
  }

  async addFavorite(favorite: Favorite) {
    return this.favoriteRepository.addFavorite(favorite);
  }

  async removeFavorite(id: number): Promise<void> {
    return this.favoriteRepository.removeFavorite(id);
  }

  async exportFavorites() {
    const favorites = await this.favoriteRepository.findFavorites();
    return JSON.stringify(
      favorites.map((i) => ({
        title: i.title,
        url: i.url,
        icon: i.icon,
      })),
      null,
      2,
    );
  }

  async importFavorites(favorites: any[]) {
    await this.favoriteRepository.importFavorites(favorites);
  }
}
