import type { BoardSize } from "../../shared/game";
import type { FriendChallengeData, ChallengeAttempt, ChallengeResult } from "../../shared/challenge";

// In-memory store for active challenges (7-day TTL)
const challengesStore = new Map<string, FriendChallengeData>();

function generateChallengeId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CH-${suffix}`;
}

export function createFriendChallenge(input: {
  creatorId: string;
  creatorName: string;
  creatorCity?: string;
  creatorAvatar?: string;
  creatorScore: number;
  size: BoardSize;
  board: string[];
  words: string[];
  timeLimit: number;
}): FriendChallengeData {
  let id = generateChallengeId();
  while (challengesStore.has(id)) {
    id = generateChallengeId();
  }

  const now = Date.now();
  const challenge: FriendChallengeData = {
    id,
    creatorId: input.creatorId,
    creatorName: input.creatorName || "Gizli Yarışmacı",
    creatorCity: input.creatorCity,
    creatorAvatar: input.creatorAvatar,
    creatorScore: Math.max(0, input.creatorScore),
    size: input.size,
    board: input.board,
    words: input.words,
    timeLimit: input.timeLimit || 60,
    createdAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
    attemptsCount: 0,
  };

  challengesStore.set(id, challenge);
  return challenge;
}

export function getFriendChallenge(id: string): FriendChallengeData | null {
  if (!id) return null;
  const challenge = challengesStore.get(id.toUpperCase().trim());
  if (!challenge) return null;
  if (Date.now() > challenge.expiresAt) {
    challengesStore.delete(id);
    return null;
  }
  return challenge;
}

export function submitChallengeAttempt(attempt: ChallengeAttempt): ChallengeResult | null {
  const challenge = getFriendChallenge(attempt.challengeId);
  if (!challenge) return null;

  challenge.attemptsCount += 1;
  const won = attempt.score > challenge.creatorScore;
  const scoreDiff = attempt.score - challenge.creatorScore;

  if (attempt.score > (challenge.bestOpponentScore ?? 0)) {
    challenge.bestOpponentScore = attempt.score;
    challenge.bestOpponentName = attempt.playerName;
  }

  const coinsEarned = won ? 35 : 15;
  const xpEarned = won ? 120 : 50;

  const message = won
    ? `🏆 Harika! ${attempt.score} puan ile ${challenge.creatorName} (${challenge.creatorScore} puan) skorunu ${scoreDiff} puan farkla geçtin!`
    : scoreDiff === 0
    ? `🤝 Berabere! ${challenge.creatorName} ile tamı tamına aynı skoru (${challenge.creatorScore}) yaptın!`
    : `👏 Güzel mücadele! ${attempt.score} puan aldın. ${challenge.creatorName} skorunu (${challenge.creatorScore}) geçmek için sadece ${Math.abs(scoreDiff)} puan eksik kaldı.`;

  return {
    challengeId: challenge.id,
    won,
    scoreDiff,
    message,
    coinsEarned,
    xpEarned,
  };
}

export function listRecentChallenges(limit = 10): FriendChallengeData[] {
  return Array.from(challengesStore.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
