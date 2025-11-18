import { io, type Socket } from "socket.io-client";

let _instance: Socket | null = null;
export function getSocket() {
  if (_instance) {
    return _instance;
  }

  const serverUrl = import.meta.env.DEV ? "http://localhost:8899" : "/";
  _instance = io(serverUrl);

  return _instance;
}
