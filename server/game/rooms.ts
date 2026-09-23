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
  type FoundWord,
  type GamePlayer,
  type LeaderboardEntry,
  type RoomSnapshot,
  type RoomStatus,
} from "../../shared/game";
import { createSoloBoard } from "../../shared/solo";
import { DEFAULT_PROGRESS, getLeagueTier, applyMatchProgress, type PlayerProgress } from "../../shared/progression";
import { getRandomBotPersona } from "../../shared/botPersonas";
import { UserModel, createFriendRequest, getPendingFriendRequests, updateFriendRequestStatus, findFriendRequestById, type FriendRequest } from "../db";
import { loadLeaderboard, recordLeaderboardRounds } from "./mongo-store";
import { normalizeTr, isEqualTr } from "../../shared/tr-utils";

type PlayerRecord = GamePlayer & { socketId: string | null };

type Room = {
  code: string;
  size: BoardSize;
  status: RoomStatus;
  board: string[];
  words: string[];
  routes: Record<string, number[]>;
  foundWords: FoundWord[];
  scores: Record<string, number>;
  host: PlayerRecord;
  guest: PlayerRecord | null;
  winnerId: string | null;
  startedAt: number | null;
  message: string;
  touchedAt: number;
  botFillToken: number;
  roundToken: number;
  botSelection?: number[];
  lastWordFoundTime?: Record<string, number>;
  comboCount?: Record<string, number>;
  disconnectTimer?: NodeJS.Timeout | null;
  disconnectPlayerId?: string | null;
  disconnectExpiresAt?: number | null;
  rematchTimer?: NodeJS.Timeout | null;
  isCustom?: boolean;
  isRanked?: boolean;
};

type QueueEntry = {
  playerId: string;
  playerName: string;
  socketId: string;
  profile?: z.infer<typeof playerProfileSchema>;
};

const rooms = new Map<string, Room>();
const matchmakingQueue = new Map<BoardSize, QueueEntry[]>();
const matchmakingTimers = new Map<string, NodeJS.Timeout>();
const leaderboard = new Map<string, LeaderboardEntry>();
// Soket bazlı bekleyen düello davetleri (spoofing koruması için)
const pendingDuelInvites = new Map<string, { fromPlayerId: string; roomCode: string; expiresAt: number }>();
const ROOM_TTL_MS = 15 * 60 * 1000;
const playerIdSchema = z.string().trim().min(1).max(128);
const playerNameSchema = z.string().max(100);
const codeSchema = z.string().trim().min(1).max(16);
const sizeSchema = z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)]);
const playerProfileSchema = z.object({
  avatar: z.string().optional(),
  // Base64 fotoğraf için üst boyut limiti ( bellek/bant genişliği istismarını önler)
  avatarPhoto: z.string().max(250_000).optional(),
  selectedTitle: z.string().optional(),
  selectedFrame: z.string().optional(),
  level: z.number().optional(),
  tier: z.string().optional(),
  lp: z.number().optional(),
  wins: z.number().optional(),
  matches: z.number().optional(),
  streak: z.number().optional(),
  bestScore: z.number().optional(),
  bestTempo: z.number().optional(),
}).optional();

const matchmakingJoinSchema = z.object({ playerId: playerIdSchema, playerName: playerNameSchema, size: sizeSchema, profile: playerProfileSchema });
const matchmakingLeaveSchema = z.object({ playerId: playerIdSchema, size: sizeSchema });
const roomCreateSchema = z.object({
  playerId: playerIdSchema,
  playerName: playerNameSchema,
  size: sizeSchema,
  immediateBot: z.boolean().optional(),
  profile: playerProfileSchema,
  inviteTarget: z.object({
    toPlayerId: z.string(),
    toUsername: z.string().optional(),
    botProfile: playerProfileSchema.optional(),
  }).optional(),
});
const roomJoinSchema = z.object({ code: codeSchema, playerId: playerIdSchema, playerName: playerNameSchema, profile: playerProfileSchema });
const roomPlayerActionSchema = z.object({ code: codeSchema, playerId: playerIdSchema });
const roomEmoteSchema = z.object({ code: codeSchema, playerId: playerIdSchema, emote: z.string().min(1).max(10) });
const wordSubmitSchema = z.object({ code: codeSchema, playerId: playerIdSchema, selection: z.array(z.number().int().min(0).max(99)).min(2).max(100) });

function isValidPayload<T>(schema: z.ZodType<T>, payload: unknown): payload is T {
  return schema.safeParse(payload).success;
}

function makeCode() {
  let code = "";
  do code = Math.random().toString(36).slice(2, 7).toUpperCase();
  while (rooms.has(code));
  return code;
}

function buildBoard(size: BoardSize) {
  // 100% Tam Hücre Dolumu Garantisi:
  // Rastgele dolgu harf yok, boşta kalan kutucuk yok.
  // 4x4 (16 hücre), 6x6 (36 hücre), 8x8 (64 hücre), 10x10 (100 hücre)
  const representativeLevel = size === 4 ? 5 : size === 6 ? 25 : size === 8 ? 55 : 85;
  const variation = Math.floor(Math.random() * 1_000_000);
  const solo = createSoloBoard(representativeLevel, variation, "general");
  return {
    board: solo.board,
    words: solo.words,
    routes: solo.routes,
  };
}

function snapshot(room: Room, viewerId: string): RoomSnapshot {
  const players = [room.host, room.guest].filter(Boolean).map((player) => ({
    id: player!.id,
    name: player!.name,
    isBot: Boolean(player!.isBot),
    connected: player!.connected,
    ready: player!.ready,
    rematch: player!.rematch,
    avatar: player!.avatar,
    avatarPhoto: player!.avatarPhoto,
    selectedTitle: player!.selectedTitle,
    selectedFrame: player!.selectedFrame,
    level: player!.level,
    tier: player!.tier,
    lp: player!.lp,
    wins: player!.wins,
    matches: player!.matches,
    streak: player!.streak,
    bestScore: player!.bestScore,
    bestTempo: player!.bestTempo,
  }));
  const viewerFoundSet = new Set(room.foundWords.filter((e) => e.playerId === viewerId).map((e) => e.word));
  // Oyuncuya kendi kelimeleri açık, rakip/bot kelimeleri ise sadece skor/sayaç hesabı için gizli/boş gönderilir
  const foundWords = room.foundWords.map((entry) =>
    entry.playerId === viewerId
      ? { ...entry, hidden: false }
      : { ...entry, word: "", path: [], hidden: true }
  );
  // Oyuncunun bulamadığı tüm gizli kelimeler (oyun bitince rotalarıyla birlikte)
  const missedWords = room.status === "finished"
    ? room.words
        .filter((w) => !viewerFoundSet.has(w))
        .map((w) => ({ word: w, path: room.routes[w] ?? [] }))
    : undefined;

  let viewerMessage = room.message;
  if (room.status === "playing") {
    const lastFound = room.foundWords[room.foundWords.length - 1];
    if (lastFound && lastFound.playerId !== viewerId && lastFound.word) {
      viewerMessage = viewerMessage.replace(`“${lastFound.word}”`, "bir kelime");
    }
  }

  return {
    code: room.code,
    size: room.size,
    status: room.status,
    board: room.board,
    wordsTotal: room.words.length,
    foundWords,
    missedWords,
    scores: room.scores,
    players,
    winnerId: room.winnerId,
    startedAt: room.startedAt,
    message: viewerMessage,
    botSelection: undefined, // Bot seçimi oyuncu ekranında gösterilmez
    combos: room.comboCount,
    disconnectExpiresAt: room.disconnectExpiresAt ?? null,
    isCustom: room.isCustom ?? false,
    isRanked: room.isRanked ?? false,
  };
}

function emitRoom(io: Server, room: Room) {
  room.touchedAt = Date.now();
  [room.host, room.guest].filter(Boolean).forEach((player) => {
    if (player!.socketId) io.to(player!.socketId).emit("room:update", snapshot(room, player!.id));
  });
}

function leaderboardSnapshot() {
  return [...leaderboard.values()].sort((left, right) => right.score - left.score || right.wins - left.wins).slice(0, 20);
}

function publishLeaderboard(io: Server) {
  io.emit("leaderboard:update", leaderboardSnapshot());
  void loadLeaderboard().then((persisted) => {
    if (persisted) io.emit("leaderboard:update", persisted);
  });
}

async function recordRoundForLeaderboard(io: Server, room: Room) {
  const finalScores = { ...room.scores };
  const finalWinnerId = room.winnerId;
  const activeHumanPlayers = [room.host, room.guest].filter((player): player is PlayerRecord => Boolean(player && !player.isBot));
  const isBotMatch = Boolean(room.guest?.isBot);
  const isDraw = !finalWinnerId;
  const isUnrankedFriendly = Boolean(room.isCustom || !room.isRanked);

  // Calculate elapsed round time and words
  const elapsedSeconds = room.startedAt ? Math.max(1, Math.floor((Date.now() - room.startedAt) / 1000)) : 60;

  // Process and update authoritative LP/XP/Coins on DB for each player
  const roundsToRecord = await Promise.all(
    activeHumanPlayers.map(async (player) => {
      const roundScore = finalScores[player.id] ?? 0;
      const won = finalWinnerId === player.id;
      const myWords = room.foundWords.filter((w) => w.playerId === player.id).map((w) => w.word);
      const tempo = Math.round((myWords.length * 60 / elapsedSeconds) * 10) / 10;
      const opponentPlayer = [room.host, room.guest].find((p) => p && p.id !== player.id);
      const opponentScore = opponentPlayer ? (finalScores[opponentPlayer.id] ?? 0) : 0;

      let currentLp = 0;
      let currentTier = "DEMİR";
      let userAvatar: string | undefined;
      let userAvatarPhoto: string | undefined;
      let userSelectedTitle: string | undefined;
      let userSelectedFrame: string | undefined;

      try {
        const dbUser = await UserModel.findOne({ openId: player.id });
        if (dbUser) {
          const prevProgress = { ...DEFAULT_PROGRESS, ...(dbUser.progress || {}) } as PlayerProgress;
          const nextProgress = applyMatchProgress(
            prevProgress,
            {
              score: roundScore,
              tempo,
              won,
              isDraw,
              foundWords: myWords,
              size: room.size,
              opponentName: opponentPlayer?.name || (isBotMatch ? "Siber Bot" : "Rakip"),
              opponentAvatar: opponentPlayer?.avatar,
              opponentScore,
              isFriendGame: isUnrankedFriendly,
            },
            isBotMatch ? "bot" : "pvp"
          );

          dbUser.progress = nextProgress;
          dbUser.updatedAt = new Date();
          await dbUser.save();

          currentLp = isUnrankedFriendly ? (prevProgress.lp ?? 0) : (nextProgress.lp ?? 0);
          currentTier = getLeagueTier(currentLp).tier;
          userAvatar = nextProgress.selectedAvatar || player.avatar;
          userAvatarPhoto = nextProgress.avatarPhoto || player.avatarPhoto;
          userSelectedTitle = nextProgress.selectedTitle || player.selectedTitle;
          userSelectedFrame = nextProgress.selectedFrame || player.selectedFrame;
        } else {
          currentTier = getLeagueTier(0).tier;
          userAvatar = player.avatar;
          userAvatarPhoto = player.avatarPhoto;
          userSelectedTitle = player.selectedTitle;
          userSelectedFrame = player.selectedFrame;
        }
      } catch (err) {
        console.error(`[Leaderboard] Error updating user ${player.id} progress:`, err);
      }

      if (!isUnrankedFriendly) {
        // In-memory leaderboard (sadece dereceli eşleşmeler için)
        const previous = leaderboard.get(player.id) ?? { id: player.id, name: player.name, score: 0, wins: 0, matches: 0, bestRound: 0 };
        const nextScore = previous.score + roundScore;
        leaderboard.set(player.id, {
          ...previous,
          name: player.name,
          score: nextScore,
          wins: previous.wins + (won ? 1 : 0),
          matches: previous.matches + 1,
          bestRound: Math.max(previous.bestRound, roundScore),
          lp: currentLp,
          tier: currentTier,
          avatar: userAvatar,
          avatarPhoto: userAvatarPhoto,
          selectedTitle: userSelectedTitle,
          selectedFrame: userSelectedFrame,
          level: Math.floor(nextScore / 200) + 1,
        });
      }

      return {
        id: player.id,
        name: player.name,
        score: roundScore,
        won,
        lp: currentLp,
        tier: currentTier,
        avatar: userAvatar,
        avatarPhoto: userAvatarPhoto,
        selectedTitle: userSelectedTitle,
        selectedFrame: userSelectedFrame,
      };
    })
  );

  if (!isUnrankedFriendly) {
    publishLeaderboard(io);
    void recordLeaderboardRounds(roundsToRecord).then((persisted) => {
      if (persisted) io.emit("leaderboard:update", persisted);
    });
  }
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

function findWordPath(board: string[], size: BoardSize, word: string) {
  const visit = (index: number, offset: number, used: number[]): number[] | null => {
    if (board[index] !== word[offset]) return null;
    const nextUsed = [...used, index];
    if (offset === word.length - 1) return nextUsed;
    const row = Math.floor(index / size);
    const column = index % size;
    const neighbors = [
      [row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1],
    ];
    for (const [nextRow, nextColumn] of neighbors) {
      const nextIndex = nextRow * size + nextColumn;
      if (
        nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size &&
        !nextUsed.includes(nextIndex)
      ) {
        const path = visit(nextIndex, offset + 1, nextUsed);
        if (path) return path;
      }
    }
    return null;
  };
  for (let index = 0; index < board.length; index += 1) {
    const path = visit(index, 0, []);
    if (path) return path;
  }
  return null;
}

function finishRound(io: Server, room: Room) {
  if (room.status !== "playing") return;
  if (room.disconnectTimer) {
    clearTimeout(room.disconnectTimer);
    room.disconnectTimer = null;
    room.disconnectPlayerId = null;
    room.disconnectExpiresAt = null;
  }
  const players = [room.host, room.guest].filter(Boolean);
  const hostScore = room.scores[room.host.id] ?? 0;
  const guestScore = room.guest ? (room.scores[room.guest.id] ?? 0) : 0;
  
  room.status = "finished";
  
  if (room.guest && hostScore === guestScore) {
    room.winnerId = null;
    room.message = `Berabere! İki oyuncu da ${hostScore} puan topladı.`;
  } else {
    const winner = hostScore > guestScore ? room.host : (room.guest || room.host);
    room.winnerId = winner.id;
    room.message = `${winner.name} ${room.scores[winner.id] ?? 0} puanla turu kazandı!`;
  }

  recordRoundForLeaderboard(io, room);
  emitRoom(io, room);
}

function claimWord(io: Server, room: Room, playerId: string, word: string, path: number[]) {
  if (room.status !== "playing" || room.foundWords.some((entry) => entry.word === word && entry.playerId === playerId)) return false;
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
  room.message = `${player?.name ?? "OYUNCU"} “${word}” buldu! +${earnedPoints}${multiplier > 1 ? ` · ×${multiplier} çarpan` : ""}${combo >= 2 ? ` · 🔥 COMBO x${combo} (+${comboBonus})` : ""}`;
  
  const playerWords = room.foundWords.filter((entry) => entry.playerId === playerId).map((entry) => entry.word);
  const hasFoundAll = room.words.every((w) => playerWords.includes(w));
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
  const word = room.words.find((candidate) => !room.foundWords.some((entry) => entry.word === candidate && entry.playerId === bot.id));
  if (!word) return;

  const delay = botThinkDelayMs(room.size, word.length) + (isFirstTurn ? 2500 : 0);
  const selectTriggerDelay = Math.max(800, delay - 1200);

  setTimeout(() => {
    const current = rooms.get(room.code);
    if (!current || current !== room || room.roundToken !== token || room.status !== "playing") return;
    const path = room.routes[word] || findWordPath(room.board, room.size, word);
    if (path) {
      room.botSelection = path;
      setTimeout(() => {
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
  const duration = getRoundDurationMs(room.size) + 3000;
  setTimeout(() => {
    if (rooms.get(room.code) === room && room.roundToken === token) finishRound(io, room);
  }, duration);
}

function scheduleBotFill(io: Server, room: Room) {
  const token = ++room.botFillToken;
  setTimeout(() => {
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

  // Eğer maç oynanırken bir oyuncu odadan çıkarsa, kalan oyuncu hükmen kazanır
  if (room.status === "playing") {
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
    // Bot kalmışsa veya kimse kalmadıysa odayı temizle
    destroyRoom(room.code, room);
    return;
  }

  // Maç tamamlanmışken bir oyuncu odadan çıkarsa: kalan oyuncu sonuç ekranını ve tahtadaki kelimeleri rahatça inceleyebilsin
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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const userSocketMap = new Map<string, Set<string>>();

function registerUserSocket(identifier: string, socketId: string) {
  if (!identifier) return;
  const key = normalizeTr(identifier);
  let set = userSocketMap.get(key);
  if (!set) {
    set = new Set();
    userSocketMap.set(key, set);
  }
  set.add(socketId);
}

function unregisterUserSocket(identifier: string, socketId: string) {
  if (!identifier) return;
  const key = normalizeTr(identifier);
  const set = userSocketMap.get(key);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) userSocketMap.delete(key);
  }
}

function getSocketsForUser(identifier: string): string[] {
  if (!identifier) return [];
  const set = userSocketMap.get(normalizeTr(identifier));
  return set ? Array.from(set) : [];
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
    } catch {
      socket.data.userId = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    const ownsPlayerId = (playerId: string) => {
      if (socket.data.userId) {
        return socket.data.userId === playerId;
      }
      // Anonim/misafir soketler kayıtlı kullanıcıların (usr_*) kimliğini taklit edemez
      if (playerId.startsWith("usr_")) {
        return false;
      }
      // Soketi bu bağlantıda kullandığı ilk misafir ID'sine bağla
      if (!socket.data.boundPlayerId) {
        socket.data.boundPlayerId = playerId;
        return true;
      }
      return socket.data.boundPlayerId === playerId;
    };
    socket.emit("leaderboard:update", leaderboardSnapshot());
    void loadLeaderboard().then((persisted) => {
      if (persisted) socket.emit("leaderboard:update", persisted);
    });
    socket.on("leaderboard:request", () => {
      socket.emit("leaderboard:update", leaderboardSnapshot());
      void loadLeaderboard().then((persisted) => {
        if (persisted) socket.emit("leaderboard:update", persisted);
      });
    });
    socket.on("matchmaking:join", (payload: { playerId: string; playerName: string; size: BoardSize }) => {
      if (!isValidPayload(matchmakingJoinSchema, payload)) return fail(socket, "Geçersiz eşleştirme isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      if (!BOARD_SIZES.includes(payload.size)) return fail(socket, "Geçersiz tahta boyutu.");

      // Tüm boyutlardaki önceki olası kuyruk kayıtlarını temizle (hayalet oyuncuları ve boyut çakışmalarını önler)
      for (const [s, q] of matchmakingQueue.entries()) {
        matchmakingQueue.set(s, q.filter(p => p.playerId !== payload.playerId && p.socketId !== socket.id));
      }

      let queue = matchmakingQueue.get(payload.size) || [];

      // Canlı ve bağlı bir rakip bulana kadar kuyruğu incele
      let opponent: typeof queue[0] | undefined;
      while (queue.length > 0) {
        const candidate = queue.shift()!;
        const candidateSocket = io.sockets.sockets.get(candidate.socketId || "");
        if (candidateSocket && candidateSocket.connected) {
          opponent = candidate;
          break;
        } else {
          // Bağlantısı kopmuş adayı ve zamanlayıcısını temizle
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
        queue.push({ playerId: payload.playerId, playerName: payload.playerName, socketId: socket.id, profile: payload.profile });
        matchmakingQueue.set(payload.size, queue);
        socket.emit("matchmaking:status", { status: "searching" });
        const timer = setTimeout(() => {
          matchmakingTimers.delete(socket.id);
          // If socket disconnected during the search, skip room creation
          if (!io.sockets.sockets.get(socket.id)?.connected) return;
          const currentQueue = matchmakingQueue.get(payload.size) || [];
          const idx = currentQueue.findIndex(p => p.playerId === payload.playerId && p.socketId === socket.id);
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
        matchmakingQueue.set(s, q.filter(p => p.playerId !== payload.playerId && p.socketId !== socket.id));
      }
      socket.emit("matchmaking:status", { status: "idle" });
    });

    socket.on("room:create", (payload: { playerId: string; playerName: string; size: BoardSize; immediateBot?: boolean; profile?: z.infer<typeof playerProfileSchema> }) => {
      if (!isValidPayload(roomCreateSchema, payload)) return fail(socket, "Geçersiz oda isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      if (!BOARD_SIZES.includes(payload.size)) return fail(socket, "Geçersiz tahta boyutu.");
      // Bu sokete ait önceki boşta bekleyen odayı temizle (bellek sızıntısını ve yetim odaları önler)
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
          ...(toUsername ? getSocketsForUser(toUsername) : [])
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
          const isMockFriend = /^f\d+$/.test(toPlayerId) || toPlayerId.startsWith("mock") || toPlayerId.startsWith("bot");
          if (isMockFriend) {
            socket.emit("friend:duel:sent", { success: true, message: `${toUsername || "Arkadaşınız"} daveti aldı, katılıyor...` });
            setTimeout(() => {
              const currentRoom = rooms.get(code);
              if (currentRoom && currentRoom.status === "waiting" && !currentRoom.guest) {
                const friendName = toUsername || "Arkadaş";
                const bp = payload.inviteTarget?.botProfile;
                currentRoom.guest = {
                  id: toPlayerId.startsWith("bot:") ? toPlayerId : (toPlayerId.startsWith("friend:") ? toPlayerId : `friend:${toPlayerId}`),
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
            socket.emit("friend:duel:failed", { message: `${toUsername || "Arkadaşınız"} şu an çevrim dışı görünüyor.` });
          }
        }
      }
    });

    socket.on("room:join", (payload: { code: string; playerId: string; playerName: string; profile?: z.infer<typeof playerProfileSchema> }) => {
      if (!isValidPayload(roomJoinSchema, payload)) return fail(socket, "Geçersiz oda katılımı.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const room = rooms.get(payload.code.trim().toUpperCase());
      if (!room) return fail(socket, "Bu oda bulunamadı veya süresi doldu.");
      if (room.status === "playing" || room.status === "finished") return fail(socket, "Bu odada maç başladı; yeni oda kurun.");
      if (room.host.id === payload.playerId) {
        room.host.socketId = socket.id;
        room.host.connected = true;
        if (payload.profile) Object.assign(room.host, payload.profile);
        socket.join(`room:${room.code}`);
        return emitRoom(io, room);
      }
      if (room.guest && room.guest.id !== payload.playerId && !room.guest.isBot) return fail(socket, "Bu oda zaten dolu.");
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
    });

    socket.on("room:reconnect", (payload: { code: string; playerId: string }) => {
      if (!isValidPayload(roomPlayerActionSchema, payload)) return fail(socket, "Geçersiz yeniden bağlanma isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const room = rooms.get(payload.code.trim().toUpperCase());
      const player = room ? roomForPlayer(room, payload.playerId) : null;
      if (!room || !player) {
        socket.emit("room:error", { message: "Oda süresi doldu veya sonlandırıldı." });
        return;
      }

      // Önceki veya kopmuş soket varsa odadan çıkar
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
      const room = rooms.get(payload.code.trim().toUpperCase());
      const player = room ? playerForSocket(room, socket, payload.playerId) : null;
      if (!room || !player || !room.guest) return fail(socket, "Önce iki oyuncunun da odaya katılması gerekiyor.");
      if (room.status !== "lobby") return;
      player.ready = true;
      const otherPlayer = player === room.host ? room.guest : room.host;
      if (otherPlayer && (otherPlayer.isBot || /^f\d+$/.test(otherPlayer.id) || otherPlayer.id.startsWith("friend:") || otherPlayer.id.startsWith("bot:") || otherPlayer.id.startsWith("mock:"))) {
        otherPlayer.ready = true;
      }
      if (room.host.ready && room.guest.ready) return startRound(io, room);
      room.message = `${player.name} hazır. Rakip bekleniyor.`;
      emitRoom(io, room);
    });

    socket.on("word:submit", (payload: { code: string; playerId: string; selection: number[] }) => {
      if (!isValidPayload(wordSubmitSchema, payload)) return fail(socket, "Geçersiz kelime seçimi.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      // Saniyede 12'den fazla kelime gönderimini sınırla (flood/DoS ve lag koruması)
      const now = Date.now();
      if (!socket.data.lastSubmitReset || now - socket.data.lastSubmitReset > 1000) {
        socket.data.lastSubmitReset = now;
        socket.data.submitCount = 0;
      }
      socket.data.submitCount = (socket.data.submitCount || 0) + 1;
      if (socket.data.submitCount > 12) return;

      const room = rooms.get(payload.code.trim().toUpperCase());
      const player = room ? playerForSocket(room, socket, payload.playerId) : null;
      if (!room || !player || room.status !== "playing") return;
      if (room.startedAt) {
        if (Date.now() < room.startedAt) return socket.emit("word:rejected", { word: "", reason: "starting" });
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
      const isTargetWord = room.words.includes(word);

      if (room.foundWords.some((entry) => entry.word === word && entry.playerId === player.id)) {
        return socket.emit("word:rejected", { word, reason: "already_found" });
      }
      if (isTargetWord) {
        claimWord(io, room, player.id, word, selection);
      } else {
        return socket.emit("word:rejected", { word, reason: "invalid" });
      }
    });

    socket.on("room:rematch", (payload: { code: string; playerId: string }) => {
      if (!isValidPayload(roomPlayerActionSchema, payload)) return fail(socket, "Geçersiz rövanş isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const room = rooms.get(payload.code.trim().toUpperCase());
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
      const room = rooms.get(payload.code.trim().toUpperCase());
      if (room && playerForSocket(room, socket, payload.playerId)) leaveRoom(io, socket, room, payload.playerId);
    });

    socket.on("room:emote", (payload: { code: string; playerId: string; emote: string }) => {
      if (!isValidPayload(roomEmoteSchema, payload)) return fail(socket, "Geçersiz tepki isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const now = Date.now();
      if (socket.data.lastEmoteAt && now - socket.data.lastEmoteAt < 800) return;
      socket.data.lastEmoteAt = now;
      const room = rooms.get(payload.code.trim().toUpperCase());
      if (!room) return;
      const player = playerForSocket(room, socket, payload.playerId);
      if (!player) return;

      io.to(`room:${room.code}`).emit("room:emote:received", {
        playerId: player.id,
        playerName: player.name,
        emote: payload.emote,
      });

      // Bot rakip varsa duruma göre tepki verme ihtimali
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

    socket.on("player:identify", (payload: { playerId: string; username?: string }) => {
      // Kimlik taklidini önle: sadece bu soketin sahibi olduğu ID'ler kaydedilir
      if (payload?.playerId && ownsPlayerId(payload.playerId)) {
        registerUserSocket(payload.playerId, socket.id);
      }
      if (payload?.username && ownsPlayerId(payload.username)) {
        registerUserSocket(payload.username, socket.id);
      }
    });

    socket.on("friend:request:send", async (payload: {
      toUsername: string;
      fromPlayerId: string;
      fromPlayerName: string;
      profile?: any;
    }) => {
      try {
        const toUsername = payload?.toUsername?.trim();
        if (!toUsername) {
          return socket.emit("friend:error", { message: "Geçerli bir kullanıcı adı girin." });
        }
        // IDOR koruması: gönderen kimlik bu sokete ait olmalı
        if (!ownsPlayerId(payload.fromPlayerId)) {
          return socket.emit("friend:error", { message: "Oyuncu kimliği bu oturuma ait değil." });
        }
        const fromId = payload.fromPlayerId;
        const fromName = payload.fromPlayerName || "OYUNCU";
        const fromUsername = payload.profile?.username || fromName;

        registerUserSocket(fromId, socket.id);
        registerUserSocket(fromUsername, socket.id);

        // Kendi kendine istek gönderemez
        if (isEqualTr(toUsername, fromName) || isEqualTr(toUsername, fromUsername)) {
          return socket.emit("friend:error", { message: "Kendinize arkadaşlık isteği gönderemezsiniz." });
        }

        // Hedef kullanıcıyı veritabanında ara
        let targetUser = await UserModel.findOne({
          $or: [
            { username: normalizeTr(toUsername) },
            { openId: toUsername },
            { name: new RegExp(`^${escapeRegex(toUsername)}$`, "i") }
          ]
        }).lean();

        const targetUserId = targetUser?.openId || toUsername;
        const targetUsernameClean = targetUser?.username || targetUser?.name || toUsername;
        const targetNameClean = targetUser?.name || targetUser?.username || toUsername;

        // Hedef kullanıcının arkadaş listesinde zaten var mı?
        if (targetUser?.progress?.friends && Array.isArray(targetUser.progress.friends)) {
          const isAlreadyFriend = targetUser.progress.friends.some(
            (f: any) => (typeof f === "string" ? f === fromId : f.id === fromId || isEqualTr(f.username, fromUsername))
          );
          if (isAlreadyFriend) {
            return socket.emit("friend:error", { message: "Bu kullanıcı zaten arkadaş listenizde." });
          }
        }

        // Bekleyen istek var mı?
        const existingRequests = await getPendingFriendRequests(targetUserId);
        const alreadyPending = existingRequests.some(
          r => (r.fromUserId === fromId || isEqualTr(r.fromUsername, fromUsername)) && r.status === "pending"
        );
        if (alreadyPending) {
          return socket.emit("friend:error", { message: "Bu kullanıcıya daha önce istek gönderilmiş." });
        }

        const newRequest = await createFriendRequest({
          fromUserId: fromId,
          fromUsername: fromUsername,
          fromName: fromName,
          fromAvatar: payload.profile?.avatar || "spark",
          fromAvatarPhoto: payload.profile?.avatarPhoto,
          fromSelectedTitle: payload.profile?.selectedTitle || "[ÇAYLAK]",
          fromLevel: payload.profile?.level || 1,
          fromTier: payload.profile?.tier || "DEMİR",
          fromLp: payload.profile?.lp || 0,
          fromXp: payload.profile?.xp || 0,
          toUserId: targetUserId,
          toUsername: targetUsernameClean,
          toName: targetNameClean,
        });

        socket.emit("friend:request:sent", {
          success: true,
          message: `${targetNameClean} kullanıcısına arkadaşlık isteği gönderildi!`,
          request: newRequest
        });

        // Hedef kullanıcının aktif soketlerini bul ve anında bildir
        const targetSockets = [
          ...getSocketsForUser(targetUserId),
          ...getSocketsForUser(targetUsernameClean),
          ...getSocketsForUser(toUsername)
        ];
        const uniqueTargetSockets = Array.from(new Set(targetSockets));
        for (const sId of uniqueTargetSockets) {
          io.to(sId).emit("friend:request:received", newRequest);
        }
      } catch (err: any) {
        socket.emit("friend:error", { message: err?.message || "İstek gönderilemedi." });
      }
    });

    socket.on("friend:requests:get", async (payload: { playerId: string; username?: string }) => {
      try {
        if (!payload?.playerId) return;
        // IDOR koruması: sadece kendi bekleyen istekleri listeleyebilir
        if (!ownsPlayerId(payload.playerId)) {
          return socket.emit("friend:error", { message: "Oyuncu kimliği bu oturuma ait değil." });
        }
        registerUserSocket(payload.playerId, socket.id);
        if (payload.username && ownsPlayerId(payload.username)) registerUserSocket(payload.username, socket.id);

        const requestsByUserId = await getPendingFriendRequests(payload.playerId);
        let requestsByUsername: any[] = [];
        if (payload.username) {
          requestsByUsername = await getPendingFriendRequests(payload.username);
        }

        const map = new Map<string, any>();
        requestsByUserId.forEach((r) => map.set(r.id, r));
        requestsByUsername.forEach((r) => map.set(r.id, r));

        socket.emit("friend:requests:list", Array.from(map.values()));
      } catch (err) {
        socket.emit("friend:requests:list", []);
      }
    });

    socket.on("friend:request:respond", async (payload: {
      requestId: string;
      action: "accept" | "reject";
      playerId: string;
      playerName?: string;
      profile?: any;
    }) => {
      try {
        const { requestId, action, playerId } = payload;
        // IDOR koruması: yanıtlayan kimlik bu sokete ait olmalı
        if (!ownsPlayerId(playerId)) {
          return socket.emit("friend:error", { message: "Oyuncu kimliği bu oturuma ait değil." });
        }
        const req = await findFriendRequestById(requestId);
        if (!req) {
          return socket.emit("friend:error", { message: "İstek bulunamadı." });
        }
        // Sadece isteğin gerçek hedefi yanıtlayabilir ve yalnızca bekleyen istekler işlenir
        if (req.toUserId !== playerId) {
          return socket.emit("friend:error", { message: "Bu isteği yanıtlama yetkiniz yok." });
        }
        if (req.status !== "pending") {
          return socket.emit("friend:error", { message: "Bu istek zaten işlenmiş." });
        }

        if (action === "reject") {
          await updateFriendRequestStatus(requestId, "rejected");
          socket.emit("friend:request:rejected", { requestId, success: true });
          return;
        }

        if (action === "accept") {
          await updateFriendRequestStatus(requestId, "accepted");

          // Arkadaş kayıtlarını hazırla
          const friendForAcceptor = {
            id: req.fromUserId,
            name: req.fromName,
            username: req.fromUsername,
            avatar: req.fromAvatar || "spark",
            avatarPhoto: req.fromAvatarPhoto,
            selectedTitle: req.fromSelectedTitle || "[ÇAYLAK]",
            level: req.fromLevel || 1,
            tier: req.fromTier || "DEMİR",
            lp: req.fromLp || 0,
            xp: req.fromXp || 0,
            isOnline: true,
          };

          const friendForRequester = {
            id: playerId,
            name: payload.playerName || req.toName || "OYUNCU",
            username: req.toUsername,
            avatar: payload.profile?.avatar || "spark",
            avatarPhoto: payload.profile?.avatarPhoto,
            selectedTitle: payload.profile?.selectedTitle || "[ÇAYLAK]",
            level: payload.profile?.level || 1,
            tier: payload.profile?.tier || "DEMİR",
            lp: payload.profile?.lp || 0,
            xp: payload.profile?.xp || 0,
            isOnline: true,
          };

          // Veritabanında güncelle
          try {
            await UserModel.findOneAndUpdate(
              { openId: req.toUserId },
              { $push: { "progress.friends": friendForAcceptor } }
            );
            await UserModel.findOneAndUpdate(
              { openId: req.fromUserId },
              { $push: { "progress.friends": friendForRequester } }
            );
          } catch (e) {
            console.warn("[Friend] DB update friends error:", e);
          }

          // Kabul edene bildir
          socket.emit("friend:request:accepted", {
            requestId,
            newFriend: friendForAcceptor,
            message: `${friendForAcceptor.name} ile artık arkadaşsınız!`
          });

          // İstek atanın aktif soketlerine bildir
          const requesterSockets = [
            ...getSocketsForUser(req.fromUserId),
            ...getSocketsForUser(req.fromUsername)
          ];
          const uniqueRequesterSockets = Array.from(new Set(requesterSockets));
          for (const sId of uniqueRequesterSockets) {
            io.to(sId).emit("friend:request:accepted", {
              requestId,
              newFriend: friendForRequester,
              message: `${friendForRequester.name} arkadaşlık isteğinizi kabul etti!`
            });
          }
        }
      } catch (err: any) {
        socket.emit("friend:error", { message: err?.message || "İşlem gerçekleştirilemedi." });
      }
    });

    socket.on("friend:remove", async (payload: { friendId: string; playerId: string }) => {
      try {
        const { friendId, playerId } = payload;
        // IDOR koruması: sadece kendi arkadaş listesinden silebilir
        if (!ownsPlayerId(playerId)) {
          return socket.emit("friend:error", { message: "Oyuncu kimliği bu oturuma ait değil." });
        }
        try {
          await UserModel.findOneAndUpdate(
            { openId: playerId },
            { $pull: { "progress.friends": { $or: [{ id: friendId }, { username: friendId }] } } }
          );
        } catch (e) {
          console.warn("[Friend] DB remove friend error:", e);
        }
        socket.emit("friend:removed", { friendId, success: true });

        // Karşı tarafın soketine de bildirim gönder
        const friendSockets = getSocketsForUser(friendId);
        for (const sId of friendSockets) {
          io.to(sId).emit("friend:removed", { friendId: playerId, success: true });
        }
      } catch (err: any) {
        socket.emit("friend:error", { message: err?.message || "Arkadaş silinemedi." });
      }
    });

    socket.on("friend:duel:invite", (payload: {
      toPlayerId: string;
      toUsername?: string;
      fromPlayerId: string;
      fromPlayerName: string;
      roomCode: string;
      size: BoardSize;
      botProfile?: z.infer<typeof playerProfileSchema>;
    }) => {
      const { toPlayerId, toUsername, fromPlayerId, fromPlayerName, roomCode, size, botProfile } = payload;
      // IDOR koruması: davet, soketin sahibi olduğu kimlikten gönderilmeli
      if (!ownsPlayerId(fromPlayerId)) {
        return socket.emit("friend:duel:failed", { message: "Oyuncu kimliği bu oturuma ait değil." });
      }
      const targetSockets = [
        ...getSocketsForUser(toPlayerId),
        ...(toUsername ? getSocketsForUser(toUsername) : [])
      ];
      const uniqueSockets = Array.from(new Set(targetSockets));

      if (uniqueSockets.length === 0) {
        // Mock friend veya offline friend ile test ediliyorsa:
        // Kullanıcının düello akışını test edebilmesi için daveti kabul eden simüle arkadaş eklenir
        const isMockFriend = /^f\d+$/.test(toPlayerId) || toPlayerId.startsWith("mock") || toPlayerId.startsWith("bot");
        if (isMockFriend) {
          const room = rooms.get(roomCode);
          if (room && room.status === "waiting" && !room.guest) {
            socket.emit("friend:duel:sent", { success: true, message: `${toUsername || "Arkadaşınız"} daveti aldı, katılıyor...` });
            setTimeout(() => {
              const currentRoom = rooms.get(roomCode);
              if (currentRoom && currentRoom.status === "waiting" && !currentRoom.guest) {
                const friendName = toUsername || "Arkadaş";
                const bp = botProfile;
                currentRoom.guest = {
                  id: toPlayerId.startsWith("bot:") ? toPlayerId : (toPlayerId.startsWith("friend:") ? toPlayerId : `friend:${toPlayerId}`),
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
                socket.emit("friend:duel:accepted", { fromPlayerName: friendName, roomCode });
                emitRoom(io, currentRoom);
              }
            }, 1600);
            return;
          }
        }

        socket.emit("friend:duel:failed", { message: "Arkadaşınız şu an çevrim dışı görünüyor." });
        return;
      }

      for (const sId of uniqueSockets) {
        // Hedef soket için bekleyen daveti kaydet (yanıt doğrulamasında kullanılır)
        pendingDuelInvites.set(sId, { fromPlayerId, roomCode, expiresAt: Date.now() + 60_000 });
        io.to(sId).emit("friend:duel:incoming", {
          fromPlayerId,
          fromPlayerName,
          roomCode,
          size,
        });
      }

      socket.emit("friend:duel:sent", { success: true, message: "Düello daveti gönderildi!" });
    });

    socket.on("friend:duel:respond", (payload: {
      toPlayerId: string;
      fromPlayerName: string;
      roomCode: string;
      accepted: boolean;
    }) => {
      const { toPlayerId, fromPlayerName, roomCode, accepted } = payload;
      // Spoofing koruması: bu sokete gerçekten bir düello daveti iletilmiş olmalı
      const pendingInvite = pendingDuelInvites.get(socket.id);
      if (!pendingInvite || pendingInvite.fromPlayerId !== toPlayerId || pendingInvite.roomCode !== roomCode) {
        return socket.emit("friend:duel:failed", { message: "Bu daveti yanıtlama yetkiniz yok." });
      }
      pendingDuelInvites.delete(socket.id);
      const targetSockets = getSocketsForUser(toPlayerId);
      for (const sId of targetSockets) {
        if (accepted) {
          io.to(sId).emit("friend:duel:accepted", { fromPlayerName, roomCode });
        } else {
          io.to(sId).emit("friend:duel:rejected", { fromPlayerName, roomCode });
        }
      }
    });

    socket.on("disconnect", () => {
      pendingDuelInvites.delete(socket.id);
      for (const [key, set] of userSocketMap.entries()) {
        if (set.has(socket.id)) {
          set.delete(socket.id);
          if (set.size === 0) userSocketMap.delete(key);
        }
      }
      const pendingMatchmakingTimer = matchmakingTimers.get(socket.id);
      if (pendingMatchmakingTimer) {
        clearTimeout(pendingMatchmakingTimer);
        matchmakingTimers.delete(socket.id);
      }
      for (const [size, queue] of matchmakingQueue.entries()) {
        const filtered = queue.filter(p => p.socketId !== socket.id);
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
          // Eğer odada bağlı kalan hiçbir insan oyuncu kalmadıysa odayı hafızadan temizle
          const hostConnected = room.host?.connected;
          const guestConnected = room.guest && !room.guest.isBot ? room.guest.connected : false;
          if (!hostConnected && !guestConnected) {
            destroyRoom(room.code, room);
          } else {
            // Oyuncunun geçici bağlantı kopmasında odadaki sonuç ve rövanş verisini koru
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
            if (!player.connected) {
              // Award forfeit victory to opponent if available
              if (opponent) {
                currentRoom.winnerId = opponent.id;
                currentRoom.message = `${player.name} maçı terk etti. ${opponent.name} hükmen kazandı!`;
              } else {
                currentRoom.winnerId = null;
                currentRoom.message = `${player.name} maçı terk etti.`;
              }
              currentRoom.status = "finished";
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

  // Periyodik oda bellek temizliği (her 60 saniyede bir sahipsiz/eski odaları süpürür)
  const roomSweeper = setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      const hostConnected = room.host?.connected;
      const guestConnected = room.guest && !room.guest.isBot ? room.guest.connected : false;
      const noHumanConnected = !hostConnected && !guestConnected;

      // 1. İnsan oyuncusu kalmamış tamamlanan odalar
      if (room.status === "finished" && noHumanConnected) {
        destroyRoom(code, room);
        continue;
      }
      // 2. TTL süresini (15 dakika) aşmış herhangi bir oda (zombi oda koruması)
      if (room.startedAt && now - room.startedAt > ROOM_TTL_MS) {
        destroyRoom(code, room);
        continue;
      }
      // 3. Kimsenin bağlanmadığı 10 dakikadan eski bekleme/lobi odaları
      if ((room.status === "waiting" || room.status === "lobby") && noHumanConnected && now - room.touchedAt > 10 * 60 * 1000) {
        destroyRoom(code, room);
        continue;
      }
      // 4. Bağlı oyuncu olsa bile 30 dakikadan eski bekleme odaları — sonsuz açık kalan lobileri engeller
      if (room.status === "waiting" && now - room.touchedAt > 30 * 60 * 1000) {
        destroyRoom(code, room);
        continue;
      }
    }
  }, 60_000);

  // Sunucu kapanışında timer'ın süreci engellemesini önle
  if (roomSweeper && typeof roomSweeper.unref === "function") {
    roomSweeper.unref();
  }
}
