import useSWR from "swr";
import {
  getConfigKey,
  getConfig,
  setConfigValue,
  getEnvPathKey,
  getEnvPath,
} from "@/api/config";

export function useConfig() {
  const { data, isLoading, error, mutate } = useSWR(getConfigKey, getConfig);

  const setConfigKey = async (key: string, value: unknown) => {
    await setConfigValue(key, value);
    mutate();
  };

  return {
    config: data as Record<string, unknown> | undefined,
    isLoading,
    error,
    setConfigKey,
    mutate,
  };
}

export function useEnvPath() {
  const { data, isLoading, error } = useSWR(getEnvPathKey, getEnvPath);
  return {
    envPath: data as Record<string, unknown> | undefined,
    isLoading,
    error,
  };
}
