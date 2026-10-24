import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { AnalyticsConsent } from "@mediago/common";

export class AnalyticsConsentStore {
  constructor(private readonly filename: string) {}

  get(): AnalyticsConsent {
    try {
      if (fs.statSync(this.filename).size > 8)
        return { enabled: false, decided: false };
      const value = fs.readFileSync(this.filename, "utf8").trim();
      return {
        enabled: value === "1",
        decided: value === "1" || value === "0",
      };
    } catch {
      return { enabled: false, decided: false };
    }
  }

  set(enabled: boolean): AnalyticsConsent {
    if (typeof enabled !== "boolean")
      throw new TypeError("Analytics consent must be a boolean");
    fs.mkdirSync(path.dirname(this.filename), { recursive: true, mode: 0o700 });
    const temporary = this.filename + "." + randomUUID() + ".tmp";
    try {
      fs.writeFileSync(temporary, enabled ? "1" : "0", {
        flag: "wx",
        mode: 0o600,
      });
      fs.renameSync(temporary, this.filename);
    } finally {
      fs.rmSync(temporary, { force: true });
    }
    return this.get();
  }
}
