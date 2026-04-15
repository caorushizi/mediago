import type { ExtensionMessage, ExtensionResponse } from "@/shared/types";
import { importSources, probe } from "./mediago-client";
import {
  clearTabSources,
  loadSettings,
  loadTabSources,
  saveSettings,
} from "./storage";

/**
 * Central message router used by the popup and options page.
 *
 * Return type is intentionally a Promise so we can use
 * `chrome.runtime.onMessage`'s `sendResponse` with `return true`
 * semantics cleanly via an async wrapper.
 */
async function handle(message: ExtensionMessage): Promise<ExtensionResponse> {
  switch (message.type) {
    case "GET_SOURCES": {
      const sources = await loadTabSources(message.tabId);
      return { type: "SOURCES", sources };
    }
    case "CLEAR_SOURCES": {
      await clearTabSources(message.tabId);
      await chrome.action.setBadgeText({ tabId: message.tabId, text: "" });
      return { type: "OK" };
    }
    case "GET_SETTINGS": {
      const settings = await loadSettings();
      return { type: "SETTINGS", settings };
    }
    case "SAVE_SETTINGS": {
      await saveSettings(message.settings);
      return { type: "OK" };
    }
    case "TEST_CONNECTION": {
      const status = await probe(
        message.mode,
        message.serverUrl,
        message.apiKey || undefined,
      );
      return { type: "STATUS", status };
    }
    case "IMPORT_SOURCES": {
      const settings = await loadSettings();
      const result = await importSources(settings, message.sources);
      return {
        type: "IMPORT_RESULT",
        ok: result.ok,
        count: result.count,
        error: result.error,
      };
    }
  }
}

export function registerMessageRouter(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // `handle` returns a promise; we funnel it into sendResponse and
    // return `true` to keep the channel open (MV3 requirement).
    void handle(message as ExtensionMessage)
      .then(sendResponse)
      .catch((err) => {
        sendResponse({
          type: "IMPORT_RESULT",
          ok: false,
          count: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    return true;
  });
}
