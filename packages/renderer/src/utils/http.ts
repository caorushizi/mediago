import axios from "axios";

const BASE_URL = process.env.VITE_BASE_URL;

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 6000,
  headers: {
    "Content-Type": "text/plain",
  },
});

export { http };
