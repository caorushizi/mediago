import argsBuilder from "spawn-args";
import request from "./request";

const successFn = (data: unknown): IpcResponse => ({ code: 0, msg: "", data });
const failFn = (code: number, msg: string): IpcResponse => ({
  code,
  msg,
  data: null,
});

export { successFn, failFn, argsBuilder, request };
