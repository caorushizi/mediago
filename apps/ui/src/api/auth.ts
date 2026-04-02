import { http } from "@/utils";

export interface AuthStatus {
  setuped: boolean;
}

export const getAuthStatusKey = "/api/auth/status";
export const getAuthStatus = (): Promise<AuthStatus> =>
  http.get(getAuthStatusKey);

export const setupAuth = (apiKey: string): Promise<boolean> =>
  http.post("/api/auth/setup", { apiKey });

export const signin = (apiKey: string): Promise<boolean> =>
  http.post("/api/auth/signin", { apiKey });
