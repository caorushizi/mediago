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

    // No apiKey — check if Go Core has auth configured
    getAuthStatus()
      .then((data) => {
        const status = data as Record<string, unknown>;
        if (status?.setuped) {
          // Password already set, user must sign in
          navigate("/signin");
        } else {
          // First time — go to signin page to set up password
          navigate("/signin");
        }
      })
      .catch(() => {
        // If auth check itself returns 401, the http interceptor will redirect
        // If Go Core is not ready yet, ignore
      });
  }, [apiKey, location.pathname]);
}
