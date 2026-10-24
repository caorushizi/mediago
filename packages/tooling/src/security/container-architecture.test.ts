import { expect, test } from "vitest";
import { verifyContainerArchitecture } from "./container-architecture.ts";

function elfHeader(machine: number): Buffer {
  const header = Buffer.alloc(20);
  header.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1]);
  header.writeUInt16LE(machine, 18);
  return header;
}

for (const [architecture, machine] of [
  ["amd64", 62],
  ["arm64", 183],
] as const) {
  test(`accepts the actual Core ELF machine for linux/${architecture}`, () => {
    expect(
      verifyContainerArchitecture(
        `linux/${architecture}`,
        architecture,
        elfHeader(machine),
      ),
    ).toBe(machine);
  });
}

test("rejects the reported ARM64 image containing an AMD64 Core", () => {
  expect(() =>
    verifyContainerArchitecture("linux/arm64", "arm64", elfHeader(62)),
  ).toThrow(/Core ELF architecture/);
  expect(() =>
    verifyContainerArchitecture("linux/amd64", "amd64", elfHeader(183)),
  ).toThrow(/Core ELF architecture/);
});

test("rejects incorrect image metadata even when Core matches the target", () => {
  for (const platform of ["linux/amd64", "windows/arm64"]) {
    expect(() =>
      verifyContainerArchitecture(platform, "arm64", elfHeader(183)),
    ).toThrow(/Image metadata/);
  }
});

test("rejects truncated and non-ELF files before reading the machine field", () => {
  expect(() =>
    verifyContainerArchitecture("linux/arm64", "arm64", Buffer.alloc(19)),
  ).toThrow(/truncated/);
  expect(() =>
    verifyContainerArchitecture("linux/arm64", "arm64", Buffer.alloc(20)),
  ).toThrow(/not ELF/);
});

test("rejects incompatible ELF class, byte order and identification version", () => {
  for (const [offset, value] of [
    [4, 1],
    [5, 2],
    [6, 0],
  ]) {
    const header = elfHeader(183);
    header[offset] = value;
    expect(() =>
      verifyContainerArchitecture("linux/arm64", "arm64", header),
    ).toThrow(/Core must/);
  }
});

test("does not silently accept unsupported target architectures", () => {
  expect(() =>
    verifyContainerArchitecture("linux/riscv64", "riscv64", elfHeader(243)),
  ).toThrow(/Unsupported container architecture/);
});
