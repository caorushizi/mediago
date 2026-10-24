import {
  DownloadType,
  type ShareIntent,
  type ShareIntentInput,
} from "../types";

export const SHARE_INTENT_VERSION = 1 as const;
export const SHARE_INTENT_TTL_MS = 15 * 60 * 1000;
export const SHARE_INTENT_MAX_URL_LENGTH = 16 * 1024;
export const SHARE_INTENT_MAX_NAME_LENGTH = 512;
export const SHARE_INTENT_MAX_TEXT_LENGTH = 64 * 1024;

const DOWNLOAD_TYPES = new Set<string>(Object.values(DownloadType));
const WEB_PROTOCOLS = new Set(["http:", "https:"]);
const ELECTRON_PROTOCOLS = new Set(["http:", "https:", "file:", "magnet:"]);
const EXTRACT_HTTP_URL_RE = /https?:\/\/[^\s<>"']+/i;

export interface NormalizeShareIntentOptions {
  allowedProtocols?: ReadonlySet<string>;
  now?: number;
}

export const WEB_SHARE_PROTOCOLS: ReadonlySet<string> = WEB_PROTOCOLS;
export const ELECTRON_SHARE_PROTOCOLS: ReadonlySet<string> = ELECTRON_PROTOCOLS;

function createIntentId(now: number): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isSupportedProtocol(
  value: string,
  allowedProtocols: ReadonlySet<string>,
): boolean {
  try {
    return allowedProtocols.has(new URL(value).protocol.toLowerCase());
  } catch {
    return false;
  }
}

export function isDownloadType(
  value: string | null | undefined,
): value is DownloadType {
  return Boolean(value && DOWNLOAD_TYPES.has(value));
}

export function inferDownloadType(value: string): DownloadType {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    if (
      hostname === "b23.tv" ||
      hostname === "bilibili.com" ||
      hostname.endsWith(".bilibili.com")
    ) {
      return DownloadType.bilibili;
    }
    if (
      hostname === "youtu.be" ||
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com")
    ) {
      return DownloadType.youtube;
    }
    if (isSupportedShortVideoURL(hostname, pathname)) {
      return DownloadType.youtube;
    }
    if (isSupportedXiaohongshuURL(hostname, pathname)) {
      return DownloadType.xiaohongshu;
    }
    if (
      (hostname === "x.com" ||
        hostname.endsWith(".x.com") ||
        hostname === "twitter.com" ||
        hostname.endsWith(".twitter.com")) &&
      /^\/[^/]+\/status\/\d+(?:\/|$)/.test(pathname)
    ) {
      return DownloadType.youtube;
    }
    if (pathname.endsWith(".m3u8")) return DownloadType.m3u8;
  } catch {
    // Invalid values are rejected by normalizeShareIntent.
  }
  return DownloadType.direct;
}

function isSupportedXiaohongshuURL(
  hostname: string,
  pathname: string,
): boolean {
  if (hostname === "xhslink.com" || hostname.endsWith(".xhslink.com")) {
    return pathname !== "/";
  }
  if (
    hostname !== "xiaohongshu.com" &&
    !hostname.endsWith(".xiaohongshu.com")
  ) {
    return false;
  }
  return (
    /^\/(?:explore|discovery\/item)\/[^/]+(?:\/|$)/.test(pathname) ||
    /^\/user\/profile\/[^/]+\/[^/]+(?:\/|$)/.test(pathname)
  );
}

function isSupportedShortVideoURL(hostname: string, pathname: string): boolean {
  if (
    hostname === "vm.tiktok.com" ||
    hostname === "vt.tiktok.com" ||
    hostname === "v.douyin.com"
  ) {
    return pathname !== "/";
  }

  if (
    hostname === "tiktok.com" ||
    hostname === "www.tiktok.com" ||
    hostname === "m.tiktok.com" ||
    hostname === "tiktokv.com" ||
    hostname === "www.tiktokv.com"
  ) {
    return (
      /^\/@[^/]+\/video\/\d+(?:\/|$)/.test(pathname) ||
      /^\/share\/video\/\d+(?:\/|$)/.test(pathname) ||
      /^\/t\/[a-z0-9_-]+(?:\/|$)/i.test(pathname)
    );
  }

  return (
    (hostname === "douyin.com" || hostname === "www.douyin.com") &&
    /^\/video\/\d+(?:\/|$)/.test(pathname)
  );
}

export function extractFirstHttpUrl(
  text: string | null | undefined,
): string | undefined {
  if (!text || text.length > SHARE_INTENT_MAX_TEXT_LENGTH) return undefined;
  const match = text.match(EXTRACT_HTTP_URL_RE)?.[0];
  if (!match) return undefined;
  let end = match.length;
  while (end > 0 && "),.;!?".includes(match[end - 1])) end--;
  const url = match.slice(0, end);
  return url.length <= SHARE_INTENT_MAX_URL_LENGTH ? url : undefined;
}

export function normalizeShareIntent(
  input: ShareIntentInput,
  options: NormalizeShareIntentOptions = {},
): ShareIntent | null {
  const url = input.url?.trim();
  const allowedProtocols = options.allowedProtocols ?? WEB_SHARE_PROTOCOLS;
  if (
    !url ||
    url.length > SHARE_INTENT_MAX_URL_LENGTH ||
    !isSupportedProtocol(url, allowedProtocols)
  ) {
    return null;
  }

  const now = options.now ?? Date.now();
  const normalizedType = input.type?.trim().toLowerCase();
  const name = input.name?.trim().slice(0, SHARE_INTENT_MAX_NAME_LENGTH);

  return {
    id: input.id || createIntentId(now),
    version: SHARE_INTENT_VERSION,
    source: input.source,
    createdAt: input.createdAt ?? now,
    url,
    name: name || undefined,
    type: isDownloadType(normalizedType)
      ? normalizedType
      : inferDownloadType(url),
    warning: input.warning,
  };
}

export function isFreshShareIntent(
  intent: ShareIntent,
  now = Date.now(),
): boolean {
  return now - intent.createdAt <= SHARE_INTENT_TTL_MS;
}
