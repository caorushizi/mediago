import EventEmitter from "events";

export async function sleep(second = 1): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, second * 1000));
}

export function formatHeaders(headersStr: string): string {
  const headers: Record<string, any> | null = JSON.parse(headersStr);
  if (!headers) return "";
  const formatted = Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
  return formatted;
}

export const event = new EventEmitter();

export interface IpcResponse {
  code: number;
  message: string;
  data: Record<string, any> | null;
}

export function success(data: Record<string, any>): IpcResponse {
  return {
    code: 0,
    message: "success",
    data,
  };
}

export function error(message = "fail"): IpcResponse {
  return {
    code: -1,
    message,
    data: null,
  };
}
