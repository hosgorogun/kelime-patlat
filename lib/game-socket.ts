import { io, type Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getApiBaseUrl } from "@/constants/oauth";
import { SESSION_TOKEN_KEY } from "@/constants/oauth";

let gameSocket: Socket | null = null;

export function getGameSocket() {
  if (gameSocket?.connected) return gameSocket;
  if (!gameSocket) {
    const url = getApiBaseUrl();
    gameSocket = io(url, {
      autoConnect: true,
      transports: ["websocket", "polling"],
      auth: (callback) => {
        void AsyncStorage.getItem(SESSION_TOKEN_KEY).then((token) => callback({ token: token && token !== "guest" ? token : undefined }));
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 3_000,
      timeout: 10_000,
    });
  } else {
    gameSocket.connect();
  }
  return gameSocket;
}

export function reconnectGameSocket() {
  if (gameSocket) {
    gameSocket.disconnect();
    gameSocket.connect();
  } else {
    getGameSocket();
  }
}
