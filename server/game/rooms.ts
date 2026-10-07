import type { Server, Socket } from "socket.io";
import { z } from "zod";
import { sdk } from "../_core/sdk";

import {
  BOARD_SIZES,
  botThinkDelayMs,
  getRoundDurationMs,
  isAdjacent,
  wordScoreMultiplier,
  wordFromSelection,
  type BoardSize,
} from "../../shared/game";
import { getRandomBotPersona } from "../../shared/botPersonas";
import { loadLeaderboard } from "./mongo-store";
import { isEqualTr } from "../../shared/tr-utils";
import { isValidTurkishWord } from "../../shared/dictionary";

export { cleanCode } from "./schemas";
import {
  cleanCode,
  isValidPayload,
  matchmakingJoinSchema,
  matchmakingLeaveSchema,
  roomCreateSchema,
  roomJoinSchema,
  roomPlayerActionSchema,
  roomEmoteSchema,
  wordSubmitSchema,
  type playerProfileSchema,
} from "./schemas";
import type { Room, QueueEntry } from "./types";
import { buildGameBoard, makeUniqueCode } from "./board-builder";
import { snapshot, emitRoom } from "./room-snapshot";
import { findWordPath } from "./word-path";
import {
  registerUserSocket,
  removeSocketFromAllUsers,
  getSocketsForUser,
} from "./user-socket-registry";
import {
  leaderboardSnapshot,
  recordRoundForLeaderboard,
} from "./leaderboard-service";
import {
  registerFriendSocketHandlers,
  pendingDuelInvites,
} from "./friend-socket-handlers";

const rooms = new Map<string, Room>();
const matchmakingQueue = new Map<BoardSize, QueueEntry[]>();
const matchmakingTimers = new Map<string, NodeJS.Timeout>();
const ROOM_TTL_MS = 15 * 60 * 1000;

function makeCode() {
  return makeUniqueCode((code) => rooms.has(code));
}

function buildBoard(size: BoardSize) {
  return buildGameBoard(size);
}

function fail(socket: Socket, message: string) {
  socket.emit("room:error", { message });
}

function roomForPlayer(room: Room, playerId: string) {
  if (room.host.id === playerId) return room.host;
  if (room.guest?.id === playerId) return room.guest;
  return null;
}

function playerForSocket(room: Room, socket: Socket, playerId: string) {
  const player = roomForPlayer(room, playerId);
  return player?.socketId === socket.id ? player : null;
}

function finishRound(io: Server, room: Room) {
  if (room.status !== "playing") return;
  if (room.disconnectTimer) {
    clearTimeout(room.disconnectTimer);
    room.disconnectTimer = null;
    room.disconnectPlayerId = null;
    room.disconnectExpiresAt = null;
  }
  if (room.botTurnTimer) {
    clearTimeout(room.botTurnTimer);
    room.botTurnTimer = null;
  }
  if (room.roundEndTimer) {
    clearTimeout(room.roundEndTimer);
    room.roundEndTimer = null;
  }
  const hostScore = room.scores[room.host.id] ?? 0;
  const guestScore = room.guest ? room.scores[room.guest.id] ?? 0 : 0;

  room.status = "finished";

  if (room.guest && hostScore === guestScore) {
    room.winnerId = null;
    room.message = `Berabere! İki oyuncu da ${hostScore} puan topladı.`;
  } else {
    const winner = hostScore > guestScore ? room.host : room.guest || room.host;
    room.winnerId = winner.id;
    room.message = `${winner.name} ${room.scores[winner.id] ?? 0} puanla turu kazandı!`;
  }

  recordRoundForLeaderboard(io, room);
  emitRoom(io, room);
}

function claimWord(io: Server, room: Room, playerId: string, word: string, path: number[]) {
  if (room.status !== "playing" || room.foundWords.some((entry) => isEqualTr(entry.word, word) && entry.playerId === playerId))
    return false;
  room.botSelection = undefined;

  if (!room.lastWordFoundTime) room.lastWordFoundTime = {};
  if (!room.comboCount) room.comboCount = {};

  const now = Date.now();
  const lastTime = room.lastWordFoundTime[playerId] || 0;
  let comboBonus = 0;
  let combo = 0;

  if (now - lastTime < 8000) {
    combo = (room.comboCount[playerId] || 0) + 1;
    room.comboCount[playerId] = combo;
    if (combo >= 2) {
      comboBonus = Math.min(5, combo) * 2;
    }
  } else {
    combo = 1;
    room.comboCount[playerId] = combo;
  }
  room.lastWordFoundTime[playerId] = now;

  room.foundWords.push({ word, playerId, path });
  const multiplier = wordScoreMultiplier(word.length);
  const earnedPoints = word.length * multiplier + comboBonus;
  room.scores[playerId] = (room.scores[playerId] ?? 0) + earnedPoints;
  const player = roomForPlayer(room, playerId);
  room.message = `${player?.name ?? "OYUNCU"} “${word}” buldu! +${earnedPoints}${
    multiplier > 1 ? ` · ×${multiplier} çarpan` : ""
  }${combo >= 2 ? ` · 🔥 COMBO x${combo} (+${comboBonus})` : ""}`;

  const hasFoundAll = room.words.every((w) =>
    room.foundWords.some((entry) => entry.playerId === playerId && isEqualTr(entry.word, w))
  );
  if (hasFoundAll) {
    finishRound(io, room);
  } else {
    emitRoom(io, room);
  }
  return true;
}

function scheduleBotTurn(io: Server, room: Room, token: number, isFirstTurn = false) {
  const bot = room.guest;
  if (!bot?.isBot) return;
  const word = room.words.find(
    (candidate) => !room.foundWords.some((entry) => isEqualTr(entry.word, candidate) && entry.playerId === bot.id)
  );
  if (!word) return;

  const isNoviceHost = (room.host?.matches ?? 0) < 3;
  const novicePityMultiplier = isNoviceHost ? 1.35 : 1.0;
  const delay = Math.floor((botThinkDelayMs(room.size, word.length) + (isFirstTurn ? 2500 : 0)) * novicePityMultiplier);
  const selectTriggerDelay = Math.max(800, delay - 1200);

  if (room.botTurnTimer) {
    clearTimeout(room.botTurnTimer);
    room.botTurnTimer = null;
  }

  room.botTurnTimer = setTimeout(() => {
    room.botTurnTimer = null;
    const current = rooms.get(room.code);
    if (!current || current !== room || room.roundToken !== token || room.status !== "playing") return;
    const path = room.routes[word] || findWordPath(room.board, room.size, word);
    if (path) {
      room.botSelection = path;
      room.botTurnTimer = setTimeout(() => {
        room.botTurnTimer = null;
        const finalCurrent = rooms.get(room.code);
        if (!finalCurrent || finalCurrent !== room || room.roundToken !== token || room.status !== "playing") return;
        claimWord(io, room, bot.id, word, path);
        if (room.status === "playing") scheduleBotTurn(io, room, token, false);
      }, 1200);
    } else {
      if (room.status === "playing") scheduleBotTurn(io, room, token, false);
    }
  }, selectTriggerDelay);
}

function scheduleRoundEnd(io: Server, room: Room, token: number) {
  if (room.roundEndTimer) {
    clearTimeout(room.roundEndTimer);
    room.roundEndTimer = null;
  }
  const duration = getRoundDurationMs(room.size) + 3000;
  room.roundEndTimer = setTimeout(() => {
    room.roundEndTimer = null;
    if (rooms.get(room.code) === room && room.roundToken === token) finishRound(io, room);
  }, duration);
}

function scheduleBotFill(io: Server, room: Room) {
  const token = ++room.botFillToken;
  if (room.botFillTimer) {
    clearTimeout(room.botFillTimer);
    room.botFillTimer = null;
  }
  room.botFillTimer = setTimeout(() => {
    room.botFillTimer = null;
    if (rooms.get(room.code) !== room || room.botFillToken !== token || room.guest || room.status !== "waiting") return;
    const botPersona = getRandomBotPersona(room.host);
    room.guest = {
      ...botPersona,
      id: `bot:${room.code}`,
      socketId: null,
    };
    room.status = "lobby";
    room.message = "Rakip bulunamadı — KELİME BOT düelloya hazır.";
    emitRoom(io, room);
  }, 2_200);
}

function startRound(io: Server, room: Room) {
  const { board, words, routes } = buildBoard(room.size);
  room.board = board;
  room.words = words;
  room.routes = routes;
  room.foundWords = [];
  room.bonusWords = {};
  room.scores = Object.fromEntries([room.host, room.guest].filter(Boolean).map((player) => [player!.id, 0]));
  room.status = "playing";
  room.startedAt = Date.now() + 3000;
  room.winnerId = null;
  room.message = `${words.length} gizli kelime var. Yalnız yatay ve dikey bağla!`;
  room.host.ready = false;
  if (room.guest) room.guest.ready = false;
  room.host.rematch = false;
  if (room.guest) room.guest.rematch = false;
  room.lastWordFoundTime = {};
  room.comboCount = {};
  const token = ++room.roundToken;
  emitRoom(io, room);
  scheduleRoundEnd(io, room, token);
  scheduleBotTurn(io, room, token, true);
}

function destroyRoom(code: string, room?: Room | null) {
  const target = room || rooms.get(code);
  if (target) {
    if (target.disconnectTimer) {
      clearTimeout(target.disconnectTimer);
      target.disconnectTimer = null;
    }
    if (target.rematchTimer) {
      clearTimeout(target.rematchTimer);
      target.rematchTimer = null;
    }
    if (target.botTurnTimer) {
      clearTimeout(target.botTurnTimer);
      target.botTurnTimer = null;
    }
    if (target.roundEndTimer) {
      clearTimeout(target.roundEndTimer);
      target.roundEndTimer = null;
    }
    if (target.botFillTimer) {
      clearTimeout(target.botFillTimer);
      target.botFillTimer = null;
    }
    target.roundToken = -1;
    target.botFillToken = -1;
  }
  rooms.delete(code);
}

function leaveRoom(io: Server, socket: Socket, room: Room, playerId: string) {
  const player = roomForPlayer(room, playerId);
  if (!player) return;
  socket.leave(`room:${room.code}`);

  if (room.disconnectTimer) {
    clearTimeout(room.disconnectTimer);
    room.disconnectTimer = null;
    room.disconnectPlayerId = null;
    room.disconnectExpiresAt = null;
  }
  if (room.rematchTimer) {
    clearTimeout(room.rematchTimer);
    room.rematchTimer = null;
  }

  if (room.status === "playing") {
    if (room.roundEndTimer) {
      clearTimeout(room.roundEndTimer);
      room.roundEndTimer = undefined;
    }
    if (room.botTurnTimer) {
      clearTimeout(room.botTurnTimer);
      room.botTurnTimer = undefined;
    }
    if (room.disconnectTimer) {
      clearTimeout(room.disconnectTimer);
      room.disconnectTimer = undefined;
    }
    const remaining = room.host.id === playerId ? room.guest : room.host;
    if (remaining) {
      room.winnerId = remaining.id;
      room.message = `${player.name} maçı terk etti. ${remaining.name} hükmen kazandı!`;
      room.status = "finished";
      if (room.isRanked || !remaining.isBot) {
        recordRoundForLeaderboard(io, room);
      }
      if (!remaining.isBot) {
        emitRoom(io, room);
        return;
      }
    }
    destroyRoom(room.code, room);
    return;
  }

  // Maç tamamlanmışken bir oyuncu odadan çıkarsa: kalan oyuncu sonuç ekranını rahatça inceleyebilsin
  if (room.status === "finished") {
    if (room.host.id === playerId) {
      if (!room.guest || room.guest.isBot) {
        destroyRoom(room.code, room);
        return;
      }
      room.host = room.guest;
      room.host.rematch = false;
      room.guest = null;
      room.message = `${player.name} ayrıldı.`;
      emitRoom(io, room);
      return;
    }
    room.guest = null;
    room.host.rematch = false;
    room.message = `${player.name} ayrıldı.`;
    emitRoom(io, room);
    return;
  }

  if (room.host.id === playerId) {
    if (!room.guest || room.guest.isBot) {
      destroyRoom(room.code, room);
      return;
    }
    room.host = room.guest;
    room.host.ready = false;
    room.guest = null;
    room.status = "waiting";
    room.message = "Rakip ayrıldı. Yeni bir oyuncu bekleniyor.";
    emitRoom(io, room);
    scheduleBotFill(io, room);
    return;
  }
  room.guest = null;
  room.host.ready = false;
  room.status = "waiting";
  room.winnerId = null;
  room.message = "Rakip ayrıldı. Yeni bir oyuncu bekleniyor.";
  emitRoom(io, room);
  scheduleBotFill(io, room);
}

export function registerGameRooms(io: Server) {
  io.use(async (socket, next) => {
    const token = typeof socket.handshake.auth?.token === "string" ? socket.handshake.auth.token : undefined;
    if (!token || token === "guest") {
      socket.data.userId = null;
      next();
      return;
    }
    try {
      const session = await sdk.verifySession(token);
      if (!session) {
        socket.data.userId = null;
        next();
        return;
      }
      socket.data.userId = session.openId;
      next();
    } catch (err) {
      console.warn("[Socket Auth] Session verify error:", err);
      socket.data.userId = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    const ownsPlayerId = (playerId: string) => {
      if (socket.data.userId) {
        return socket.data.userId === playerId;
      }
      if (playerId.startsWith("usr_")) {
        return false;
      }
      if (!socket.data.boundPlayerId) {
        socket.data.boundPlayerId = playerId;
        return true;
      }
      return socket.data.boundPlayerId === playerId;
    };

    socket.emit("leaderboard:update", leaderboardSnapshot());
    void loadLeaderboard()
      .then((persisted) => {
        if (persisted) socket.emit("leaderboard:update", persisted);
      })
      .catch((err) => {
        console.error("[Leaderboard] Error loading persisted leaderboard:", err);
      });

    socket.on("leaderboard:request", () => {
      socket.emit("leaderboard:update", leaderboardSnapshot());
      void loadLeaderboard()
        .then((persisted) => {
          if (persisted) socket.emit("leaderboard:update", persisted);
        })
        .catch((err) => {
          console.error("[Leaderboard] Error loading persisted leaderboard:", err);
        });
    });

    socket.on("matchmaking:join", (payload: { playerId: string; playerName: string; size: BoardSize }) => {
      if (!isValidPayload(matchmakingJoinSchema, payload)) return fail(socket, "Geçersiz eşleştirme isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      if (!BOARD_SIZES.includes(payload.size)) return fail(socket, "Geçersiz tahta boyutu.");

      for (const [s, q] of matchmakingQueue.entries()) {
        matchmakingQueue.set(s, q.filter((p) => p.playerId !== payload.playerId && p.socketId !== socket.id));
      }

      let queue = matchmakingQueue.get(payload.size) || [];

      let opponent: (typeof queue)[0] | undefined;
      while (queue.length > 0) {
        const candidate = queue.shift()!;
        const candidateSocket = io.sockets.sockets.get(candidate.socketId || "");
        if (candidateSocket && candidateSocket.connected) {
          opponent = candidate;
          break;
        } else {
          const candidateTimer = matchmakingTimers.get(candidate.socketId);
          if (candidateTimer) {
            clearTimeout(candidateTimer);
            matchmakingTimers.delete(candidate.socketId);
          }
        }
      }
      matchmakingQueue.set(payload.size, queue);

      if (opponent) {
        const opponentTimer = matchmakingTimers.get(opponent.socketId);
        if (opponentTimer) {
          clearTimeout(opponentTimer);
          matchmakingTimers.delete(opponent.socketId);
        }
        const existingSelfTimer = matchmakingTimers.get(socket.id);
        if (existingSelfTimer) {
          clearTimeout(existingSelfTimer);
          matchmakingTimers.delete(socket.id);
        }
        const code = makeCode();
        const room: Room = {
          code,
          size: payload.size,
          status: "lobby",
          isCustom: false,
          isRanked: true,
          board: [],
          words: [],
          routes: {},
          foundWords: [],
          scores: {},
          host: {
            id: opponent.playerId,
            name: opponent.playerName.trim().slice(0, 16) || "OYUNCU 1",
            isBot: false,
            socketId: opponent.socketId,
            connected: true,
            ready: false,
            rematch: false,
            ...(opponent.profile || {}),
          },
          guest: {
            id: payload.playerId,
            name: payload.playerName.trim().slice(0, 16) || "OYUNCU 2",
            isBot: false,
            socketId: socket.id,
            connected: true,
            ready: false,
            rematch: false,
            ...(payload.profile || {}),
          },
          winnerId: null,
          startedAt: null,
          message: "Rakip bulundu! Maç başlamak üzere...",
          touchedAt: Date.now(),
          botFillToken: 0,
          roundToken: 0,
        };
        rooms.set(code, room);
        const hostSocket = io.sockets.sockets.get(opponent.socketId || "");
        if (hostSocket) hostSocket.join(`room:${code}`);
        socket.join(`room:${code}`);
        emitRoom(io, room);
      } else {
        const existingSelfTimer = matchmakingTimers.get(socket.id);
        if (existingSelfTimer) {
          clearTimeout(existingSelfTimer);
          matchmakingTimers.delete(socket.id);
        }
        queue.push({
          playerId: payload.playerId,
          playerName: payload.playerName,
          socketId: socket.id,
          profile: payload.profile,
        });
        matchmakingQueue.set(payload.size, queue);
        socket.emit("matchmaking:status", { status: "searching" });
        const timer = setTimeout(() => {
          matchmakingTimers.delete(socket.id);
          if (!io.sockets.sockets.get(socket.id)?.connected) return;
          const currentQueue = matchmakingQueue.get(payload.size) || [];
          const idx = currentQueue.findIndex((p) => p.playerId === payload.playerId && p.socketId === socket.id);
          if (idx !== -1) {
            const queueEntry = currentQueue[idx]!;
            currentQueue.splice(idx, 1);
            matchmakingQueue.set(payload.size, currentQueue);
            const code = makeCode();
            const botPersona = getRandomBotPersona({
              id: payload.playerId,
              name: payload.playerName,
              ...(queueEntry.profile || payload.profile || {}),
            });
            const room: Room = {
              code,
              size: payload.size,
              status: "lobby",
              isCustom: false,
              isRanked: true,
              board: [],
              words: [],
              routes: {},
              foundWords: [],
              scores: {},
              host: {
                id: payload.playerId,
                name: payload.playerName.trim().slice(0, 16) || "OYUNCU 1",
                isBot: false,
                socketId: socket.id,
                connected: true,
                ready: false,
                rematch: false,
                ...(queueEntry.profile || payload.profile || {}),
              },
              guest: {
                ...botPersona,
                id: `bot:${code}`,
                socketId: null,
                connected: true,
                ready: false,
                rematch: false,
              },
              winnerId: null,
              startedAt: null,
              message: "Rakip bulundu! Maç başlamak üzere...",
              touchedAt: Date.now(),
              botFillToken: 0,
              roundToken: 0,
            };
            rooms.set(code, room);
            socket.join(`room:${code}`);
            emitRoom(io, room);
          }
        }, 4000);
        matchmakingTimers.set(socket.id, timer);
      }
    });

    socket.on("matchmaking:leave", (payload: { playerId: string; size: BoardSize }) => {
      if (!isValidPayload(matchmakingLeaveSchema, payload)) return fail(socket, "Geçersiz eşleştirme isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const existingTimer = matchmakingTimers.get(socket.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        matchmakingTimers.delete(socket.id);
      }
      for (const [s, q] of matchmakingQueue.entries()) {
        matchmakingQueue.set(s, q.filter((p) => p.playerId !== payload.playerId && p.socketId !== socket.id));
      }
      socket.emit("matchmaking:status", { status: "idle" });
    });

    socket.on(
      "room:create",
      (payload: {
        playerId: string;
        playerName: string;
        size: BoardSize;
        immediateBot?: boolean;
        profile?: z.infer<typeof playerProfileSchema>;
        inviteTarget?: {
          toPlayerId: string;
          toUsername?: string;
          botProfile?: any;
        };
      }) => {
        if (!isValidPayload(roomCreateSchema, payload)) return fail(socket, "Geçersiz oda isteği.");
        if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
        if (!BOARD_SIZES.includes(payload.size)) return fail(socket, "Geçersiz tahta boyutu.");

        for (const [existingCode, existingRoom] of rooms.entries()) {
          if (existingRoom.host.socketId === socket.id && existingRoom.status === "waiting") {
            destroyRoom(existingCode, existingRoom);
          }
        }
        const code = makeCode();
        const room: Room = {
          code,
          size: payload.size,
          status: "waiting",
          isCustom: true,
          isRanked: false,
          board: [],
          words: [],
          routes: {},
          foundWords: [],
          scores: {},
          host: {
            id: payload.playerId,
            name: payload.playerName.trim().slice(0, 16) || "OYUNCU 1",
            isBot: false,
            socketId: socket.id,
            connected: true,
            ready: false,
            rematch: false,
            ...(payload.profile || {}),
          },
          guest: null,
          winnerId: null,
          startedAt: null,
          message: payload.immediateBot ? "Bot düellosu hazırlanıyor..." : "Oda kodunu rakibinle paylaş.",
          touchedAt: Date.now(),
          botFillToken: 0,
          roundToken: 0,
        };
        rooms.set(code, room);
        socket.join(`room:${code}`);
        emitRoom(io, room);
        if (payload.immediateBot) {
          scheduleBotFill(io, room);
        } else if (payload.inviteTarget) {
          const { toPlayerId, toUsername } = payload.inviteTarget;
          const targetSockets = [
            ...getSocketsForUser(toPlayerId),
            ...(toUsername ? getSocketsForUser(toUsername) : []),
          ];
          const uniqueSockets = Array.from(new Set(targetSockets));
          for (const sId of uniqueSockets) {
            io.to(sId).emit("friend:duel:incoming", {
              fromPlayerId: payload.playerId,
              fromPlayerName: payload.playerName,
              roomCode: code,
              size: payload.size,
            });
          }
          if (uniqueSockets.length === 0) {
            const isMockFriend =
              /^f\d+$/.test(toPlayerId) || toPlayerId.startsWith("mock") || toPlayerId.startsWith("bot");
            if (isMockFriend) {
              socket.emit("friend:duel:sent", {
                success: true,
                message: `${toUsername || "Arkadaşınız"} daveti aldı, katılıyor...`,
              });
              setTimeout(() => {
                const currentRoom = rooms.get(code);
                if (currentRoom && currentRoom.status === "waiting" && !currentRoom.guest) {
                  const friendName = toUsername || "Arkadaş";
                  const bp = payload.inviteTarget?.botProfile;
                  currentRoom.guest = {
                    id: toPlayerId.startsWith("bot:")
                      ? toPlayerId
                      : toPlayerId.startsWith("friend:")
                      ? toPlayerId
                      : `friend:${toPlayerId}`,
                    name: friendName,
                    isBot: true,
                    socketId: null,
                    connected: true,
                    ready: true,
                    rematch: false,
                    selectedTitle: bp?.selectedTitle || "[DÜELLOCU]",
                    avatar: bp?.avatar || "⚡",
                    avatarPhoto: bp?.avatarPhoto,
                    selectedFrame: bp?.selectedFrame || "signal",
                    level: bp?.level || 15,
                    tier: bp?.tier || "BRONZ",
                    lp: bp?.lp || 100,
                    wins: bp?.wins || 10,
                    matches: bp?.matches || 20,
                    streak: bp?.streak || 0,
                    bestScore: bp?.bestScore || 200,
                    bestTempo: bp?.bestTempo || 20,
                  };
                  currentRoom.status = "lobby";
                  currentRoom.message = `${friendName} düello davetini kabul etti!`;
                  socket.emit("friend:duel:accepted", { fromPlayerName: friendName, roomCode: code });
                  emitRoom(io, currentRoom);
                }
              }, 1600);
            } else {
              socket.emit("friend:duel:failed", {
                message: `${toUsername || "Arkadaşınız"} şu an çevrim dışı görünüyor.`,
              });
            }
          }
        }
      }
    );

    socket.on(
      "room:join",
      (payload: {
        code: string;
        playerId: string;
        playerName: string;
        profile?: z.infer<typeof playerProfileSchema>;
      }) => {
        if (!isValidPayload(roomJoinSchema, payload)) return fail(socket, "Geçersiz oda katılımı.");
        if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
        const room = rooms.get(cleanCode(payload.code));
        if (!room) return fail(socket, "Bu oda bulunamadı veya süresi doldu.");
        if (room.status === "playing" || room.status === "finished")
          return fail(socket, "Bu odada maç başladı; yeni oda kurun.");
        if (room.host.id === payload.playerId) {
          room.host.socketId = socket.id;
          room.host.connected = true;
          if (payload.profile) Object.assign(room.host, payload.profile);
          socket.join(`room:${room.code}`);
          return emitRoom(io, room);
        }
        if (room.guest && room.guest.id !== payload.playerId && !room.guest.isBot)
          return fail(socket, "Bu oda zaten dolu.");
        room.guest = {
          id: payload.playerId,
          name: payload.playerName.trim().slice(0, 16) || "OYUNCU 2",
          isBot: false,
          socketId: socket.id,
          connected: true,
          ready: false,
          rematch: false,
          ...(payload.profile || {}),
        };
        room.status = "lobby";
        room.message = "İki oyuncu da hazır olduğunda kelime avı başlar.";
        socket.join(`room:${room.code}`);
        emitRoom(io, room);
      }
    );

    socket.on("room:reconnect", (payload: { code: string; playerId: string }) => {
      if (!isValidPayload(roomPlayerActionSchema, payload)) return fail(socket, "Geçersiz yeniden bağlanma isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const room = rooms.get(cleanCode(payload.code));
      const player = room ? roomForPlayer(room, payload.playerId) : null;
      if (!room || !player) {
        socket.emit("room:error", { message: "Oda süresi doldu veya sonlandırıldı." });
        return;
      }

      if (player.socketId && player.socketId !== socket.id) {
        const oldSocket = io.sockets.sockets.get(player.socketId);
        if (oldSocket && oldSocket.id !== socket.id) {
          oldSocket.leave(`room:${room.code}`);
        }
      }

      player.socketId = socket.id;
      player.connected = true;
      if (room.disconnectTimer && room.disconnectPlayerId === player.id) {
        clearTimeout(room.disconnectTimer);
        room.disconnectTimer = null;
        room.disconnectPlayerId = null;
        room.disconnectExpiresAt = null;
        room.message = `${player.name} maça yeniden bağlandı!`;
      }
      socket.join(`room:${room.code}`);
      emitRoom(io, room);
    });

    socket.on("room:ready", (payload: { code: string; playerId: string }) => {
      if (!isValidPayload(roomPlayerActionSchema, payload)) return fail(socket, "Geçersiz hazır olma isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const room = rooms.get(cleanCode(payload.code));
      const player = room ? playerForSocket(room, socket, payload.playerId) : null;
      if (!room || !player || !room.guest) return fail(socket, "Önce iki oyuncunun da odaya katılması gerekiyor.");
      if (room.status !== "lobby") return;
      player.ready = true;
      const otherPlayer = player === room.host ? room.guest : room.host;
      if (
        otherPlayer &&
        (otherPlayer.isBot ||
          /^f\d+$/.test(otherPlayer.id) ||
          otherPlayer.id.startsWith("friend:") ||
          otherPlayer.id.startsWith("bot:") ||
          otherPlayer.id.startsWith("mock:"))
      ) {
        otherPlayer.ready = true;
      }
      if (room.host.ready && room.guest.ready) return startRound(io, room);
      room.message = `${player.name} hazır. Rakip bekleniyor.`;
      emitRoom(io, room);
    });

    socket.on("word:submit", (payload: { code: string; playerId: string; selection: number[] }) => {
      if (!isValidPayload(wordSubmitSchema, payload)) return fail(socket, "Geçersiz kelime seçimi.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");

      const now = Date.now();
      if (!socket.data.lastSubmitReset || now - socket.data.lastSubmitReset > 1000) {
        socket.data.lastSubmitReset = now;
        socket.data.submitCount = 0;
      }
      socket.data.submitCount = (socket.data.submitCount || 0) + 1;
      if (socket.data.submitCount > 12) return;

      const room = rooms.get(cleanCode(payload.code));
      const player = room ? playerForSocket(room, socket, payload.playerId) : null;
      if (!room || !player || room.status !== "playing") return;
      if (room.startedAt) {
        // İstemci ve sunucu saat farkı (clock skew) ve son an ağ gecikmesi için 400ms esneklik payı
        if (Date.now() < room.startedAt - 400) return socket.emit("word:rejected", { word: "", reason: "starting" });
        const durationMs = getRoundDurationMs(room.size);
        if (Date.now() >= room.startedAt + durationMs + 1000) {
          return socket.emit("word:rejected", { word: "", reason: "time_up" });
        }
      }
      const selection = payload.selection;
      const validIndices =
        selection.length >= 2 &&
        new Set(selection).size === selection.length &&
        selection.every((index) => Number.isInteger(index) && index >= 0 && index < room.board.length) &&
        selection.every((index, indexInSelection) => indexInSelection === 0 || isAdjacent(selection[indexInSelection - 1]!, index, room.size));
      if (!validIndices) return socket.emit("word:rejected", { word: "" });
      const word = wordFromSelection(room.board, selection);
      const targetWord = room.words.find((w) => isEqualTr(w, word));

      if (room.foundWords.some((entry) => isEqualTr(entry.word, word) && entry.playerId === player.id)) {
        return socket.emit("word:rejected", { word, reason: "already_found" });
      }
      if (targetWord) {
        claimWord(io, room, player.id, targetWord, selection);
      } else {
        if (!room.bonusWords) room.bonusWords = {};
        const playerBonusList = room.bonusWords[player.id] || [];
        const isAlreadyBonus = playerBonusList.some((b) => isEqualTr(b, word));

        if (!isAlreadyBonus && isValidTurkishWord(word)) {
          // Oyuncu geçerli bir gizli bonus kelime buldu!
          playerBonusList.push(word);
          room.bonusWords[player.id] = playerBonusList;

          // Bonus skor ve çip ödülü: +10 puan
          const bonusPoints = 10;
          room.scores[player.id] = (room.scores[player.id] ?? 0) + bonusPoints;
          room.message = `${player.name} gizli bonus kelime buldu: “${word}”! +${bonusPoints} puan ✨`;

          // Hem odaya anlık skor güncellemesini hem de oyuncuya özel bonus bilgisini ilet
          emitRoom(io, room);
          socket.emit("word:bonus", { word, selection, bonusPoints, coins: 2 });
          return;
        }

        return socket.emit("word:rejected", { word, reason: isAlreadyBonus ? "already_found" : "invalid" });
      }
    });

    socket.on("room:rematch", (payload: { code: string; playerId: string }) => {
      if (!isValidPayload(roomPlayerActionSchema, payload)) return fail(socket, "Geçersiz rövanş isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const room = rooms.get(cleanCode(payload.code));
      const player = room ? playerForSocket(room, socket, payload.playerId) : null;
      if (!room || !player || !room.guest || room.status !== "finished") return;
      if (player.rematch && room.guest.isBot && room.rematchTimer) return;
      player.rematch = true;
      if (room.guest.isBot) {
        room.message = "Yapay rakip rövanş teklifini inceliyor...";
        emitRoom(io, room);
        if (room.rematchTimer) clearTimeout(room.rematchTimer);
        room.rematchTimer = setTimeout(() => {
          room.rematchTimer = null;
          const finalRoom = rooms.get(room.code);
          if (!finalRoom || finalRoom !== room || room.status !== "finished" || !player.rematch) return;
          room.guest!.rematch = true;
          room.host.ready = true;
          room.guest!.ready = true;
          startRound(io, room);
        }, 1500);
        return;
      }
      if (room.host.rematch && room.guest.rematch) {
        room.host.ready = true;
        room.guest.ready = true;
        startRound(io, room);
        return;
      }
      room.message = `${player.name} rövanş istiyor.`;
      emitRoom(io, room);
    });

    socket.on("room:leave", (payload: { code: string; playerId: string }) => {
      if (!isValidPayload(roomPlayerActionSchema, payload)) return fail(socket, "Geçersiz ayrılma isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const room = rooms.get(cleanCode(payload.code));
      if (room && playerForSocket(room, socket, payload.playerId)) leaveRoom(io, socket, room, payload.playerId);
    });

    socket.on("room:emote", (payload: { code: string; playerId: string; emote: string }) => {
      if (!isValidPayload(roomEmoteSchema, payload)) return fail(socket, "Geçersiz tepki isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const now = Date.now();
      if (socket.data.lastEmoteAt && now - socket.data.lastEmoteAt < 800) return;
      socket.data.lastEmoteAt = now;
      const room = rooms.get(cleanCode(payload.code));
      if (!room) return;
      const player = playerForSocket(room, socket, payload.playerId);
      if (!player) return;

      io.to(`room:${room.code}`).emit("room:emote:received", {
        playerId: player.id,
        playerName: player.name,
        emote: payload.emote,
      });

      const other = room.host.id === player.id ? room.guest : room.host;
      if (other && other.isBot && room.status === "playing") {
        if (Math.random() > 0.35) {
          setTimeout(() => {
            const currentRoom = rooms.get(room.code);
            if (!currentRoom || currentRoom.status === "finished") return;
            const botEmotes = ["🔥", "👏", "⚡", "😎", "🤝", "🤖"];
            const botEmote = botEmotes[Math.floor(Math.random() * botEmotes.length)]!;
            io.to(`room:${room.code}`).emit("room:emote:received", {
              playerId: other.id,
              playerName: other.name,
              emote: botEmote,
            });
          }, 1000 + Math.random() * 800);
        }
      }
    });

    // --- SOSYAL VE ARKADAŞLIK SOKETLERİ ---
    if (socket.data.userId) {
      registerUserSocket(socket.data.userId, socket.id);
    }
    registerFriendSocketHandlers(io, socket, ownsPlayerId, rooms);

    socket.on("disconnect", () => {
      pendingDuelInvites.delete(socket.id);
      removeSocketFromAllUsers(socket.id);

      const pendingMatchmakingTimer = matchmakingTimers.get(socket.id);
      if (pendingMatchmakingTimer) {
        clearTimeout(pendingMatchmakingTimer);
        matchmakingTimers.delete(socket.id);
      }
      for (const [size, queue] of matchmakingQueue.entries()) {
        const filtered = queue.filter((p) => p.socketId !== socket.id);
        matchmakingQueue.set(size, filtered);
      }
      for (const room of rooms.values()) {
        const player = [room.host, room.guest].find((entry) => entry?.socketId === socket.id);
        if (!player) continue;
        player.connected = false;
        player.socketId = null;

        if (room.status === "lobby" || room.status === "waiting") {
          leaveRoom(io, socket, room, player.id);
        } else if (room.status === "finished") {
          const hostConnected = room.host?.connected;
          const guestConnected = room.guest && !room.guest.isBot ? room.guest.connected : false;
          if (!hostConnected && !guestConnected) {
            destroyRoom(room.code, room);
          } else {
            emitRoom(io, room);
          }
        } else if (room.status === "playing") {
          const opponent = room.host.id === player.id ? room.guest : room.host;
          room.message = `${player.name} bağlantısı koptu. (15s içinde yeniden bağlanmazsa hükmen yenilecek)`;
          emitRoom(io, room);

          if (room.disconnectTimer) clearTimeout(room.disconnectTimer);
          room.disconnectPlayerId = player.id;
          room.disconnectExpiresAt = Date.now() + 15_000;
          emitRoom(io, room);

          room.disconnectTimer = setTimeout(() => {
            const currentRoom = rooms.get(room.code);
            if (!currentRoom || currentRoom.status !== "playing") return;
            const currentPlayer = currentRoom.host.id === player.id ? currentRoom.host : currentRoom.guest;
            if (currentPlayer && !currentPlayer.connected) {
              const currentOpponent = currentRoom.host.id === player.id ? currentRoom.guest : currentRoom.host;
              if (currentOpponent) {
                currentRoom.winnerId = currentOpponent.id;
                currentRoom.message = `${currentPlayer.name} maçı terk etti. ${currentOpponent.name} hükmen kazandı!`;
              } else {
                currentRoom.winnerId = null;
                currentRoom.message = `${currentPlayer.name} maçı terk etti.`;
              }
              currentRoom.status = "finished";
              if (currentRoom.roundEndTimer) {
                clearTimeout(currentRoom.roundEndTimer);
                currentRoom.roundEndTimer = undefined;
              }
              if (currentRoom.botTurnTimer) {
                clearTimeout(currentRoom.botTurnTimer);
                currentRoom.botTurnTimer = undefined;
              }
              if (currentRoom.disconnectTimer) {
                clearTimeout(currentRoom.disconnectTimer);
                currentRoom.disconnectTimer = undefined;
              }
              recordRoundForLeaderboard(io, currentRoom);
              emitRoom(io, currentRoom);
            }
          }, 15_000);
        } else {
          room.message = `${player.name} bağlantısını yeniliyor…`;
          emitRoom(io, room);
        }
      }
    });
  });

  const roomSweeper = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      const hostConnected = room.host?.connected;
      const guestConnected = room.guest && !room.guest.isBot ? room.guest.connected : false;
      const noHumanConnected = !hostConnected && !guestConnected;

      if (room.status === "finished" && noHumanConnected) {
        destroyRoom(code, room);
        continue;
      }
      if (room.startedAt && now - room.startedAt > ROOM_TTL_MS) {
        destroyRoom(code, room);
        continue;
      }
      if (
        (room.status === "waiting" || room.status === "lobby") &&
        noHumanConnected &&
        now - room.touchedAt > 10 * 60 * 1000
      ) {
        destroyRoom(code, room);
        continue;
      }
      if (room.status === "waiting" && now - room.touchedAt > 30 * 60 * 1000) {
        destroyRoom(code, room);
        continue;
      }
    }
  }, 60_000);

  if (roomSweeper && typeof roomSweeper.unref === "function") {
    roomSweeper.unref();
  }
}
