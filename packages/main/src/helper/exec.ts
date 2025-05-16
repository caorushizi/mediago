import { DownloadContext, ExecOptions } from "../types.ts";
import * as pty from "node-pty";
import stripAnsi from "strip-ansi";
import i18n from "../i18n/index.ts";

export function execa({
  abortSignal,
  onMessage,
  binPath,
  args,
}: ExecOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const ptyProcess = pty.spawn(binPath, args, {
      name: "xterm-color",
      cols: 500,
      rows: 500,
      useConpty: false,
    });

    if (onMessage) {
      const ctx: DownloadContext = {
        ready: false,
        isLive: false,
        percent: "",
        speed: "",
      };
      ptyProcess.onData((data) => {
        try {
          onMessage(ctx, stripAnsi(data));
        } catch (err) {
          reject(err);
        }
      });
    }

    abortSignal.signal.addEventListener("abort", () => {
      ptyProcess.kill();
      reject(new Error("AbortError"));
    });

    ptyProcess.onExit(({ exitCode }) => {
      if (exitCode === 0) {
        resolve();
      } else {
        reject(new Error(i18n.t("unknownError")));
      }
    });
  });
}
