import { IpcEvent, type AnalyticsConsent } from "@mediago/common";
import { isWeb } from "../environment";
import { platformApi } from "../hooks/adapters";
import { tdApp } from "../utils/tdapp";

export const ANALYTICS_CONSENT_KEY = "mediago.analytics-consent.v1";

type ConsentSnapshot = AnalyticsConsent & { loaded: boolean; saving: boolean };

export interface AnalyticsConsentDependencies {
  read(): Promise<unknown>;
  write(enabled: boolean): Promise<unknown>;
  listen(listener: (value: unknown) => void): void;
  enable(): void;
  disable(): void;
  hasLoadedSDK(): boolean;
  reload(): void;
}

export function normalizeAnalyticsConsent(input: unknown): AnalyticsConsent {
  const value =
    input && typeof input === "object" && "code" in input
      ? (input as { data?: unknown }).data
      : input;
  if (
    value &&
    typeof value === "object" &&
    "enabled" in value &&
    "decided" in value
  ) {
    const consent = value as AnalyticsConsent;
    if (consent.decided === true && typeof consent.enabled === "boolean") {
      return { enabled: consent.enabled, decided: true };
    }
  }
  return { enabled: false, decided: false };
}

export function createAnalyticsConsent(
  dependencies: AnalyticsConsentDependencies,
) {
  let state: ConsentSnapshot = {
    enabled: false,
    decided: false,
    loaded: false,
    saving: false,
  };
  let initialization: Promise<void> | undefined;
  let revision = 0;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const apply = (input: unknown) => {
    const consent = normalizeAnalyticsConsent(input);
    const reload =
      state.enabled && !consent.enabled && dependencies.hasLoadedSDK();
    state = { ...consent, loaded: true, saving: state.saving };
    if (consent.enabled) dependencies.enable();
    else dependencies.disable();
    notify();
    // Removing a script does not stop an SDK's existing timers. Destroy the
    // renderer document after persisting refusal, including in other windows.
    if (reload) dependencies.reload();
  };

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    initialize() {
      initialization ??= (async () => {
        dependencies.listen((value) => {
          revision += 1;
          apply(value);
        });
        const startRevision = revision;
        let value: unknown;
        try {
          value = await dependencies.read();
        } catch {
          /* Stay disabled. */
        }
        if (revision === startRevision) apply(value);
      })();
      return initialization;
    },
    async choose(enabled: boolean) {
      if (state.saving) return;
      revision += 1;
      state = { ...state, saving: true };
      notify();
      try {
        const result = normalizeAnalyticsConsent(
          await dependencies.write(enabled),
        );
        if (!result.decided || result.enabled !== enabled)
          throw new Error("Analytics preference was not saved");
        apply(result);
      } finally {
        state = { ...state, saving: false };
        notify();
      }
    },
  };
}

function browserConsent(value: string | null): AnalyticsConsent {
  return { enabled: value === "1", decided: value === "1" || value === "0" };
}

export const analyticsConsent = createAnalyticsConsent({
  read: async () =>
    isWeb
      ? browserConsent(localStorage.getItem(ANALYTICS_CONSENT_KEY))
      : platformApi.analytics.getConsent(),
  write: async (enabled) => {
    if (!isWeb) return platformApi.analytics.setConsent(enabled);
    localStorage.setItem(ANALYTICS_CONSENT_KEY, enabled ? "1" : "0");
    return browserConsent(localStorage.getItem(ANALYTICS_CONSENT_KEY));
  },
  listen: (listener) => {
    if (isWeb) {
      window.addEventListener("storage", (event) => {
        if (event.key === ANALYTICS_CONSENT_KEY || event.key === null) {
          listener(browserConsent(event.key === null ? null : event.newValue));
        }
      });
    } else {
      platformApi.on(IpcEvent.app.analyticsConsentChanged, (...args) =>
        listener(args[args.length - 1]),
      );
    }
  },
  enable: () => tdApp.init(true),
  disable: () => tdApp.disable(),
  hasLoadedSDK: () => tdApp.loaded,
  reload: () => window.location.reload(),
});
