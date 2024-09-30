import axios from "axios";
import { io } from "socket.io-client";

// 创建 axios 实例
const http = axios.create({});

export { http };

const api = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:3000/api" : "/api",
});

api.interceptors.response.use(
  ({ data }) => {
    return Promise.resolve(data);
  },
  (error) => {
    return Promise.reject(error);
  },
);

const socket = io("http://localhost:3000");

export { api, socket };
