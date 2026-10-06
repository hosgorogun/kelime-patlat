import type { Server } from "socket.io";
import type { LeaderboardEntry } from "../../shared/game";
import { DEFAULT_PROGRESS, getLeagueTier, getPlayerLevel, applyMatchProgress, type PlayerProgress } from "../../shared/progression";
import { UserModel } from "../db";
import { loadLeaderboard, recordLeaderboardRounds } from "./mongo-store";
import type { PlayerRecord, Room } from "./types";

export const leaderboard = new Map<string, LeaderboardEntry>();

export function leaderboardSnapshot(): LeaderboardEntry[] {
  return [...leaderboard.values()]
    .sort((left, right) => right.score - left.score || right.wins - left.wins)
    .slice(0, 20);
}

export function publishLeaderboard(io: Server) {
  io.emit("leaderboard:update", leaderboardSnapshot());
  void loadLeaderboard()
    .then((persisted) => {
      if (persisted) io.emit("leaderboard:update", persisted);
    })
    .catch((err) => {
      console.error("[Leaderboard] Error loading persisted leaderboard:", err);
    });
}

export async function recordRoundForLeaderboard(io: Server, room: Room) {
  const finalScores = { ...room.scores };
  const finalWinnerId = room.winnerId;
  const activeHumanPlayers = [room.host, room.guest].filter(
    (player): player is PlayerRecord => Boolean(player && !player.isBot)
  );
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
      const myBonus = (room.bonusWords && room.bonusWords[player.id]) || [];
      const myWords = [
        ...room.foundWords.filter((w) => w.playerId === player.id).map((w) => w.word),
        ...myBonus,
      ];
      const tempo = Math.round(((myWords.length * 60) / elapsedSeconds) * 10) / 10;
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
              opponentName: opponentPlayer?.name || (isBotMatch ? "Bot Rakip" : "Rakip"),
              opponentAvatar: opponentPlayer?.avatar,
              opponentScore,
              isFriendGame: isUnrankedFriendly,
            },
            isBotMatch ? "bot" : "pvp"
          );

          dbUser.progress = nextProgress;
          dbUser.updatedAt = new Date();
          await dbUser.save();

          currentLp = isUnrankedFriendly ? prevProgress.lp ?? 0 : nextProgress.lp ?? 0;
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
        const previous = leaderboard.get(player.id) ?? {
          id: player.id,
          name: player.name,
          score: 0,
          wins: 0,
          matches: 0,
          bestRound: 0,
        };
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
          level: getPlayerLevel(nextScore),
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
    void recordLeaderboardRounds(roundsToRecord)
      .then((persisted) => {
        if (persisted) io.emit("leaderboard:update", persisted);
      })
      .catch((err) => {
        console.error("[Leaderboard] Error recording leaderboard rounds:", err);
      });
  }
}
