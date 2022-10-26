import { wait } from "../utils";

export async function getVideoList(): Promise<Video[]> {
  await wait(0.2);
  const data = await import("../../data/video_list.json");
  return data.default;
}
