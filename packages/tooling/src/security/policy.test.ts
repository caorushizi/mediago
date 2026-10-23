import { expect, test } from "vitest";
import { assertCleanAudit } from "./policy.ts";
const clean = { low: 0, moderate: 0, high: 0, critical: 0 };
test("accepts a completed clean audit", () => {
  expect(() =>
    assertCleanAudit(
      0,
      JSON.stringify({ metadata: { vulnerabilities: clean } }),
    ),
  ).not.toThrow();
});
test.each(["low", "moderate", "high", "critical"])(
  "blocks %s vulnerabilities",
  (severity) => {
    expect(() =>
      assertCleanAudit(
        0,
        JSON.stringify({
          metadata: { vulnerabilities: { ...clean, [severity]: 1 } },
        }),
      ),
    ).toThrow();
  },
);
test.each([null, 1, 2])(
  "does not turn a failed audit into a clean result (%s)",
  (status) => {
    expect(() =>
      assertCleanAudit(
        status,
        JSON.stringify({ metadata: { vulnerabilities: clean } }),
      ),
    ).toThrow();
  },
);
test.each([
  "{}",
  "not json",
  '{"error":{"code":"NETWORK"}}',
  '{"metadata":{"vulnerabilities":{"high":0}}}',
])("rejects incomplete audit responses: %s", (stdout) => {
  expect(() => assertCleanAudit(0, stdout)).toThrow();
});
