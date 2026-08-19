import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/constants/oauth";

let gameSocket: Socket | null = null;

export function getGameSocket() {
  if (gameSocket?.connected) return gameSocket;
  if (!gameSocket) {
    gameSocket = io(getApiBaseUrl(), {
      autoConnect: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 3_000,
    });
  } else {
    gameSocket.connect();
  }
  return gameSocket;
}
