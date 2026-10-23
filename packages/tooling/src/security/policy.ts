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
