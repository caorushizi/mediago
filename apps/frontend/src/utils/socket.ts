import { io, Socket } from "socket.io-client";

let _instance: Socket | null = null;
export function getSocket() {
  if (_instance) {
    return _instance;
  }

  _instance = io("http://localhost:8899");

  return _instance;
}
