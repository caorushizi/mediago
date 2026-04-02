import useSWR from "swr";
import {
  getFavoritesKey,
  getFavorites,
  addFavorite as addFavApi,
  removeFavorite as removeFavApi,
} from "@/api/favorite";
import type { Favorite } from "@mediago/shared-common";

export function useFavorites() {
  const { data, isLoading, error, mutate } = useSWR(
    getFavoritesKey,
    getFavorites,
  );

  const addFavorite = async (fav: {
    title: string;
    url: string;
    icon?: string;
  }) => {
    await addFavApi(fav);
    mutate();
  };

  const removeFavorite = async (id: number) => {
    await removeFavApi(id);
    mutate();
  };

  return {
    data: data ?? ([] as Favorite[]),
    isLoading,
    error,
    mutate,
    addFavorite,
    removeFavorite,
  };
}
