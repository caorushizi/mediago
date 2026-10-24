import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { AnalyticsConsentStore } from "./analytics-consent-store";

const directories: string[] = [];
function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mediago-consent-"));
  directories.push(directory);
  const filename = path.join(directory, "MediaGo", "analytics-consent");
  return { directory, filename, store: new AnalyticsConsentStore(filename) };
}
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true });
});
describe("per-user analytics consent", () => {
  test("missing, invalid and oversized preferences never grant consent", () => {
    const { store, filename } = fixture();
    expect(store.get()).toEqual({ enabled: false, decided: false });
    fs.mkdirSync(path.dirname(filename));
    for (const value of ["", "true", "1garbage", "1".repeat(100), "0\n1"]) {
      fs.writeFileSync(filename, value);
      expect(store.get()).toEqual({ enabled: false, decided: false });
    }
  });
  test("reads installer preferences and preserves refusal across app restarts", () => {
    const { store, filename } = fixture();
    fs.mkdirSync(path.dirname(filename));
    fs.writeFileSync(filename, "1\r\n");
    expect(store.get()).toEqual({ enabled: true, decided: true });
    expect(store.set(false)).toEqual({ enabled: false, decided: true });
    expect(new AnalyticsConsentStore(filename).get()).toEqual({
      enabled: false,
      decided: true,
    });
    expect(fs.readFileSync(filename, "utf8")).toBe("0");
    expect(store.set(true)).toEqual({ enabled: true, decided: true });
  });
  test("rejects non-booleans and reports write failures without claiming success", () => {
    const { store, directory } = fixture();
    expect(() => store.set("false" as unknown as boolean)).toThrow(TypeError);
    const blocked = path.join(directory, "blocked");
    fs.writeFileSync(blocked, "file");
    expect(() =>
      new AnalyticsConsentStore(path.join(blocked, "consent")).set(true),
    ).toThrow();
    expect(store.get().enabled).toBe(false);
  });
});
