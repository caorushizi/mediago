export function assertCleanAudit(status: number | null, stdout: string): void {
  const audit = JSON.parse(stdout) as {
    error?: unknown;
    metadata?: { vulnerabilities?: Record<string, number> };
  };
  const counts = audit.metadata?.vulnerabilities;
  if (audit.error || !counts || status !== 0) {
    throw new Error(
      "Dependency audit failed or reported vulnerabilities; inspect the audit output.",
    );
  }
  for (const severity of ["low", "moderate", "high", "critical"]) {
    const count = counts[severity];
    if (!Number.isInteger(count) || count < 0 || count !== 0) {
      throw new Error(
        `Dependency audit has invalid or nonzero ${severity} findings.`,
      );
    }
  }
}

// Keep registry messages, URLs and credentials out of public CI logs.
export function auditFailureSummary(
  status: number | null,
  stdout: string,
): string {
  try {
    const value = JSON.parse(stdout) as {
      error?: { code?: unknown; statusCode?: unknown };
      metadata?: { vulnerabilities?: Record<string, unknown> };
    };
    const errorCode =
      typeof value.error?.code === "string" &&
      /^[A-Z0-9_]+$/.test(value.error.code)
        ? value.error.code
        : undefined;
    const httpStatus =
      typeof value.error?.statusCode === "number"
        ? value.error.statusCode
        : undefined;
    const counts = Object.fromEntries(
      ["low", "moderate", "high", "critical"].map((level) => [
        level,
        typeof value.metadata?.vulnerabilities?.[level] === "number"
          ? value.metadata.vulnerabilities[level]
          : null,
      ]),
    );
    return JSON.stringify({
      exit: status,
      errorCode,
      httpStatus,
      hasMetadata: Boolean(value.metadata),
      counts,
    });
  } catch {
    return JSON.stringify({ exit: status, invalidJSON: true });
  }
}
