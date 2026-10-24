import { useMemoizedFn } from "ahooks";
import { toast } from "@/components/ui/toast";
import { useShallow } from "zustand/react/shallow";
import { OPEN_URL } from "@/const";
import { browserActionsSelector, useBrowserStore } from "@/store/browser";
import { generateUrl, tdApp } from "@/utils";
import { usePlatform } from "./use-platform";

export function useBrowserActions() {
  const { browser } = usePlatform();
  const {
    activateTab: activateLocalTab,
    addTab,
    closeTab: closeLocalTab,
    hydrateSnapshot,
    startNavigation,
    updateTab,
  } = useBrowserStore(useShallow(browserActionsSelector));

  const loadUrl = useMemoizedFn(async (url: string, tabId?: string) => {
    const targetTabId = tabId || useBrowserStore.getState().activeTabId;
    tdApp.onEvent(OPEN_URL);
    startNavigation(targetTabId, url);
    try {
      await browser.loadURL(targetTabId, url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to open browser tab";
      updateTab(targetTabId, {
        status: "failed",
        errorMessage: message,
      });
      toast.add({ title: message, type: "error" });
    }
  });

  const goto = useMemoizedFn(async (currentUrl: string, tabId?: string) => {
    await loadUrl(generateUrl(currentUrl), tabId);
  });

  const createTab = useMemoizedFn(async (url?: string) => {
    try {
      const tab = await browser.createTab();
      addTab(tab);
      if (url) await loadUrl(url, tab.id);
      return tab.id;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create browser tab";
      toast.add({ title: message, type: "error" });
      return undefined;
    }
  });

  const activateTab = useMemoizedFn(async (tabId: string) => {
    activateLocalTab(tabId);
    try {
      hydrateSnapshot(await browser.activateTab(tabId));
    } catch {
      hydrateSnapshot(await browser.getTabs());
    }
  });

  const closeTab = useMemoizedFn(async (tabId?: string) => {
    const targetTabId = tabId || useBrowserStore.getState().activeTabId;
    closeLocalTab(targetTabId);
    try {
      hydrateSnapshot(await browser.closeTab(targetTabId));
    } catch {
      hydrateSnapshot(await browser.getTabs());
    }
  });

  const goHome = useMemoizedFn(async (tabId?: string) => {
    const targetTabId = tabId || useBrowserStore.getState().activeTabId;
    await browser.home(targetTabId);
    updateTab(targetTabId, {
      url: "",
      title: "",
      mode: "home",
      status: "default",
      errorCode: undefined,
      errorMessage: undefined,
    });
    useBrowserStore.getState().clearSources(targetTabId);
  });

  const goBack = useMemoizedFn(async (tabId?: string) => {
    const targetTabId = tabId || useBrowserStore.getState().activeTabId;
    const navigated = await browser.back(targetTabId);
    if (!navigated) await goHome(targetTabId);
    return navigated;
  });

  const reload = useMemoizedFn(async (tabId?: string) => {
    const targetTabId = tabId || useBrowserStore.getState().activeTabId;
    updateTab(targetTabId, { status: "loading" });
    await browser.reload(targetTabId);
  });

  return {
    activateTab,
    closeTab,
    createTab,
    goBack,
    goHome,
    goto,
    loadUrl,
    reload,
  };
}
