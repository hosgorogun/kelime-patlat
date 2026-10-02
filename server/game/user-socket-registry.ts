import { normalizeTr } from "../../shared/tr-utils";

const userSocketMap = new Map<string, Set<string>>();

export function registerUserSocket(identifier: string, socketId: string) {
  if (!identifier) return;
  const key = normalizeTr(identifier);
  let set = userSocketMap.get(key);
  if (!set) {
    set = new Set();
    userSocketMap.set(key, set);
  }
  set.add(socketId);
}

export function unregisterUserSocket(identifier: string, socketId: string) {
  if (!identifier) return;
  const key = normalizeTr(identifier);
  const set = userSocketMap.get(key);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) userSocketMap.delete(key);
  }
}

export function getSocketsForUser(identifier: string): string[] {
  if (!identifier) return [];
  const set = userSocketMap.get(normalizeTr(identifier));
  return set ? Array.from(set) : [];
}

export function isUserOnline(identifier: string): boolean {
  if (!identifier) return false;
  const set = userSocketMap.get(normalizeTr(identifier));
  return Boolean(set && set.size > 0);
}

export function removeSocketFromAllUsers(socketId: string) {
  for (const [key, set] of userSocketMap.entries()) {
    if (set.has(socketId)) {
      set.delete(socketId);
      if (set.size === 0) userSocketMap.delete(key);
    }
  }
}
