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

  const setupAuth = async (
    password: string,
    setupToken?: string,
  ): Promise<string> => {
    const apiKey = await setupApi(password, setupToken);
    mutate();
    return apiKey;
  };

  const signin = async (password: string): Promise<string> => {
    return signinApi(password);
  };

  return {
    isSetuped: data?.setuped ?? false,
    setupTokenRequired: data?.setupTokenRequired ?? false,
    isLoading,
    error,
    setupAuth,
    signin,
  };
}
