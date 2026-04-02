import { http } from "@/lib/utils";

export interface VideoItem {
  id: number;
  url: string;
  title: string;
}
export const getVideoListKey = "/api/v1/videos";
export async function getVideoList() {
  const resp = await http.get<VideoItem[]>(getVideoListKey);
  return resp.data;
}

export async function getVideoById(id: number) {
  const resp = await http.get<VideoItem>(`/api/v1/videos/${id}`);
  return resp.data;
}
