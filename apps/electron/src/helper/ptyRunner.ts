import { i18n } from "@mediago/shared/common";
import type { RunnerOptions } from "@mediago/shared/node";
import * as pty from "node-pty";
import stripAnsi from "strip-ansi";

export function ptyRunner<T>({ abortController, onMessage, binPath, args, ctx }: RunnerOptions<T>): Promise<void> {
  return new Promise((resolve, reject) => {
    const ptyProcess = pty.spawn(binPath, args, {
      name: "xterm-color",
      cols: 500,
      rows: 500,
      useConpty: false,
    });

    if (onMessage) {
      ptyProcess.onData((data) => {
        try {
          onMessage(ctx, stripAnsi(data));
        } catch (err) {
          reject(err);
        }
      });
    }

    abortController.signal.addEventListener("abort", () => {
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
