import { useEffect, useState } from "react";
import { PAGE_LOAD } from "../const";
import {
  canLoadProtectedConfig,
  initializeAdapter,
} from "../services/adapter-bootstrap";
import { useAppStore } from "../store/app";
import { tdApp } from "../utils";
import { useConfigReconciliation } from "./use-config-reconciliation";

export function useAdapterBootstrap() {
  const apiKey = useAppStore((state) => state.apiKey);
  const [adapterReady, setAdapterReady] = useState(false);
  const { applyInitialConfig, beginInitialConfigLoad } =
    useConfigReconciliation();

  useEffect(() => {
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;
    beginInitialConfigLoad();

    const initialize = () => {
      void initializeAdapter().then((config) => {
        if (!active) return;
        setAdapterReady(true);

        if (!config) {
          if (!canLoadProtectedConfig()) return;
          retryTimer = setTimeout(initialize, 1000);
          return;
        }

        applyInitialConfig(config);
      });
    };

    initialize();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [apiKey]);

  useEffect(() => {
    if (!adapterReady) return;
    tdApp.onEvent(PAGE_LOAD);
  }, [adapterReady]);

  return adapterReady;
}
