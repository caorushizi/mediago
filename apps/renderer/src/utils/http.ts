import axios from "axios";

// Create an axios instance
const http = axios.create({});

export { http };

const api = axios.create({
  baseURL: import.meta.env.DEV ? "http://localhost:8899/api" : "/api",
});

api.interceptors.response.use(
  ({ data }) => {
    return Promise.resolve(data);
  },
  (error) => {
    return Promise.reject(error);
  },
);

export { api };
