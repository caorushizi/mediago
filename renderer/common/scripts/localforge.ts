import { Fav, SourceUrl } from "types/common";
import * as localforage from "localforage";

const keys = { videos: "videos", fav: "fav" };

const insertVideo = async (item: SourceUrl): Promise<SourceUrl[]> => {
  let videos = await localforage.getItem<SourceUrl[]>(keys.videos);
  // 首先查看数据库中是否存在
  if (!Array.isArray(videos)) videos = [];
  const isFav =
    videos.findIndex((video) => video.details.url === item.details.url) >= 0;
  if (isFav) return videos;
  videos.push(item);
  await localforage.setItem(keys.videos, videos);
  return videos;
};

const getVideos = async (page: number, pageSize = 20): Promise<SourceUrl[]> => {
  let videos = await localforage.getItem<SourceUrl[]>(keys.videos);
  if (!Array.isArray(videos)) videos = [];
  return videos.slice((page - 1) * pageSize, page * pageSize);
};

const insertFav = async (fav: Fav): Promise<Fav[]> => {
  let favs = await localforage.getItem<Fav[]>(keys.fav);
  if (!Array.isArray(favs)) favs = [];
  const isFav = favs.findIndex((item) => item.url === fav.url) >= 0;
  if (isFav) return favs;
  favs.push(fav);
  await localforage.setItem(keys.fav, favs);
  return favs;
};

const removeFav = async (fav: Fav): Promise<Fav[]> => {
  let favs = await localforage.getItem<Fav[]>(keys.fav);
  if (!Array.isArray(favs)) favs = [];
  const favIndex = favs.findIndex((item) => item.url === fav.url);
  if (favIndex >= 0) favs.splice(favIndex, 1);
  await localforage.setItem(keys.fav, favs);
  return favs;
};

const isFavFunc = async (url: string): Promise<boolean> => {
  let favs = await localforage.getItem<Fav[]>(keys.fav);
  if (!Array.isArray(favs)) favs = [];
  return favs.findIndex((item) => item.url === url) >= 0;
};

const getFavs = async (): Promise<Fav[]> => {
  const favs = await localforage.getItem<Fav[]>(keys.fav);
  if (!Array.isArray(favs)) return [];
  return favs;
};

export { insertVideo, getVideos, insertFav, isFavFunc, removeFav, getFavs };
