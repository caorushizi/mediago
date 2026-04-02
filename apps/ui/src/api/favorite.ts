import { http } from "@/utils";
import type { Favorite } from "@mediago/shared-common";

export const getFavoritesKey = "/api/favorites";
export const getFavorites = (): Promise<Favorite[]> =>
  http.get(getFavoritesKey);

export const addFavorite = (fav: {
  title: string;
  url: string;
  icon?: string;
}): Promise<Favorite> => http.post("/api/favorites", fav);

export const removeFavorite = (id: number): Promise<void> =>
  http.delete(`/api/favorites/${id}`);

export const exportFavorites = (): Promise<string> =>
  http.get("/api/favorites/export");

export const importFavorites = (favorites: unknown[]): Promise<void> =>
  http.post("/api/favorites/import", { favorites });
