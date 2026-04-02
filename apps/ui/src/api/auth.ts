import { http } from "@/utils";

export interface AuthStatus {
  setuped: boolean;
}

export const getAuthStatusKey = "/api/auth/status";
export const getAuthStatus = (): Promise<AuthStatus> =>
  http.get(getAuthStatusKey);

export const setupAuth = (password: string): Promise<string> =>
  http.post("/api/auth/setup", { password });

export const signin = (password: string): Promise<string> =>
  http.post("/api/auth/signin", { password });
