import { http } from "@/utils";

export const getConfigKey = "/api/config";
export const getConfig = () => http.get(getConfigKey);

export const setConfigValue = (key: string, value: unknown) =>
  http.put(`/api/config/${key}`, { value });

export const getEnvPathKey = "/api/env";
export const getEnvPath = () => http.get(getEnvPathKey);
