import type { Server, Socket } from "socket.io";

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
import { loadLeaderboard, loadPlayerProfile, recordLeaderboardRounds, savePlayerProfile } from "./mongo-store";

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
};

const rooms = new Map<string, Room>();
const matchmakingQueue = new Map<BoardSize, { playerId: string; playerName: string; socketId: string }[]>();
const leaderboard = new Map<string, LeaderboardEntry>();
const ROOM_TTL_MS = 15 * 60 * 1000;

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
  const fallbackPath = fullBoardPath(4)!;
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
  if (size === 4) return buildFourByFourBoard(pickLiveFourWords());
  const candidates = WORD_CATALOG[size].filter((entry) => entry.word.length <= size);
  const targetWordCount = size;
  // Allow up to 85% of cells for words; remainder becomes random filler
  const maximumLetters = Math.floor(size * size * 0.85);
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const difficultyOrder = shuffled(["easy", "medium", "hard"] as const);
    const words: string[] = [];
    let lettersUsed = 0;
    // Shuffle candidates so short & long words are picked in random order each attempt
    const shuffledCandidates = shuffled(candidates);
    for (let index = 0; index < targetWordCount; index += 1) {
      const desired = difficultyOrder[index % difficultyOrder.length];
      // Remaining budget per remaining slot guides max word length
      const slotsLeft = targetWordCount - index;
      const budgetLeft = maximumLetters - lettersUsed;
      const maxLen = Math.min(size, Math.floor(budgetLeft / slotsLeft) + 1);
      const available = shuffledCandidates.filter(
        (entry) => !words.includes(entry.word) && entry.word.length <= maxLen && lettersUsed + entry.word.length <= maximumLetters,
      );
      const preferred = available.filter((entry) => entry.difficulty === desired);
      const selected = randomItem(preferred.length ? preferred : available);
      if (!selected) break;
      words.push(selected.word);
      lettersUsed += selected.word.length;
    }
    if (words.length !== targetWordCount) continue;
    const board = Array.from({ length: size * size }, () => "");
    const occupied = new Set<number>();
    const placedWords: string[] = [];
    const usedShapes = new Set<string>();
    const routesMap: Record<string, number[]> = {};
    for (const word of [...words].sort((left, right) => right.length - left.length)) {
      const route = findOpenRoute(occupied, size, word.length, usedShapes);
      if (!route) break;
      route.forEach((index, letterIndex) => {
        occupied.add(index);
        board[index] = word[letterIndex]!;
      });
      usedShapes.add(routeShape(route, size));
      placedWords.push(word);
      routesMap[word] = route;
    }
    if (placedWords.length === targetWordCount) {
      return {
        board: board.map((letter) => letter || randomItem(TURKISH_LETTERS)),
        words: placedWords,
        routes: routesMap,
      };
    }
  }
  throw new Error(`${size}×${size} canlı tahta için yeterli sayıda kelime rotası üretilemedi.`);
}

function snapshot(room: Room, viewerId: string): RoomSnapshot {
  const players = [room.host, room.guest].filter(Boolean).map((player) => ({
    id: player!.id,
    name: player!.name,
    isBot: Boolean(player!.isBot),
    connected: player!.connected,
    ready: player!.ready,
    rematch: player!.rematch,
  }));
  return {
    code: room.code,
    size: room.size,
    status: room.status,
    board: room.board,
    wordsTotal: room.words.length,
    foundWords: maskOpponentFoundWords(room.foundWords, viewerId, room.status === "finished"),
    scores: room.scores,
    players,
    winnerId: room.winnerId,
    startedAt: room.startedAt,
    message: room.status === "playing" && room.foundWords.at(-1)?.playerId !== viewerId
      ? `${roomForPlayer(room, room.foundWords.at(-1)?.playerId ?? "")?.name ?? "RAKİP"} bir kelime buldu! +${room.foundWords.at(-1)?.word.length ?? 0}`
      : room.message,
    botSelection: room.botSelection,
    combos: room.comboCount,
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

function recordRoundForLeaderboard(io: Server, room: Room) {
  [room.host, room.guest].filter((player): player is PlayerRecord => Boolean(player && !player.isBot)).forEach((player) => {
    const roundScore = room.scores[player.id] ?? 0;
    const previous = leaderboard.get(player.id) ?? { id: player.id, name: player.name, score: 0, wins: 0, matches: 0, bestRound: 0 };
    leaderboard.set(player.id, {
      ...previous,
      name: player.name,
      score: previous.score + roundScore,
      wins: previous.wins + (room.winnerId === player.id ? 1 : 0),
      matches: previous.matches + 1,
      bestRound: Math.max(previous.bestRound, roundScore),
    });
  });
  publishLeaderboard(io);
  void recordLeaderboardRounds(
    [room.host, room.guest]
      .filter((player): player is PlayerRecord => Boolean(player && !player.isBot))
      .map((player) => ({ id: player.id, name: player.name, score: room.scores[player.id] ?? 0, won: room.winnerId === player.id })),
  ).then((persisted) => {
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
  const ordered = [room.host, room.guest].filter(Boolean).sort((a, b) => {
    const scoreDifference = (room.scores[b!.id] ?? 0) - (room.scores[a!.id] ?? 0);
    return scoreDifference !== 0 ? scoreDifference : a!.id.localeCompare(b!.id);
  });
  room.status = "finished";
  room.winnerId = ordered[0]?.id ?? null;
  const winner = room.winnerId ? roomForPlayer(room, room.winnerId) : null;
  room.message = winner ? `${winner.name} ${room.scores[winner.id] ?? 0} puanla turu kazandı!` : "Tur tamamlandı.";
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

function scheduleBotTurn(io: Server, room: Room, token: number) {
  const bot = room.guest;
  if (!bot?.isBot) return;
  const delay = botThinkDelayMs(room.size);
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
        if (room.status === "playing") scheduleBotTurn(io, room, token);
      }, 1500);
    } else {
      if (room.status === "playing") scheduleBotTurn(io, room, token);
    }
  }, selectTriggerDelay);
}

function scheduleRoundEnd(io: Server, room: Room, token: number) {
  const duration = getRoundDurationMs(room.size);
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
  room.startedAt = Date.now();
  room.winnerId = null;
  room.message = `${words.length} gizli kelime var. Yalnız yatay ve dikey bağla!`;
  room.host.rematch = false;
  if (room.guest) room.guest.rematch = false;
  room.lastWordFoundTime = {};
  room.comboCount = {};
  const token = ++room.roundToken;
  emitRoom(io, room);
  scheduleRoundEnd(io, room, token);
  scheduleBotTurn(io, room, token);
}

function leaveRoom(io: Server, socket: Socket, room: Room, playerId: string) {
  const player = roomForPlayer(room, playerId);
  if (!player) return;
  socket.leave(`room:${room.code}`);
  if (room.host.id === playerId) {
    if (!room.guest || room.guest.isBot) {
      rooms.delete(room.code);
      return;
    }
    room.host = room.guest;
    room.host.ready = false;
    room.guest = null;
    room.status = "waiting";
    room.message = "Rakip ayrıldı. Yeni bir oyuncu veya bot bekleniyor.";
    emitRoom(io, room);
    scheduleBotFill(io, room);
    return;
  }
  room.guest = null;
  room.host.ready = false;
  room.status = "waiting";
  room.winnerId = null;
  room.message = "Rakip ayrıldı. Yeni bir oyuncu veya bot bekleniyor.";
  emitRoom(io, room);
  scheduleBotFill(io, room);
}

export function registerGameRooms(io: Server) {
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.touchedAt > ROOM_TTL_MS) rooms.delete(code);
    }
  }, 60_000);

  io.on("connection", (socket) => {
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
    socket.on("profile:load", async (payload: { playerId: string }) => {
      const profile = await loadPlayerProfile(payload.playerId);
      if (profile) socket.emit("profile:update", { playerId: profile.playerId, name: profile.name, progress: profile.progress });
    });
    socket.on("profile:save", async (payload: { playerId: string; playerName: string; progress: import("../../shared/progression").PlayerProgress }) => {
      const profile = await savePlayerProfile(payload.playerId, payload.playerName, payload.progress);
      if (profile) socket.emit("profile:update", profile);
    });
    socket.on("matchmaking:join", (payload: { playerId: string; playerName: string; size: BoardSize }) => {
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
          host: { id: opponent.playerId, name: opponent.playerName.trim().slice(0, 16) || "OYUNCU 1", isBot: false, socketId: opponent.socketId, connected: true, ready: false, rematch: false },
          guest: { id: payload.playerId, name: payload.playerName.trim().slice(0, 16) || "OYUNCU 2", isBot: false, socketId: socket.id, connected: true, ready: false, rematch: false },
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
        queue.push({ playerId: payload.playerId, playerName: payload.playerName, socketId: socket.id });
        matchmakingQueue.set(payload.size, queue);
        socket.emit("matchmaking:status", { status: "searching" });
        setTimeout(() => {
          const currentQueue = matchmakingQueue.get(payload.size) || [];
          const idx = currentQueue.findIndex(p => p.playerId === payload.playerId && p.socketId === socket.id);
          if (idx !== -1) {
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
              host: { id: payload.playerId, name: payload.playerName.trim().slice(0, 16) || "OYUNCU 1", isBot: false, socketId: socket.id, connected: true, ready: false, rematch: false },
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
      }
    });

    socket.on("matchmaking:leave", (payload: { playerId: string; size: BoardSize }) => {
      let queue = matchmakingQueue.get(payload.size);
      if (queue) {
        queue = queue.filter(p => p.playerId !== payload.playerId && p.socketId !== socket.id);
        matchmakingQueue.set(payload.size, queue);
      }
      socket.emit("matchmaking:status", { status: "idle" });
    });

    socket.on("room:create", (payload: { playerId: string; playerName: string; size: BoardSize; immediateBot?: boolean }) => {
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
        host: { id: payload.playerId, name: payload.playerName.trim().slice(0, 16) || "OYUNCU 1", isBot: false, socketId: socket.id, connected: true, ready: false, rematch: false },
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

    socket.on("room:join", (payload: { code: string; playerId: string; playerName: string }) => {
      const room = rooms.get(payload.code.trim().toUpperCase());
      if (!room) return fail(socket, "Bu oda bulunamadı veya süresi doldu.");
      if (room.status === "playing" || room.status === "finished") return fail(socket, "Bu odada maç başladı; yeni oda kurun.");
      if (room.host.id === payload.playerId) {
        room.host.socketId = socket.id;
        room.host.connected = true;
        socket.join(`room:${room.code}`);
        return emitRoom(io, room);
      }
      if (room.guest && room.guest.id !== payload.playerId && !room.guest.isBot) return fail(socket, "Bu oda zaten dolu.");
      room.guest = { id: payload.playerId, name: payload.playerName.trim().slice(0, 16) || "OYUNCU 2", isBot: false, socketId: socket.id, connected: true, ready: false, rematch: false };
      room.status = "lobby";
      room.message = "İki oyuncu da hazır olduğunda kelime avı başlar.";
      socket.join(`room:${room.code}`);
      emitRoom(io, room);
    });

    socket.on("room:reconnect", (payload: { code: string; playerId: string }) => {
      const room = rooms.get(payload.code.trim().toUpperCase());
      const player = room ? roomForPlayer(room, payload.playerId) : null;
      if (!room || !player) return;
      player.socketId = socket.id;
      player.connected = true;
      socket.join(`room:${room.code}`);
      emitRoom(io, room);
    });

    socket.on("room:ready", (payload: { code: string; playerId: string }) => {
      const room = rooms.get(payload.code.trim().toUpperCase());
      const player = room ? roomForPlayer(room, payload.playerId) : null;
      if (!room || !player || !room.guest) return fail(socket, "Önce iki oyuncunun da odaya katılması gerekiyor.");
      if (room.status !== "lobby") return;
      player.ready = true;
      if (room.host.ready && room.guest.ready) return startRound(io, room);
      room.message = `${player.name} hazır. Rakip bekleniyor.`;
      emitRoom(io, room);
    });

    socket.on("word:submit", (payload: { code: string; playerId: string; selection: number[] }) => {
      const room = rooms.get(payload.code.trim().toUpperCase());
      const player = room ? roomForPlayer(room, payload.playerId) : null;
      if (!room || !player || room.status !== "playing") return;
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
      const room = rooms.get(payload.code.trim().toUpperCase());
      const player = room ? roomForPlayer(room, payload.playerId) : null;
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
      const room = rooms.get(payload.code.trim().toUpperCase());
      if (room) leaveRoom(io, socket, room, payload.playerId);
    });

    socket.on("disconnect", () => {
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
        } else {
          room.message = `${player.name} bağlantısını yeniliyor…`;
          emitRoom(io, room);
        }
      }
    });
  });
}
