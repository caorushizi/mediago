import { appStoreSelector, useAppStore } from "@/store/app";
import { isWeb } from "@/utils";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { getAuthStatus } from "@/api/auth";

export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { apiKey } = useAppStore(useShallow(appStoreSelector));

  useEffect(() => {
    if (!isWeb) return;
    if (location.pathname === "/signin") return;

    // If we already have an apiKey stored, no need to check
    if (apiKey) return;

    // No apiKey — check if Go Core has auth enabled
    getAuthStatus()
      .then((data) => {
        const status = data as Record<string, unknown>;
        // Auth is configured (setuped=true) but we have no apiKey → must sign in
        if (status?.initialized) {
          navigate("/signin");
        }
        // Auth not configured yet (first time) → go to signin to set up
        if (status?.enableAuth && !status?.initialized) {
          navigate("/signin");
        }
      })
      .catch(() => {
        // If auth check itself returns 401, the http interceptor will redirect
        // If Go Core is not ready yet, ignore
      });
  }, [apiKey, location.pathname]);
}
