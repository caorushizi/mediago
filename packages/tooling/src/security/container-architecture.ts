import assert from "node:assert/strict";

export function verifyContainerArchitecture(
  platform: string,
  expectedArchitecture: string,
  coreHeader: Uint8Array,
): number {
  assert.ok(
    expectedArchitecture === "amd64" || expectedArchitecture === "arm64",
    `Unsupported container architecture: ${expectedArchitecture}`,
  );
  assert.equal(
    platform,
    `linux/${expectedArchitecture}`,
    "Image metadata does not match the requested platform.",
  );
  assert.ok(coreHeader.byteLength >= 20, "Core ELF header is truncated.");
  const header = Buffer.from(coreHeader);
  assert.equal(header.toString("hex", 0, 4), "7f454c46", "Core is not ELF.");
  assert.equal(header[4], 2, "Core must be a 64-bit ELF executable.");
  assert.equal(header[5], 1, "Core must use little-endian ELF encoding.");
  assert.equal(header[6], 1, "Core must use ELF identification version 1.");
  const machine = header.readUInt16LE(18);
  assert.equal(
    machine,
    expectedArchitecture === "amd64" ? 62 : 183,
    "Core ELF architecture does not match the image platform.",
  );
  return machine;
}
