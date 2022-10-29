import { wait } from "../utils";

export async function getConfig(): Promise<Config> {
  await wait(0.2);
  const data = await import("../../data/config.json");
  return data.default;
}
