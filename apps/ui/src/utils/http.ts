import { useAppStore } from "@/store/app";
import axios from "axios";

// Go Core axios instance
const http = axios.create({});

/**
 * Initialize http instance with Go Core base URL and optional API key.
 * Called once from App.tsx after discovering the core URL.
 */
export function setupHttp(baseURL: string, apiKey?: string) {
  http.defaults.baseURL = baseURL;
  if (apiKey) {
    http.defaults.headers.common["X-API-Key"] = apiKey;
  }
}

/**
 * Update the API key on the existing http instance (e.g. after signin).
 */
export function setHttpApiKey(apiKey: string) {
  http.defaults.headers.common["X-API-Key"] = apiKey;
}

// Response interceptor: unwrap Go Core { success, code, data, message } format
http.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && typeof res === "object" && "success" in res) {
      if (res.success) {
        return res.data;
      }
      if (res.code === 401) {
        window.location.pathname = "/signin";
      }
      return Promise.reject(new Error(res.message || "Request failed"));
    }
    // Non-standard response (e.g. raw data), return as-is
    return res;
  },
  (error) => Promise.reject(error),
);

export { http };

// Docker/Server API axios instance (existing)
const api = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:8899/api" : "/api",
});

api.interceptors.request.use(
  (config) => {
    if (!config.data) {
      config.data = {};
    }
    if (!config.data.auth) {
      const appStore = useAppStore.getState();
      config.data.auth = appStore.apiKey;
    }
    return Promise.resolve(config);
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  ({ data }) => {
    return Promise.resolve(data);
  },
  (error) => {
    return Promise.reject(error);
  },
);

export { api };
