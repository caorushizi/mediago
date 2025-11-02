import { appStoreSelector, useAppStore } from "@/store/app";
import { isWeb } from "@/utils";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export function useAuth() {
  const navigation = useNavigate();
  const { apiKey } = useAppStore(useShallow(appStoreSelector));
  useEffect(() => {
    if (!isWeb) {
      return;
    }

    if (!apiKey && window.location.pathname !== "/signin") {
      navigation("/signin");
    }
  }, [apiKey]);
}
