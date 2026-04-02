import { http } from "@/utils";

export const getFavoritesKey = "/api/favorites";
export const getFavorites = () => http.get(getFavoritesKey);

export const addFavorite = (fav: {
  title: string;
  url: string;
  icon?: string;
}) => http.post("/api/favorites", fav);

export const removeFavorite = (id: number) =>
  http.delete(`/api/favorites/${id}`);

export const exportFavorites = () => http.get("/api/favorites/export");

export const importFavorites = (favorites: unknown[]) =>
  http.post("/api/favorites/import", { favorites });
