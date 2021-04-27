const processHeaders = (headersStr: string): Record<string, string> =>
  headersStr.split("\n").reduce((prev: Record<string, string>, cur) => {
    const colonIndex = cur.indexOf(":");
    const key = cur.slice(0, colonIndex).trim();
    prev[key] = cur.slice(colonIndex + 1).trim();
    return prev;
  }, {});

export { processHeaders };
