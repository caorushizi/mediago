/**
 * from url get file extension
 * @param url URL string
 * @returns string file extension (without dot), if no extension returns empty string
 */
export function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split(".").pop() || "";
    return extension.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Safely parse JSON string, return default value if parsing fails
 * @param jsonString  JSON string to parse
 * @param defaultValue  Default value to return if parsing fails
 * @returns Parsed object or default value
 */
export function safeParseJSON<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}
