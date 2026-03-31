import axios, { type AxiosInstance, AxiosError, type AxiosResponse } from 'axios';

/**
 * Creates and configures an Axios instance for the MediaGo API.
 * @param baseURL - The base URL for the API.
 * @returns A fully configured AxiosInstance.
 */
export function createApiClient(baseURL: string): AxiosInstance {
  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add a response interceptor
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      // For successful responses (2xx), just return the data.
      return response.data;
    },
    (error: AxiosError) => {
      // For error responses, parse and throw a new error.
      if (error.response) {
        const apiError = error.response.data as { message?: string };
        const errorMessage = apiError.message || error.message;
        return Promise.reject(new Error(`API request failed: ${errorMessage}`));
      }
      return Promise.reject(error);
    },
  );

  return api;
}
