import type { BoardSize, WordDifficulty } from "./game";

export type DifficultyProfile = {
  size: BoardSize;
  wordCount: number;
  timeLimit: number;
  minTurns: number;
  minWordLength: number;
  maxWordLength: number;
  mix: Record<WordDifficulty, number>;
};

export function getDifficultyProfile(level: number): DifficultyProfile {
  const safeLevel = Math.min(Math.max(Math.floor(level), 1), 100);
  const progress = (safeLevel - 1) / 99;
  const size: BoardSize = safeLevel <= 3 ? 4 : safeLevel <= 7 ? 6 : 8;
  const wordCount = size === 4 ? 3 : size === 6 ? 4 + Math.floor((safeLevel - 4) / 2) : Math.min(4 + Math.floor((safeLevel - 8) / 10), 6);
  return {
    size,
    wordCount,
    timeLimit: Math.max(35, Math.round(95 - (safeLevel - 1) * 0.6 - (size === 6 ? 4 : size === 8 ? 8 : 0))),
    minTurns: safeLevel === 1 ? 1 : safeLevel <= 5 ? 2 : 3,
    minWordLength: size === 4 ? 4 : size === 6 ? Math.min(4 + Math.floor(progress * 2), 5) : Math.min(4 + Math.floor(progress * 2), 6),
    maxWordLength: size === 4 ? 7 : size === 6 ? 6 : Math.min(8 + Math.floor(progress * 2), 10),
    mix: {
      easy: 0.62 - progress * 0.45,
      medium: 0.3 + progress * 0.05,
      hard: 0.08 + progress * 0.4,
    },
  };
}
