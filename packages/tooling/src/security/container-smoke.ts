import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const image = process.argv[2] || "mediago:security";
const container = `mediago-security-${randomUUID()}`;
function docker(args: string[]): string {
  return execFileSync("docker", args, {
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 2 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
// Exercise the same native binaries that production downloads launch.
for (const [binary, args] of [
  ["/app/deps/mediago", ["--help"]],
  ["/app/deps/ffmpeg", ["-version"]],
  ["/app/deps/N_m3u8DL-RE", ["--help"]],
  ["/app/deps/BBDown", ["--help"]],
  ["/app/deps/aria2c", ["--version"]],
  ["/app/deps/yt-dlp", ["--version"]],
  ["/app/deps/deno", ["--version"]],
] as const) {
  docker(["run", "--rm", "--entrypoint", binary, image, ...args]);
  console.log(`Native startup passed: ${binary}`);
}
try {
  // An appended flag must override the image default without a shell wrapper.
  docker([
    "run",
    "--detach",
    "--name",
    container,
    "--publish",
    "127.0.0.1::8900",
    image,
    "--port=8900",
  ]);
  const ports = JSON.parse(
    docker([
      "inspect",
      "--format",
      "{{json .NetworkSettings.Ports}}",
      container,
    ]),
  ) as Record<string, { HostPort: string }[]>;
  const url = `http://127.0.0.1:${ports["8900/tcp"][0].HostPort}/healthy`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {
      /* Wait only for this fresh test container. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(
    ready,
    "Container did not become healthy with the existing volume paths and overridden port.",
  );
  docker(["stop", "--time", "10", container]);
  const code = Number(
    docker(["inspect", "--format", "{{.State.ExitCode}}", container]).trim(),
  );
  assert.equal(code, 0, "Container did not shut down gracefully as PID1.");
  console.log(
    "Container health, volume initialization, argument override and SIGTERM passed.",
  );
} finally {
  docker(["rm", "--force", "--volumes", container]);
}
