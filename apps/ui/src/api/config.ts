import { http } from "@/utils";
import type { AppStore } from "@mediago/shared-common";

export interface GoEnvPath {
  configDir: string;
  binDir: string;
  platform: string;
}

export const getConfigKey = "/api/config";
export const getConfig = (): Promise<AppStore> => http.get(getConfigKey);

export const setConfigValue = (key: string, value: unknown): Promise<void> =>
  http.put(`/api/config/${key}`, { value });

export const getEnvPathKey = "/api/env";
export const getEnvPath = (): Promise<GoEnvPath> => http.get(getEnvPathKey);
