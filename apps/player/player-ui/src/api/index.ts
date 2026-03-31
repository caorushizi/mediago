import { http } from "@/lib/utils";

export interface VideoListResponse {
  url: string;
  title: string;
}
export const getVideoListKey = "/api/v1/videos";
export async function getVideoList() {
  const resp = await http.get<VideoListResponse[]>(getVideoListKey);
  return resp.data;
}
