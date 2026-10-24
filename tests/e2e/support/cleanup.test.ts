import { createServer } from "node:net";
import { expect, test, vi } from "vitest";
import { runIndependentCleanup } from "./cleanup.ts";
import { assertPortFree } from "./ports.ts";

test("a hung Electron cleanup cannot keep an independent UI listener open", async () => {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing port");
  let listenerClosed!: () => void;
  const closed = new Promise<void>((resolve) => {
    listenerClosed = resolve;
  });
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  try {
    const cleaning = runIndependentCleanup(
      [
        { name: "Electron", run: () => new Promise<void>(() => {}) },
        {
          name: "UI",
          run: () =>
            new Promise<void>((resolve, reject) =>
              server.close((error) => {
                if (error) reject(error);
                else {
                  listenerClosed();
                  resolve();
                }
              }),
            ),
        },
        {
          name: "other fixture",
          run: () => {
            throw new Error("fixture failure");
          },
        },
      ],
      100,
    );
    await closed;
    await assertPortFree("127.0.0.1", address.port, "next test");
    await vi.advanceTimersByTimeAsync(100);
    const errors = await cleaning;
    expect(errors).toHaveLength(2);
    expect(errors.map((error) => (error as Error).message)).toEqual([
      "Electron cleanup timed out after 100ms",
      "fixture failure",
    ]);
  } finally {
    vi.useRealTimers();
    server.close();
  }
});
