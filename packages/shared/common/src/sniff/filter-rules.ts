import { DownloadType } from "../types";

/**
 * A single sniff rule.
 *
 * `matches` is evaluated against a request URL's pathname (m3u8/.mp4-like
 * direct media streams). `hosts` is evaluated against a whole page URL
 * (site-specific extractors like bilibili/youtube that do not expose a
 * matchable media suffix).
 */
export interface SniffFilter {
  /** Patterns tested against a full page URL. */
  hosts?: RegExp[];
  /** Patterns tested against a request URL's pathname. */
  matches?: RegExp[];
  /** Which downloader to dispatch when the rule fires. */
  type: DownloadType;
  /** Optional hints for extracting display fields from the source context. */
  schema?: Record<string, string>;
}

/**
 * Canonical sniff rule list — shared by the Electron webview sniffing
 * helper and the browser extension's background worker so both surfaces
 * stay in lock-step.
 */
export const SNIFF_FILTERS: SniffFilter[] = [
  {
    matches: [/\.m3u8/],
    type: DownloadType.m3u8,
  },
  {
    // TODO: Collections, lists, favorites
    hosts: [/^https?:\/\/(www\.)?bilibili.com\/video/],
    type: DownloadType.bilibili,
    schema: {
      name: "title",
    },
  },
  {
    // Match actual video / short / live / embed URLs — not the homepage
    // or subscription feed, which would produce spurious "source found"
    // detections on every navigation.
    hosts: [
      /^https?:\/\/(www\.|m\.|music\.)?youtube\.com\/(watch\?|shorts\/|live\/|embed\/)/,
      /^https?:\/\/youtu\.be\/[^/?#]+/,
    ],
    type: DownloadType.youtube,
    schema: {
      name: "title",
    },
  },
  {
    matches: [
      /\.(mp4|flv|mov|avi|mkv|wmv|m4a|ogg|m4b|m4p|m4r|m4b|m4p|m4r)(?![a-zA-Z])/,
    ],
    type: DownloadType.direct,
  },
];

/**
 * Test a request URL (path-level) against every rule with a `matches`
 * entry. Returns the first matching rule, or undefined.
 */
export function matchRequestUrl(requestUrl: string): SniffFilter | undefined {
  let pathname: string;
  try {
    pathname = new URL(requestUrl).pathname;
  } catch {
    return undefined;
  }
  for (const filter of SNIFF_FILTERS) {
    if (!filter.matches) continue;
    for (const match of filter.matches) {
      if (match.test(pathname)) return filter;
    }
  }
  return undefined;
}

/**
 * Test a document/page URL against every rule with a `hosts` entry.
 * Returns the first matching rule, or undefined.
 */
export function matchPageUrl(pageUrl: string): SniffFilter | undefined {
  for (const filter of SNIFF_FILTERS) {
    if (!filter.hosts) continue;
    for (const host of filter.hosts) {
      if (host.test(pageUrl)) return filter;
    }
  }
  return undefined;
}
