import type { Server, Socket } from "socket.io";
import { z } from "zod";
import { sdk } from "../_core/sdk";

import {
  BOARD_SIZES,
  botThinkDelayMs,
  fillBoardBlanks,
  getRoundDurationMs,
  isAdjacent,
  TURKISH_LETTERS,
  WORD_BANK,
  WORD_CATALOG,
  WORD_CATALOG_DATA,
  maskOpponentFoundWords,
  pickLiveFourWordLengths,
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
import { DEFAULT_PROGRESS, getLeagueTier } from "../../shared/progression";
import { UserModel } from "../db";
import { loadLeaderboard, recordLeaderboardRounds } from "./mongo-store";

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
const ROOM_TTL_MS = 15 * 60 * 1000;
const playerIdSchema = z.string().trim().min(1).max(128);
const playerNameSchema = z.string().max(100);
const codeSchema = z.string().trim().min(1).max(16);
const sizeSchema = z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10)]);
const playerProfileSchema = z.object({
  avatar: z.string().optional(),
  avatarPhoto: z.string().optional(),
  selectedTitle: z.string().optional(),
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
const roomCreateSchema = z.object({ playerId: playerIdSchema, playerName: playerNameSchema, size: sizeSchema, immediateBot: z.boolean().optional(), profile: playerProfileSchema });
const roomJoinSchema = z.object({ code: codeSchema, playerId: playerIdSchema, playerName: playerNameSchema, profile: playerProfileSchema });
const roomPlayerActionSchema = z.object({ code: codeSchema, playerId: playerIdSchema });
const wordSubmitSchema = z.object({ code: codeSchema, playerId: playerIdSchema, selection: z.array(z.number().int().min(0).max(99)).min(2).max(100) });

function isValidPayload<T>(schema: z.ZodType<T>, payload: unknown): payload is T {
  return schema.safeParse(payload).success;
}

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]!;
}

function shuffled<T>(items: readonly T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[next]] = [copy[next]!, copy[index]!];
  }
  return copy;
}

function makeCode() {
  let code = "";
  do code = Math.random().toString(36).slice(2, 7).toUpperCase();
  while (rooms.has(code));
  return code;
}

function cardinalNeighbors(index: number, size: BoardSize) {
  const row = Math.floor(index / size);
  const column = index % size;
  return [
    [row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1],
  ].flatMap(([nextRow, nextColumn]) => (
    nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size
      ? [nextRow * size + nextColumn]
      : []
  ));
}

function turnCount(path: number[], _size?: any) {
  let turns = 0;
  for (let index = 2; index < path.length; index += 1) {
    const previousStep = path[index - 1]! - path[index - 2]!;
    const nextStep = path[index]! - path[index - 1]!;
    if (previousStep !== nextStep) turns += 1;
  }
  return turns;
}

function routeShape(path: number[], size: BoardSize) {
  return path.slice(1).map((index, offset) => {
    const difference = index - path[offset]!;
    return difference === 1 ? "R" : difference === -1 ? "L" : difference === size ? "D" : "U";
  }).join("");
}

function fullBoardPath(size: BoardSize) {
  const total = size * size;
  const visit = (index: number, path: number[]): number[] | null => {
    const nextPath = [...path, index];
    if (nextPath.length === total) return nextPath;
    const options = shuffled(cardinalNeighbors(index, size)).filter((next) => !nextPath.includes(next));
    for (const next of options) {
      const result = visit(next, nextPath);
      if (result) return result;
    }
    return null;
  };
  for (let attempt = 0; attempt < 240; attempt += 1) {
    const result = visit(Math.floor(Math.random() * total), []);
    if (result) return result;
  }
  return null;
}

function buildFourByFourBoard(words: string[]) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const path = fullBoardPath(4);
    if (!path) continue;
    let cursor = 0;
    const routes = words.map((word) => {
      const route = path.slice(cursor, cursor + word.length);
      cursor += word.length;
      return route;
    });
    if (routes.some((route) => route.length < 2 || (route.length >= 3 && turnCount(route, 4) < 1))) continue;
    if (new Set(routes.map((route) => routeShape(route, 4))).size < 3) continue;
    const board = Array.from({ length: 16 }, () => "");
    const routesMap: Record<string, number[]> = {};
    words.forEach((word, wordIndex) => {
      routesMap[word] = routes[wordIndex]!;
      word.split("").forEach((letter, letterIndex) => {
        board[routes[wordIndex]![letterIndex]!] = letter;
      });
    });
    return { board: fillBoardBlanks(board), words, routes: routesMap };
  }
  const fallbackPath = fullBoardPath(4);
  if (!fallbackPath) {
    // Very unlikely: 120 failed attempts — return words with empty board
    const emptyBoard = fillBoardBlanks(Array.from({ length: 16 }, () => ""));
    return { board: emptyBoard, words, routes: {} };
  }
  const board = Array.from({ length: 16 }, () => "");
  let cursor = 0;
  const routesMap: Record<string, number[]> = {};
  words.forEach((word) => {
    const route = fallbackPath.slice(cursor, cursor + word.length);
    routesMap[word] = route;
    word.split("").forEach((letter, letterIndex) => {
      board[fallbackPath[cursor + letterIndex]!] = letter;
    });
    cursor += word.length;
  });
  return { board: fillBoardBlanks(board), words, routes: routesMap };
}

function pickLiveFourWords() {
  const lengths = pickLiveFourWordLengths();
  const difficultyOrder = shuffled(["easy", "medium", "hard"] as const);
  const words: string[] = [];
  for (let index = 0; index < lengths.length; index += 1) {
    const available = WORD_CATALOG[4].filter((entry) => entry.word.length === lengths[index] && !words.includes(entry.word));
    const preferred = available.filter((entry) => entry.difficulty === difficultyOrder[index % difficultyOrder.length]);
    const selected = randomItem(preferred.length ? preferred : available);
    if (!selected) throw new Error("Canlı 4×4 kelime havuzunda istenen uzunluk için kelime bulunamadı.");
    words.push(selected.word);
  }
  return words;
}

function findOpenRoute(occupied: Set<number>, size: BoardSize, length: number, usedShapes: Set<string>) {
  const requiredTurns = length >= 6 ? 2 : 1;
  const available = Array.from({ length: size * size }, (_, index) => index).filter((index) => !occupied.has(index));
  for (let attempt = 0; attempt < 900; attempt += 1) {
    const start = randomItem(available);
    if (start === undefined) return null;
    const path = [start];
    while (path.length < length) {
      const options = shuffled(cardinalNeighbors(path.at(-1)!, size)).filter((next) => !occupied.has(next) && !path.includes(next));
      if (!options.length) break;
      path.push(options[0]!);
    }
    if (path.length !== length || turnCount(path, size) < requiredTurns) continue;
    const shape = routeShape(path, size);
    if (!usedShapes.has(shape)) return path;
  }
  return null;
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
  const activeHumanPlayers = [room.host, room.guest].filter((player): player is PlayerRecord => Boolean(player && !player.isBot));
  const isBotMatch = Boolean(room.guest?.isBot);
  const isDraw = !room.winnerId;

  // Process and update authoritative LP/XP on DB for each player
  const roundsToRecord = await Promise.all(
    activeHumanPlayers.map(async (player) => {
      const roundScore = room.scores[player.id] ?? 0;
      const won = room.winnerId === player.id;

      let lpDelta = 0;
      let xpDelta = 0;
      if (isBotMatch) {
        if (won) { lpDelta = 15; xpDelta = 35; }
        else if (isDraw) { lpDelta = 0; xpDelta = 20; }
        else { lpDelta = -10; xpDelta = 20; }
      } else {
        if (won) { lpDelta = 25; xpDelta = 60; }
        else if (isDraw) { lpDelta = 0; xpDelta = 40; }
        else { lpDelta = -20; xpDelta = 35; }
      }

      let currentLp = 0;
      let currentTier = "DEMİR";
      let userAvatar: string | undefined;

      try {
        const dbUser = await UserModel.findOne({ openId: player.id });
        if (dbUser) {
          const prevProgress = dbUser.progress || {};
          const prevLp = typeof prevProgress.lp === "number" ? prevProgress.lp : 0;
          const nextLp = Math.max(0, prevLp + lpDelta);

          const updatedUser = await UserModel.findOneAndUpdate(
            { openId: player.id },
            {
              $set: {
                "progress.lp": nextLp,
                updatedAt: new Date(),
              },
              $inc: {
                "progress.xp": xpDelta,
                "progress.wins": won ? 1 : 0,
                "progress.matches": 1,
              },
              $max: {
                "progress.bestScore": roundScore,
              },
            },
            { new: true }
          );

          currentLp = nextLp;
          currentTier = getLeagueTier(nextLp).tier;
          userAvatar = updatedUser?.progress?.selectedAvatar || prevProgress.selectedAvatar;
        } else {
          currentTier = getLeagueTier(0).tier;
        }
      } catch (err) {
        console.error(`[Leaderboard] Error updating user ${player.id} progress:`, err);
      }

      // In-memory leaderboard
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
        level: Math.floor(nextScore / 200) + 1,
      });

      return {
        id: player.id,
        name: player.name,
        score: roundScore,
        won,
        lp: currentLp,
        tier: currentTier,
        avatar: userAvatar,
      };
    })
  );

  publishLeaderboard(io);
  void recordLeaderboardRounds(roundsToRecord).then((persisted) => {
    if (persisted) io.emit("leaderboard:update", persisted);
  });
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
  const delay = botThinkDelayMs(room.size) + (isFirstTurn ? 3000 : 0);
  const selectTriggerDelay = Math.max(1000, delay - 1500);
  setTimeout(() => {
    const current = rooms.get(room.code);
    if (!current || current !== room || room.roundToken !== token || room.status !== "playing") return;
    const word = room.words.find((candidate) => !room.foundWords.some((entry) => entry.word === candidate && entry.playerId === bot.id));
    if (!word) return;
    const path = findWordPath(room.board, room.size, word);
    if (path) {
      room.botSelection = path;
      emitRoom(io, room);
      setTimeout(() => {
        const finalCurrent = rooms.get(room.code);
        if (!finalCurrent || finalCurrent !== room || room.roundToken !== token || room.status !== "playing") return;
        claimWord(io, room, bot.id, word, path);
        if (room.status === "playing") scheduleBotTurn(io, room, token, false);
      }, 1500);
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
    room.guest = {
      id: `bot:${room.code}`,
      name: "KELİME BOT",
      isBot: true,
      socketId: null,
      connected: true,
      ready: true,
      rematch: false,
      avatar: "🤖",
      selectedTitle: "[SİBER İZCİ]",
      level: 10,
      tier: "GÜMÜŞ",
      lp: 950,
      wins: 14,
      matches: 26,
      streak: 4,
      bestScore: 120,
      bestTempo: 3.5,
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
    target.roundToken = -1;
    target.botFillToken = -1;
  }
  rooms.delete(code);
}

function leaveRoom(io: Server, socket: Socket, room: Room, playerId: string) {
  const player = roomForPlayer(room, playerId);
  if (!player) return;
  socket.leave(`room:${room.code}`);
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
    } catch {
      socket.data.userId = null;
      next();
    }
  });

  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.touchedAt > ROOM_TTL_MS) destroyRoom(code, room);
    }
  }, 60_000);

  io.on("connection", (socket) => {
    const ownsPlayerId = (playerId: string) => !socket.data.userId || socket.data.userId === playerId;
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
      let queue = matchmakingQueue.get(payload.size);
      if (!queue) {
        queue = [];
        matchmakingQueue.set(payload.size, queue);
      }
      queue = queue.filter(p => p.playerId !== payload.playerId && p.socketId !== socket.id);
      
      if (queue.length > 0) {
        const opponent = queue.shift()!;
        matchmakingQueue.set(payload.size, queue);
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
          // If socket disconnected during the 5s wait, skip room creation
          if (!io.sockets.sockets.get(socket.id)?.connected) return;
          const currentQueue = matchmakingQueue.get(payload.size) || [];
          const idx = currentQueue.findIndex(p => p.playerId === payload.playerId && p.socketId === socket.id);
          if (idx !== -1) {
            const queueEntry = currentQueue[idx]!;
            currentQueue.splice(idx, 1);
            matchmakingQueue.set(payload.size, currentQueue);
            const code = makeCode();
            const room: Room = {
              code,
              size: payload.size,
              status: "waiting",
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
              guest: null,
              winnerId: null,
              startedAt: null,
              message: "Bot düellosu hazırlanıyor...",
              touchedAt: Date.now(),
              botFillToken: 0,
              roundToken: 0,
            };
            rooms.set(code, room);
            socket.join(`room:${code}`);
            emitRoom(io, room);
            scheduleBotFill(io, room);
          }
        }, 5000);
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
      let queue = matchmakingQueue.get(payload.size);
      if (queue) {
        queue = queue.filter(p => p.playerId !== payload.playerId && p.socketId !== socket.id);
        matchmakingQueue.set(payload.size, queue);
      }
      socket.emit("matchmaking:status", { status: "idle" });
    });

    socket.on("room:create", (payload: { playerId: string; playerName: string; size: BoardSize; immediateBot?: boolean; profile?: z.infer<typeof playerProfileSchema> }) => {
      if (!isValidPayload(roomCreateSchema, payload)) return fail(socket, "Geçersiz oda isteği.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      if (!BOARD_SIZES.includes(payload.size)) return fail(socket, "Geçersiz tahta boyutu.");
      const code = makeCode();
      const room: Room = {
        code,
        size: payload.size,
        status: "waiting",
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
      if (!room || !player || (player.socketId && player.socketId !== socket.id)) return;
      player.socketId = socket.id;
      player.connected = true;
      if (room.disconnectTimer && room.disconnectPlayerId === player.id) {
        clearTimeout(room.disconnectTimer);
        room.disconnectTimer = null;
        room.disconnectPlayerId = null;
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
      if (room.host.ready && room.guest.ready) return startRound(io, room);
      room.message = `${player.name} hazır. Rakip bekleniyor.`;
      emitRoom(io, room);
    });

    socket.on("word:submit", (payload: { code: string; playerId: string; selection: number[] }) => {
      if (!isValidPayload(wordSubmitSchema, payload)) return fail(socket, "Geçersiz kelime seçimi.");
      if (!ownsPlayerId(payload.playerId)) return fail(socket, "Oyuncu kimliği bu oturuma ait değil.");
      const room = rooms.get(payload.code.trim().toUpperCase());
      const player = room ? playerForSocket(room, socket, payload.playerId) : null;
      if (!room || !player || room.status !== "playing") return;
      if (room.startedAt) {
        if (Date.now() < room.startedAt) return socket.emit("word:rejected", { word: "", reason: "starting" });
        const durationMs = getRoundDurationMs(room.size);
        if (Date.now() >= room.startedAt + durationMs) {
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
      player.rematch = true;
      if (room.guest.isBot) {
        room.message = "Yapay rakip rövanş teklifini inceliyor...";
        emitRoom(io, room);
        setTimeout(() => {
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

    socket.on("disconnect", () => {
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
        
        if (room.status === "lobby" || room.status === "waiting" || room.status === "finished") {
          leaveRoom(io, socket, room, player.id);
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
}
