import type { Server } from "socket.io";
import type { RoomSnapshot } from "../../shared/game";
import { normalizeTr } from "../../shared/tr-utils";
import type { Room } from "./types";

export function snapshot(room: Room, viewerId: string): RoomSnapshot {
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
  const viewerFoundNormalized = new Set(
    room.foundWords.filter((e) => e.playerId === viewerId).map((e) => normalizeTr(e.word))
  );
  // Oyuncuya kendi kelimeleri açık, rakip/bot kelimeleri ise sadece skor/sayaç hesabı için gizli/boş gönderilir
  const foundWords = room.foundWords.map((entry) =>
    entry.playerId === viewerId
      ? { ...entry, hidden: false }
      : { ...entry, word: "", path: [], hidden: true }
  );
  // Oyuncunun bulamadığı tüm gizli kelimeler (oyun bitince rotalarıyla birlikte)
  const missedWords =
    room.status === "finished"
      ? room.words
          .filter((w) => !viewerFoundNormalized.has(normalizeTr(w)))
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
    bonusWords: room.bonusWords,
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

export function emitRoom(io: Server, room: Room) {
  room.touchedAt = Date.now();
  [room.host, room.guest].filter(Boolean).forEach((player) => {
    if (player!.socketId) io.to(player!.socketId).emit("room:update", snapshot(room, player!.id));
  });
}
