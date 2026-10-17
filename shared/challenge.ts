import { type BoardSize } from "./game";

export type FriendChallengeData = {
  id: string; // e.g. "CH-A9X2"
  creatorId: string;
  creatorName: string;
  creatorCity?: string;
  creatorAvatar?: string;
  creatorScore: number;
  size: BoardSize;
  board: string[];
  words: string[];
  timeLimit: number;
  createdAt: number;
  expiresAt: number;
  attemptsCount: number;
  bestOpponentScore?: number;
  bestOpponentName?: string;
};

export type ChallengeAttempt = {
  challengeId: string;
  playerId: string;
  playerName: string;
  playerCity?: string;
  score: number;
  wordsFound: string[];
};

export type ChallengeResult = {
  challengeId: string;
  won: boolean;
  scoreDiff: number;
  message: string;
  coinsEarned: number;
  xpEarned: number;
};

export function buildChallengeShareMessage(
  challengeId: string,
  creatorName: string,
  score: number,
  size: number
): string {
  return [
    `⚔️ Kelime Patlat Meydan Okuması!`,
    `🏆 ${creatorName}, ${size}×${size} tahtada ${score} PUAN yaptı!`,
    ``,
    `Aynı tahtada ve aynı sürede onu geçebilir misin?`,
    `Hemen oyna 👉 https://kelimepatlat.com/meydan-oku/${challengeId}`,
  ].join("\n");
}
