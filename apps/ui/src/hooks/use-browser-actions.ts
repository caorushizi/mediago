import { useMemoizedFn } from "ahooks";
import { useShallow } from "zustand/react/shallow";
import { OPEN_URL } from "@/const";
import { setBrowserSelector, useBrowserStore, PageMode } from "@/store/browser";
import { generateUrl, tdApp } from "@/utils";
import { usePlatform } from "./use-platform";

export function useBrowserActions() {
  const { browser } = usePlatform();
  const { startNavigation, setBrowserStore } = useBrowserStore(
    useShallow(setBrowserSelector),
  );

  const loadUrl = useMemoizedFn((url: string) => {
    tdApp.onEvent(OPEN_URL);
    startNavigation(url);
    browser.loadURL(url);
  });

  const goto = useMemoizedFn((currentUrl: string) => {
    const link = generateUrl(currentUrl);
    loadUrl(link);
  });

  const goHome = useMemoizedFn(async () => {
    await browser.home();
    setBrowserStore({ url: "", title: "", mode: PageMode.Default });
  });

  return { loadUrl, goto, goHome };
}
