import { wait } from "../utils";

export async function getCollections(): Promise<Collection[]> {
  await wait(0.2);
  const data = await import("../../data/collections.json");
  return data.default;
}
