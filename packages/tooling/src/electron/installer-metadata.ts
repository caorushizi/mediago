export function getApplicationCopyright(
  owner: string | undefined,
  year = new Date().getFullYear(),
): string | undefined {
  return owner ? `2021-${year} ${owner}` : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

// electron-builder supplies the NSIS defines and commands before compilation.
// Leave portable targets and their application descriptions unchanged.
export async function configureInstallerMetadata(
  options: unknown,
): Promise<boolean> {
  if (!Array.isArray(options)) return false;
  const [defines, commands] = options;
  if (!isRecord(defines) || !("UNINSTALL_DISPLAY_NAME" in defines))
    return false;
  if (
    !isRecord(commands) ||
    !Array.isArray(commands.VIAddVersionKey) ||
    !commands.VIAddVersionKey.every(
      (key): key is string => typeof key === "string",
    )
  ) {
    throw new Error("NSIS installer version information is unavailable");
  }

  const versionKeys = commands.VIAddVersionKey;
  let descriptions = 0;
  commands.VIAddVersionKey = versionKeys.map((key) => {
    const match = /^(\/LANG=\d+) FileDescription "/.exec(key);
    if (!match) return key;
    const productName = versionKeys.find((entry) =>
      entry.startsWith(match[1] + ' ProductName "'),
    );
    if (!productName) {
      throw new Error("NSIS installer product name is unavailable");
    }
    descriptions += 1;
    // Reuse the escaped product name emitted by electron-builder.
    return productName
      .replace(' ProductName "', ' FileDescription "')
      .replace(/"$/, ' installer"');
  });
  if (descriptions === 0) {
    throw new Error("NSIS installer file description is unavailable");
  }
  return false;
}
