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
  
  let timeLimit = 60;
  if (size === 4) {
    // Seviye 1-15: 55 sn -> 45 sn (3 kelime, 16 hücre)
    const tierRatio = (safeLevel - 1) / 14;
    timeLimit = Math.round(55 - tierRatio * 10);
  } else if (size === 6) {
    // Seviye 16-45: 85 sn -> 75 sn (5-8 kelime, 36 hücre)
    const tierRatio = (safeLevel - 16) / 29;
    timeLimit = Math.round(85 - tierRatio * 10);
  } else if (size === 8) {
    // Seviye 46-75: 135 sn -> 115 sn (8-12 kelime, 64 hücre)
    const tierRatio = (safeLevel - 46) / 29;
    timeLimit = Math.round(135 - tierRatio * 20);
  } else {
    // Seviye 76-100: 175 sn -> 150 sn (10-14 kelime, 100 hücre)
    const tierRatio = (safeLevel - 76) / 24;
    timeLimit = Math.round(175 - tierRatio * 25);
  }

  return {
    size,
    wordCount,
    timeLimit,
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
