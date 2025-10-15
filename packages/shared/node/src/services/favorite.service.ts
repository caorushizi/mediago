import { provide } from "@inversifyjs/binding-decorators";
import { inject, injectable } from "inversify";
import type { Favorite } from "../dao/entity/favorite.entity";
import FavoriteRepository from "../dao/repository/favorite.repository";
import { TYPES } from "../types";
import { i18n } from "../i18n";

@injectable()
@provide(TYPES.FavoriteManagementService)
export class FavoriteManagementService {
  constructor(
    @inject(FavoriteRepository)
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async getFavorites() {
    return this.favoriteRepository.findAll("DESC");
  }

  async addFavorite(favorite: Omit<Favorite, "id" | "createdDate">) {
    // Check if URL already exists
    const existing = await this.favoriteRepository.findByUrl(favorite.url);
    if (existing) {
      throw new Error(i18n.t("urlExist"));
    }
    return this.favoriteRepository.create(favorite);
  }

  async removeFavorite(id: number): Promise<void> {
    return this.favoriteRepository.delete(id);
  }

  async exportFavorites() {
    const favorites = await this.favoriteRepository.findAll("DESC");
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

  async importFavorites(favorites: Omit<Favorite, "id" | "createdDate">[]) {
    await this.favoriteRepository.createMany(favorites);
  }
}
