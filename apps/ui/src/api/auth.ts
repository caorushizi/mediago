import { http } from "@/utils";

export const getAuthStatusKey = "/api/auth/status";
export const getAuthStatus = () => http.get(getAuthStatusKey);

export const setupAuth = (apiKey: string) =>
  http.post("/api/auth/setup", { apiKey });

export const signin = (apiKey: string) =>
  http.post("/api/auth/signin", { apiKey });
