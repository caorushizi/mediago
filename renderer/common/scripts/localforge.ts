import { Fav, SourceItem } from "types/common";
import * as localforage from "localforage";
import { SourceStatus } from "renderer/common/types";
import { cloneDeep } from "lodash";

const keys = { videos: "videos", fav: "fav" };

const insertVideo = async (
  item: SourceItem
): Promise<SourceItem | undefined> => {
  let videos = await localforage.getItem<SourceItem[]>(keys.videos);
  // 首先查看数据库中是否存在
  if (!Array.isArray(videos)) videos = [];
  const isFav =
    videos.findIndex((video) => video.details.url === item.details.url) >= 0;
  if (isFav) return undefined;
  videos.push(item);
  await localforage.setItem(keys.videos, videos);
  return item;
};

const getVideos = async (
  page: number,
  pageSize = 20
): Promise<SourceItem[]> => {
  let queryPage = page;
  if (page <= 0) queryPage = 1;
  let videos = await localforage.getItem<SourceItem[]>(keys.videos);
  if (!Array.isArray(videos)) videos = [];
  return videos.slice((queryPage - 1) * pageSize, queryPage * pageSize);
};

const updateVideoStatus = async (
  source: SourceItem,
  status: SourceStatus
): Promise<void> => {
  // fixme: 当数据量比较大的时候
  let videos = await localforage.getItem<SourceItem[]>(keys.videos);
  if (!Array.isArray(videos)) videos = [];
  const findIndex = videos.findIndex(
    (video) => source.details.url === video.details.url
  );
  if (findIndex >= 0) {
    videos.splice(findIndex, 1, { ...source, status });
    await localforage.setItem(keys.videos, videos);
  }
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

export {
  insertVideo,
  getVideos,
  updateVideoStatus,
  insertFav,
  isFavFunc,
  removeFav,
  getFavs,
};
