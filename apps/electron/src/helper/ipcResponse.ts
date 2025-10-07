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
