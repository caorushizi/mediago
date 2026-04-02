import useSWR from "swr";
import {
  getAuthStatusKey,
  getAuthStatus,
  setupAuth as setupApi,
  signin as signinApi,
} from "@/api/auth";

export function useAuthApi() {
  const { data, isLoading, error, mutate } = useSWR(
    getAuthStatusKey,
    getAuthStatus,
  );

  const setupAuth = async (apiKey: string) => {
    await setupApi(apiKey);
    mutate();
  };

  const signin = async (apiKey: string) => {
    return signinApi(apiKey);
  };

  return {
    isSetuped: (data as Record<string, unknown>)?.initialized ?? false,
    isLoading,
    error,
    setupAuth,
    signin,
  };
}
