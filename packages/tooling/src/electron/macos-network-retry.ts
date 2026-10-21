/* eslint-disable no-await-in-loop -- Backoff attempts must run sequentially and stop at the first success. */
import { setTimeout as sleep } from "node:timers/promises";

export function isAppleNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message;
  if (
    /(?:HTTP|status(?: code)?)\s*[:=]?\s*(?:401|403)\b|"status"\s*:\s*"(?:Invalid|Rejected)"|invalid (?:code )?signature|ticket (?:is )?revoked/i.test(
      message,
    )
  )
    return false;
  return (
    /stapl(?:e|er|ing)|notarytool|notariz|apple-cloudkit/i.test(message) &&
    /NSURLErrorDomain[\s\S]*?Code\s*=\s*-(?:1001|1003|1004|1005|1006|1009)\b|(?:ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENETUNREACH)\b/i.test(
      message,
    )
  );
}

export async function withAppleNetworkRetry<T>(
  operation: () => T | Promise<T>,
  options: {
    label: string;
    attempts?: number;
    sleep?: (milliseconds: number) => Promise<unknown>;
    report?: (message: string) => void;
  },
): Promise<T> {
  const attempts = options.attempts ?? 5;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 5) {
    throw new Error("Apple network retry attempts must be between 1 and 5");
  }
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= attempts || !isAppleNetworkError(error)) throw error;
      const delay = Math.min(15_000 * 2 ** (attempt - 1), 120_000);
      const report =
        options.report ?? ((message: string) => process.stderr.write(message));
      report(
        "[macos-signing] " +
          options.label +
          ": Apple network error; retry " +
          (attempt + 1) +
          "/" +
          attempts +
          " in " +
          delay / 1000 +
          "s\n",
      );
      await (options.sleep ?? sleep)(delay);
    }
  }
}
