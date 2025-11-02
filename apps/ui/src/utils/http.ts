import { useAppStore } from "@/store/app";
import axios from "axios";

// Create an axios instance
const http = axios.create({});

export { http };

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
