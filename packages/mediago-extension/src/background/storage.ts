import {
  DEFAULT_SETTINGS,
  STORAGE_KEY_SETTINGS,
  storageKeyTab,
} from "@/shared/constants";
import type { DetectedSource, ExtensionSettings } from "@/shared/types";

/* ---------------- settings ---------------- */

export async function loadSettings(): Promise<ExtensionSettings> {
  const raw = await chrome.storage.local.get(STORAGE_KEY_SETTINGS);
  const stored = raw[STORAGE_KEY_SETTINGS] as
    | Partial<ExtensionSettings>
    | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: settings });
}

/* ---------------- per-tab sources ---------------- */

export async function loadTabSources(tabId: number): Promise<DetectedSource[]> {
  const key = storageKeyTab(tabId);
  const raw = await chrome.storage.session.get(key);
  return (raw[key] as DetectedSource[] | undefined) ?? [];
}

export async function saveTabSources(
  tabId: number,
  sources: DetectedSource[],
): Promise<void> {
  const key = storageKeyTab(tabId);
  await chrome.storage.session.set({ [key]: sources });
}

export async function clearTabSources(tabId: number): Promise<void> {
  await chrome.storage.session.remove(storageKeyTab(tabId));
}
