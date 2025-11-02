import { isWeb } from "@/utils";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useAuth() {
  const navigation = useNavigate();
  useEffect(() => {
    console.log("useAuth check");
    if (!isWeb) {
      return;
    }
    const apiKey = Cookies.get("name");
    if (!apiKey && window.location.pathname !== "/signin") {
      navigation("/signin");
    }
  }, []);
}
