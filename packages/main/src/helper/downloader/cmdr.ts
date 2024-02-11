import { execa, Options } from "execa";
import iconv from "iconv-lite";

export interface CmdrParams {
  abortSignal: AbortController;
  encoding?: string;
  onMessage?: (message: string) => void;
  onErrMessage?: (message: string) => void;
}

export const cmdr = (
  binPath: string,
  args: string[],
  params: CmdrParams & Options,
): Promise<void> => {
  const {
    abortSignal,
    encoding = "utf-8",
    onMessage,
    onErrMessage,
    ...execOptions
  } = params;

  return new Promise((resolve, reject) => {
    const process = (data: Buffer, callback: (message: string) => void) => {
      const items = iconv.decode(data, encoding);
      items.split("\n").forEach((item) => {
        const message = item.trim();
        if (!message) return;
        try {
          console.log("message", message);
          callback(message);
        } catch (err) {
          reject(err);
        }
      });
    };

    const downloader = execa(binPath, args, {
      ...execOptions,
      signal: abortSignal.signal,
    });

    if (downloader.stdout && onMessage) {
      downloader.stdout.on("data", (data) => process(data, onMessage));
    }

    if (downloader.stderr && onErrMessage) {
      downloader.stderr.on("data", (data) => process(data, onErrMessage));
    }

    downloader.on("error", (err) => {
      reject(err);
    });

    downloader.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error("未知错误"));
      }
    });
  });
};
