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
  
  // Balanced level progression:
  // Levels 1-15: 4x4 (Perfect for learning and smooth progression)
  // Levels 16-45: 6x6 (Intermediate path puzzle size)
  // Levels 46-75: 8x8 (Expert layout, big vocabulary grid)
  // Levels 76-100: 10x10 (Legendary master layout, colossal grid)
  const size: BoardSize = safeLevel <= 15 ? 4 : safeLevel <= 45 ? 6 : safeLevel <= 75 ? 8 : 10;
  
  let wordCount = 4;
  let minWordLength = 3;
  let maxWordLength = 6;
  
  if (size === 4) {
    wordCount = 3;
    minWordLength = 3;
    maxWordLength = 6;
  } else if (size === 6) {
    const ratio = (safeLevel - 16) / 29;
    wordCount = 5 + Math.floor(ratio * 2.5); // 5 to 7 words
    minWordLength = 3;
    maxWordLength = 8;
  } else if (size === 8) {
    const ratio = (safeLevel - 46) / 29;
    wordCount = 7 + Math.floor(ratio * 2.5); // 7 to 9 words
    minWordLength = 3;
    maxWordLength = 10;
  } else {
    const ratio = (safeLevel - 76) / 24;
    wordCount = 10 + Math.floor(ratio * 4.5); // 10 to 14 words
    minWordLength = 3;
    maxWordLength = 12;
  }

  const progress = (safeLevel - 1) / 99;
  
  return {
    size,
    wordCount,
    timeLimit: Math.max(40, Math.round(110 - (safeLevel - 1) * 0.7 - (size === 6 ? 5 : size === 8 ? 10 : size === 10 ? 15 : 0))),
    minTurns: safeLevel <= 5 ? 1 : safeLevel <= 25 ? 2 : 3,
    minWordLength,
    maxWordLength,
    mix: {
      easy: Math.max(0.1, 0.7 - progress * 0.5),
      medium: 0.2 + progress * 0.1,
      hard: 0.1 + progress * 0.4,
    },
  };
}
