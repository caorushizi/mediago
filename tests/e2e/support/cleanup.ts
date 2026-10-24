import { withDeadline } from "./electron-process.ts";

interface CleanupOperation {
  name: string;
  run(): void | Promise<void>;
}

export async function runIndependentCleanup(
  operations: readonly CleanupOperation[],
  timeoutMs = 20_000,
): Promise<unknown[]> {
  // A wedged Electron close/trace must not starve Vite or fixture-server cleanup.
  const results = await Promise.allSettled(
    operations.map(({ name, run }) =>
      withDeadline(Promise.resolve().then(run), timeoutMs, `${name} cleanup`),
    ),
  );
  return results.flatMap((result) =>
    result.status === "rejected" ? [result.reason] : [],
  );
}
