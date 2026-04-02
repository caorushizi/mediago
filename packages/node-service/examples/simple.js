import { ServiceRunner } from "../dist/index.js";

const runner = new ServiceRunner({
  executableDir: "F:/Workspace/Projects/MediaGo/mediago-player/dist",
  executableName: "mediago-player",
  internal: true,
  extraArgs: ["-video-root", "C:/Users/Microsoft/Desktop/mediago_download"],
});

runner.on("exit", (code, signal) => {
  console.log(`Service exited with code ${code} and signal ${signal}`);
});

runner.on("stdout", async (data) => {
  console.log(
    "Checking service health...",
    Buffer.from(data).toString().trim(),
  );
});

runner.on("stderr", async (data) => {
  console.error("Service error output:", Buffer.from(data).toString().trim());
});

runner.on("error", (error) => {
  console.error("Service encountered an error:", error);
});

await runner.start();

console.log(`Service started at ${runner.getState().url}`);

await runner.restart({
  internal: false,
});

console.log(`Service started at ${runner.getState().url}`);
