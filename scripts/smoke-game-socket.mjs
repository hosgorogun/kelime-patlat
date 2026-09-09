import fs from "fs";
import { io } from "socket.io-client";

const catalog = JSON.parse(fs.readFileSync(new URL("../data/word-catalog.json", import.meta.url), "utf8"));
const endpoint = process.env.GAME_SERVER_URL || "http://127.0.0.1:3000";
const targetWords = catalog.words.map((entry) => entry.word);
const scoreForWord = (word) => word.length * (word.length >= 7 ? 3 : word.length >= 5 ? 2 : 1);

function findPath(board, size, word) {
  const visit = (index, offset, used) => {
    if (board[index] !== word[offset]) return null;
    const nextUsed = [...used, index];
    if (offset === word.length - 1) return nextUsed;
    const row = Math.floor(index / size);
    const column = index % size;
    const neighbors = [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1]];
    for (const [nextRow, nextColumn] of neighbors) {
      const nextIndex = nextRow * size + nextColumn;
      if (nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size && !nextUsed.includes(nextIndex)) {
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

function hasTurn(path) {
  for (let index = 2; index < path.length; index += 1) {
    if (path[index - 1] - path[index - 2] !== path[index] - path[index - 1]) return true;
  }
  return false;
}

function waitFor(socket, event, predicate = () => true, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`${event} olayı zamanında gelmedi`));
    }, timeoutMs);
    const onEvent = (payload) => {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, onEvent);
      resolve(payload);
    };
    socket.on(event, onEvent);
  });
}

function submitUntilAccepted(socket, room, playerId) {
  return new Promise((resolve, reject) => {
    const candidates = targetWords.map((word) => ({ word, path: findPath(room.board, room.size, word) })).filter((entry) => entry.path);
    let cursor = 0;
    const tryNext = () => {
      const candidate = candidates[cursor++];
      if (!candidate?.path) {
        reject(new Error(`${room.size}×${room.size} tahtada sunucunun kabul ettiği hedef kelime bulunamadı`));
        return;
      }
      const cleanup = () => {
        clearTimeout(timer);
        socket.off("room:update", onUpdate);
        socket.off("word:rejected", onRejected);
      };
      const onUpdate = (next) => {
        if (next.code !== room.code || !next.foundWords.some((entry) => entry.word === candidate.word && entry.playerId === playerId)) return;
        cleanup();
        resolve({ ...candidate, room: next });
      };
      const onRejected = (payload) => {
        cleanup();
        if (payload?.reason === "starting" && room.startedAt && Date.now() < room.startedAt) {
          setTimeout(tryNext, room.startedAt - Date.now() + 300);
          return;
        }
        tryNext();
      };
      const timer = setTimeout(() => {
        cleanup();
        tryNext();
      }, 2_500);
      socket.on("room:update", onUpdate);
      socket.on("word:rejected", onRejected);
      socket.emit("word:submit", { code: room.code, playerId, selection: candidate.path });
    };
    tryNext();
  });
}

async function connect() {
  const socket = io(endpoint, { transports: ["websocket"], reconnection: false });
  await waitFor(socket, "connect");
  socket.on("room:error", (payload) => console.log("Oda hatası:", payload?.message ?? payload));
  return socket;
}

const waitGameStart = (game) => game.startedAt && Date.now() < game.startedAt ? new Promise(r => setTimeout(r, game.startedAt - Date.now() + 200)) : Promise.resolve();

async function run() {
  console.log("Duman testi: 4×4 iki oyunculu oda");
  const host = await connect();
  const guest = await connect();
  try {
    const created = waitFor(host, "room:update", (room) => room.status === "waiting");
    host.emit("room:create", { playerId: "host", playerName: "HOST", size: 4 });
    const room = await created;
    const joined = waitFor(host, "room:update", (next) => next.code === room.code && next.status === "lobby" && next.players.length === 2);
    guest.emit("room:join", { code: room.code, playerId: "guest", playerName: "GUEST" });
    await joined;
    const playingForHost = waitFor(host, "room:update", (next) => next.code === room.code && next.status === "playing");
    const playingForGuest = waitFor(guest, "room:update", (next) => next.code === room.code && next.status === "playing");
    host.emit("room:ready", { code: room.code, playerId: "host" });
    guest.emit("room:ready", { code: room.code, playerId: "guest" });
    const [hostGame, guestGame] = await Promise.all([playingForHost, playingForGuest]);

    if (hostGame.board.join("") !== guestGame.board.join("") || hostGame.wordsTotal < 3 || hostGame.board.length !== 16 || !hostGame.board.every(Boolean)) {
      throw new Error("Çoklu kelimeli ortak tahta doğru kurulmadı");
    }
    const discoveredRoutes = targetWords.map((word) => ({ word, path: findPath(hostGame.board, 4, word) })).filter((entry) => entry.path);
    if (discoveredRoutes.length < 3) throw new Error("Ortak tahtada yeterli sayıda bulunabilir hedef kelime üretilmedi");
    await waitGameStart(hostGame);
    const hiddenForGuest = waitFor(guest, "room:update", (next) => next.code === room.code && next.foundWords.some((entry) => entry.playerId === "host" && entry.hidden));
    const [accepted, guestView] = await Promise.all([submitUntilAccepted(host, hostGame, "host"), hiddenForGuest]);
    const { word: winningWord, path: winningPath, room: claimedRoom } = accepted;
    const claimedPath = claimedRoom.foundWords[0]?.path;
    if ((claimedRoom.scores.host ?? 0) !== scoreForWord(winningWord) || claimedRoom.foundWords.length !== 1 || !Array.isArray(claimedPath) || claimedPath.join(",") !== winningPath.join(",")) {
      throw new Error("Çoklu kelime puanı veya bulunan kelime kaydı hatalı");
    }
    const hiddenWord = guestView.foundWords.find((entry) => entry.playerId === "host");
    if (!hiddenWord?.hidden || hiddenWord.word || hiddenWord.path.length !== 0 || guestView.message.includes(winningWord)) {
      throw new Error("Rakip kelimesi veya rotası canlı maç görünümünde gizlenmedi");
    }
    const leaderboardUpdated = waitFor(host, "leaderboard:update", (entries) => entries.some((entry) => entry.id === "host" && entry.matches >= 1));
    let completedRoom = claimedRoom;
    while (completedRoom.status === "playing") {
      completedRoom = (await submitUntilAccepted(host, completedRoom, "host")).room;
    }
    const seasonBoard = await leaderboardUpdated;
    const seasonEntry = seasonBoard.find((entry) => entry.id === "host");
    if (completedRoom.status !== "finished" || !seasonEntry || seasonEntry.matches < 1 || seasonEntry.score < scoreForWord(winningWord)) {
      throw new Error("Tur sonucu sezon liderliğine doğru yansımadı");
    }

    console.log("Duman testi: 6×6 iki oyunculu oda");
    const mediumHost = await connect();
    const mediumGuest = await connect();
    try {
      const mediumCreated = waitFor(mediumHost, "room:update", (next) => next.status === "waiting");
      mediumHost.emit("room:create", { playerId: "six-host", playerName: "SIX HOST", size: 6 });
      const mediumRoom = await mediumCreated;
      const mediumJoined = waitFor(mediumHost, "room:update", (next) => next.code === mediumRoom.code && next.status === "lobby" && next.players.length === 2);
      mediumGuest.emit("room:join", { code: mediumRoom.code, playerId: "six-guest", playerName: "SIX GUEST" });
      await mediumJoined;
      const mediumPlayingHost = waitFor(mediumHost, "room:update", (next) => next.code === mediumRoom.code && next.status === "playing");
      const mediumPlayingGuest = waitFor(mediumGuest, "room:update", (next) => next.code === mediumRoom.code && next.status === "playing");
      mediumHost.emit("room:ready", { code: mediumRoom.code, playerId: "six-host" });
      mediumGuest.emit("room:ready", { code: mediumRoom.code, playerId: "six-guest" });
      const [mediumGame, mediumGuestGame] = await Promise.all([mediumPlayingHost, mediumPlayingGuest]);
      if (mediumGame.board.join("") !== mediumGuestGame.board.join("") || mediumGame.wordsTotal < 4 || mediumGame.board.length !== 36 || !mediumGame.board.every(Boolean)) {
        throw new Error("6×6 ortak tahta doğru kurulmadı");
      }
      await waitGameStart(mediumGame);
      const mediumAccepted = await submitUntilAccepted(mediumHost, mediumGame, "six-host");
      if (!mediumAccepted.path) throw new Error("6×6 tahtada çaprazsız bulunabilir kelime yok");
    } finally {
      mediumHost.disconnect();
      mediumGuest.disconnect();
    }

    console.log("Duman testi: 8×8 iki oyunculu oda");
    const largeHost = await connect();
    const largeGuest = await connect();
    try {
      const largeCreated = waitFor(largeHost, "room:update", (next) => next.status === "waiting");
      largeHost.emit("room:create", { playerId: "eight-host", playerName: "EIGHT HOST", size: 8 });
      const largeRoom = await largeCreated;
      const largeJoined = waitFor(largeHost, "room:update", (next) => next.code === largeRoom.code && next.status === "lobby" && next.players.length === 2);
      largeGuest.emit("room:join", { code: largeRoom.code, playerId: "eight-guest", playerName: "EIGHT GUEST" });
      await largeJoined;
      const largePlayingHost = waitFor(largeHost, "room:update", (next) => next.code === largeRoom.code && next.status === "playing", 15_000);
      const largePlayingGuest = waitFor(largeGuest, "room:update", (next) => next.code === largeRoom.code && next.status === "playing", 15_000);
      largeHost.emit("room:ready", { code: largeRoom.code, playerId: "eight-host" });
      largeGuest.emit("room:ready", { code: largeRoom.code, playerId: "eight-guest" });
      const [largeGame, largeGuestGame] = await Promise.all([largePlayingHost, largePlayingGuest]);
      if (largeGame.board.join("") !== largeGuestGame.board.join("") || largeGame.wordsTotal < 6 || largeGame.board.length !== 64 || !largeGame.board.every(Boolean)) {
        throw new Error("8×8 ortak tahta doğru kurulmadı");
      }
      await waitGameStart(largeGame);
      const largeAccepted = await submitUntilAccepted(largeHost, largeGame, "eight-host");
      if (!largeAccepted.path) throw new Error("8×8 tahtada çaprazsız bulunabilir kelime yok");
    } finally {
      largeHost.disconnect();
      largeGuest.disconnect();
    }

    console.log("Duman testi: 4×4 otomatik bot");
    const botHost = await connect();
    try {
      const botCreated = waitFor(botHost, "room:update", (next) => next.status === "waiting" || (next.code && next.players.some((p) => p.isBot)));
      botHost.emit("room:create", { playerId: "bot-host", playerName: "BOT HOST", size: 4, immediateBot: true });
      const botRoom = await botCreated;
      const botLobby = await waitFor(botHost, "room:update", (next) => next.code === botRoom.code && next.players.some((player) => player.isBot));
      if (!botLobby.players.some((player) => player.name === "KELİME BOT" && player.ready)) throw new Error("Bot otomatik atanmadı");
      const botPlaying = waitFor(botHost, "room:update", (next) => next.code === botRoom.code && next.status === "playing");
      const botClaimed = waitFor(botHost, "room:update", (next) => next.code === botRoom.code && next.foundWords.some((entry) => String(entry.playerId).startsWith("bot:")), 24_000);
      botHost.emit("room:ready", { code: botRoom.code, playerId: "bot-host" });
      await botPlaying;
      await botClaimed;
    } finally {
      botHost.disconnect();
    }
    console.log("Çoklu kelime, bot ve canlı oda duman testi başarılı");
  } finally {
    host.disconnect();
    guest.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
