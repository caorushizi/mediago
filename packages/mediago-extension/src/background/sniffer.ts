import { matchPageUrl, matchRequestUrl } from "@mediago/shared-common";
import type { DetectedSource } from "@/shared/types";
import { clearTabSources, loadTabSources, saveTabSources } from "./storage";

/**
 * Turn `chrome.webRequest.HttpHeader[]` into the JSON string format
 * the MediaGo downloader expects (a JSON object of header → value).
 */
function formatHeaders(
  headers: chrome.webRequest.HttpHeader[] | undefined,
): string | undefined {
  if (!headers || headers.length === 0) return undefined;
  const parts: Record<string, string> = {};
  for (const h of headers) {
    if (!h.name) continue;
    parts[h.name] = h.value ?? "";
  }
  return JSON.stringify(parts);
}

/** Dedup by URL — same link captured twice in one page view is one source. */
function dedupKey(url: string): string {
  return url;
}

async function updateBadge(tabId: number, count: number): Promise<void> {
  if (count > 0) {
    await chrome.action.setBadgeBackgroundColor({
      tabId,
      color: "#ef4444",
    });
    await chrome.action.setBadgeText({
      tabId,
      text: String(count),
    });
  } else {
    await chrome.action.setBadgeText({ tabId, text: "" });
  }
}

async function addSource(tabId: number, source: DetectedSource): Promise<void> {
  const existing = await loadTabSources(tabId);
  const key = dedupKey(source.url);
  if (existing.some((s) => dedupKey(s.url) === key)) return;
  const next = [...existing, source];
  await saveTabSources(tabId, next);
  await updateBadge(tabId, next.length);
}

/* --------------------- request-level (m3u8 / mp4) --------------------- */

/**
 * Called for every outbound request across all tabs. Matches against
 * the `matches` filters (pathname-based — `.m3u8`, `.mp4`, etc.) and
 * appends the detection to the per-tab source list.
 *
 * We use `onSendHeaders` (not `onBeforeRequest`) because it's the same
 * phase the Electron side sniffs on, so filter semantics stay identical.
 */
async function handleRequest(
  details: chrome.webRequest.OnSendHeadersDetails,
): Promise<void> {
  // tabId -1 means the request isn't tied to a tab (e.g. extension
  // itself, background fetch). Ignore — the user can't act on these.
  if (details.tabId < 0) return;

  const filter = matchRequestUrl(details.url);
  if (!filter) return;

  let documentURL = details.initiator ?? "";
  let pageTitle = "";
  try {
    const tab = await chrome.tabs.get(details.tabId);
    documentURL = tab.url ?? documentURL;
    pageTitle = tab.title ?? "";
  } catch {
    /* tab might have closed between event and lookup; best-effort */
  }

  await addSource(details.tabId, {
    id: `${details.requestId}-${Date.now()}`,
    url: details.url,
    documentURL,
    name: pageTitle,
    type: filter.type,
    headers: formatHeaders(details.requestHeaders),
    detectedAt: Date.now(),
  });
}

/* --------------------- page-level (bilibili / youtube) --------------------- */

/**
 * Called whenever a tab's URL settles (navigation complete). Matches
 * against the `hosts` filters — sites that don't expose a direct media
 * URL, but for which MediaGo dispatches a specialised extractor
 * (BBDown for Bilibili, yt-dlp for YouTube). The "source" we push is
 * the page URL itself; downstream the downloader handles resolution.
 *
 * Electron uses `checkPageInfo()` in sniffing-helper.service.ts for
 * the same purpose.
 */
async function checkPageInfo(
  tabId: number,
  tab: chrome.tabs.Tab,
): Promise<void> {
  const pageUrl = tab.url;
  if (!pageUrl) return;
  const filter = matchPageUrl(pageUrl);
  if (!filter) return;

  await addSource(tabId, {
    id: `page-${tabId}-${Date.now()}`,
    url: pageUrl,
    documentURL: pageUrl,
    name: tab.title ?? pageUrl,
    type: filter.type,
    detectedAt: Date.now(),
  });
}

/* --------------------------------------------------------------------- */

/**
 * Wire up all tab-level listeners. Must be called once at worker start;
 * MV3 service workers are re-spawned aggressively so we register at the
 * top level of background/index.ts, not lazily.
 */
export function registerSniffer(): void {
  chrome.webRequest.onSendHeaders.addListener(
    (details) => {
      // Fire-and-forget; webRequest doesn't care about async returns.
      void handleRequest(details);
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"],
  );

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // A top-level URL change = new page. Clear stale sources first so
    // sites with client-side routing (YouTube SPA navigation!) don't
    // leak detections from the previous video into the next one.
    if (changeInfo.url) {
      await clearTabSources(tabId);
      await updateBadge(tabId, 0);
    }
    // Emit the page-level detection when the title is known — waiting
    // for `status === "complete"` avoids capturing the empty title
    // shown during the initial navigation.
    if (changeInfo.status === "complete" || changeInfo.title) {
      await checkPageInfo(tabId, tab);
    }
  });

  // Tab closed → drop its entry so we don't accumulate stale data.
  chrome.tabs.onRemoved.addListener(async (tabId) => {
    await clearTabSources(tabId);
  });
}
