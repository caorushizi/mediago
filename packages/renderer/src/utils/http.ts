import axios from "axios";

const BASE_URL = import.meta.env.APP_BASE_URL;

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 6000,
});

export { http };
