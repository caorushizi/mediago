import type { TFunction } from "i18next";

import type { LocalizedMessage } from "@/shared/types";

/**
 * Render a value that may be either a raw string (already human-readable,
 * typically surfaced from the server / network stack) or a translation
 * descriptor emitted by our own background code. Centralised so every
 * consumer (toast, status badge, test-connection hint) agrees on the
 * shape.
 */
export function renderLocalized(
  t: TFunction,
  value: LocalizedMessage | string | undefined,
  fallbackKey?: string,
): string {
  if (value === undefined) {
    return fallbackKey ? t(fallbackKey) : "";
  }
  if (typeof value === "string") return value;
  return t(value.key, value.values);
}
