import { Platform } from "../../common/types/index.ts";
import { DownloadSchema } from "../types/index.ts";

// FIXME: Multilingual regular expressions
export const downloadSchemaList: DownloadSchema[] = [
  {
    type: "m3u8",
    platform: [Platform.MacOS, Platform.Linux, Platform.Windows],
    args: {
      url: {
        argsName: null,
      },
      localDir: {
        argsName: ["--tmp-dir", "--save-dir"],
      },
      name: {
        argsName: ["--save-name"],
      },
      headers: {
        argsName: ["--header"],
      },
      deleteSegments: {
        argsName: ["--del-after-done"],
      },
      proxy: {
        argsName: ["--custom-proxy"],
      },
      __common__: {
        argsName: [
          "--no-log",
          "--auto-select",
          "--ui-language",
          "zh-CN",
          "--live-real-time-merge",
          "--check-segments-count",
          "false",
        ],
      },
    },
    consoleReg: {
      percent: "([\\d.]+)%",
      speed: "([\\d.]+[GMK]Bps)",
      error: "ERROR",
      start: "保存文件名:",
      isLive: "检测到直播流",
    },
  },
  {
    type: "bilibili",
    platform: [Platform.Linux, Platform.MacOS, Platform.Windows],
    args: {
      url: {
        argsName: null,
      },
      localDir: {
        argsName: ["--work-dir"],
      },
      name: {
        argsName: ["--file-pattern"],
      },
    },
    consoleReg: {
      speed: "([\\d.]+\\s[GMK]B/s)",
      percent: "([\\d.]+)%",
      error: "ERROR",
      start: "开始下载",
      isLive: "检测到直播流",
    },
  },
  {
    type: "direct",
    platform: [Platform.Linux, Platform.MacOS, Platform.Windows],
    args: {
      localDir: {
        argsName: ["-D"],
      },
      name: {
        argsName: ["-N"],
        postfix: "@@AUTO@@",
      },
      url: {
        argsName: null,
      },
    },
    consoleReg: {
      percent: "([\\d.]+)%",
      speed: "([\\d.]+[GMK]B/s)",
      error: "fail",
      start: "downloading...",
      isLive: "检测到直播流",
    },
  },
];
