import { expect, test } from "vitest";
import { DownloadType } from "../types";
import {
  SHARE_INTENT_MAX_TEXT_LENGTH,
  ELECTRON_SHARE_PROTOCOLS,
  WEB_SHARE_PROTOCOLS,
  extractFirstHttpUrl,
  inferDownloadType,
  isFreshShareIntent,
  normalizeShareIntent,
} from "./share-intent";

test("infers download types from parsed hostnames and paths", () => {
  expect(inferDownloadType("https://www.bilibili.com/video/BV1")).toBe(
    DownloadType.bilibili,
  );
  expect(inferDownloadType("https://youtu.be/example")).toBe(
    DownloadType.youtube,
  );
  expect(inferDownloadType("https://x.com/openai/status/1234567890")).toBe(
    DownloadType.youtube,
  );
  expect(
    inferDownloadType("https://twitter.com/openai/status/1234567890"),
  ).toBe(DownloadType.youtube);
  expect(
    inferDownloadType(
      "https://www.tiktok.com/@creator/video/7480123456789012345",
    ),
  ).toBe(DownloadType.youtube);
  expect(
    inferDownloadType(
      "https://m.tiktok.com/@creator/video/7480123456789012345",
    ),
  ).toBe(DownloadType.youtube);
  expect(inferDownloadType("https://vm.tiktok.com/ZTR45GpSF/")).toBe(
    DownloadType.youtube,
  );
  expect(
    inferDownloadType("https://www.douyin.com/video/7480123456789012345"),
  ).toBe(DownloadType.youtube);
  expect(inferDownloadType("https://v.douyin.com/iF123AbC/")).toBe(
    DownloadType.youtube,
  );
  expect(
    inferDownloadType(
      "https://www.xiaohongshu.com/explore/66f00abc1234567890abcdef?xsec_token=token",
    ),
  ).toBe(DownloadType.xiaohongshu);
  expect(inferDownloadType("https://xhslink.com/a1B2c3D4")).toBe(
    DownloadType.xiaohongshu,
  );
  expect(inferDownloadType("https://www.xiaohongshu.com/explore")).toBe(
    DownloadType.direct,
  );
  expect(inferDownloadType("https://www.tiktok.com/@creator/live")).toBe(
    DownloadType.direct,
  );
  expect(inferDownloadType("https://www.douyin.com/user/example")).toBe(
    DownloadType.direct,
  );
  expect(
    inferDownloadType("https://media.example/live/index.m3u8?token=abc"),
  ).toBe(DownloadType.m3u8);
  expect(
    inferDownloadType("https://example.com/video.mp4?next=bilibili.com"),
  ).toBe(DownloadType.direct);
});

test("normalizes supported share intents and rejects unsafe web protocols", () => {
  const intent = normalizeShareIntent(
    {
      id: "intent-1",
      source: "web",
      createdAt: 100,
      url: " https://example.com/video.mp4?token=a&b=c ",
      name: " Episode 1 ",
      type: "M3U8",
    },
    { allowedProtocols: WEB_SHARE_PROTOCOLS, now: 100 },
  );

  expect(intent).toStrictEqual({
    id: "intent-1",
    version: 1,
    source: "web",
    createdAt: 100,
    url: "https://example.com/video.mp4?token=a&b=c",
    name: "Episode 1",
    type: DownloadType.m3u8,
    warning: undefined,
  });
  expect(
    normalizeShareIntent(
      { source: "web", url: "file:///C:/private/video.mp4" },
      { allowedProtocols: WEB_SHARE_PROTOCOLS },
    ),
  ).toBe(null);
  expect(
    normalizeShareIntent(
      { source: "electron", url: "file:///C:/video.mp4" },
      { allowedProtocols: ELECTRON_SHARE_PROTOCOLS },
    ),
  ).not.toBe(null);
});

test("extracts shared URLs and expires stale intents", () => {
  expect(
    extractFirstHttpUrl("Watch this: https://example.com/video.m3u8)."),
  ).toBe("https://example.com/video.m3u8");

  const intent = normalizeShareIntent(
    {
      id: "intent-2",
      source: "web",
      createdAt: 1_000,
      url: "https://example.com/video.mp4",
    },
    { now: 1_000 },
  );
  if (!intent) {
    throw new Error("Expected a normalized share intent");
  }
  expect(isFreshShareIntent(intent, 1_001)).toBe(true);
  expect(isFreshShareIntent(intent, 1_000 + 16 * 60 * 1_000)).toBe(false);
});

test("trims shared URL punctuation in linear time and bounds untrusted text", () => {
  const suffix = "!".repeat(20_000);
  expect(
    extractFirstHttpUrl("https://media.lan/movie.m3u8" + suffix + "x"),
  ).toBeUndefined();
  expect(extractFirstHttpUrl("https://media.lan/movie.m3u8" + suffix)).toBe(
    "https://media.lan/movie.m3u8",
  );
  expect(
    extractFirstHttpUrl("prefix ".repeat(SHARE_INTENT_MAX_TEXT_LENGTH)),
  ).toBeUndefined();
  expect(extractFirstHttpUrl("https://nas.lan/a?token=a!b)")).toBe(
    "https://nas.lan/a?token=a!b",
  );
  expect(extractFirstHttpUrl("http://192.168.1.5:8080/live.m3u8")).toBe(
    "http://192.168.1.5:8080/live.m3u8",
  );
});
