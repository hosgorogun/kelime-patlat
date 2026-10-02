/**
 * Kelime Patlat - Seviye ve XP Matematiksel İlerleme Eğrisi
 * Seviye 1 - 15: Her seviye 200 XP
 * Seviye 16 - 30: Her seviye 350 XP
 * Seviye 31 - 50: Her seviye 500 XP
 * Seviye 51 - 75: Her seviye 750 XP
 * Seviye 76 - 100: Her seviye 1000 XP
 * Seviye 100+: Her seviye 1200 XP
 */

export function getXpRequiredForNextLevel(currentLevel: number): number {
  if (currentLevel < 15) return 200;
  if (currentLevel < 30) return 350;
  if (currentLevel < 50) return 500;
  if (currentLevel < 75) return 750;
  if (currentLevel < 100) return 1000;
  return 1200;
}

export function getXpForLevel(level: number): number {
  const target = Math.max(1, Math.floor(level));
  if (target <= 1) return 0;
  if (target <= 15) return (target - 1) * 200;
  if (target <= 30) return 2800 + (target - 15) * 350;
  if (target <= 50) return 8050 + (target - 30) * 500;
  if (target <= 75) return 18050 + (target - 50) * 750;
  if (target <= 100) return 36800 + (target - 75) * 1000;
  return 61800 + (target - 100) * 1200;
}

export function getPlayerLevel(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  if (safeXp < 2800) {
    return Math.floor(safeXp / 200) + 1;
  }
  if (safeXp < 8050) {
    return 15 + Math.floor((safeXp - 2800) / 350);
  }
  if (safeXp < 18050) {
    return 30 + Math.floor((safeXp - 8050) / 500);
  }
  if (safeXp < 36800) {
    return 50 + Math.floor((safeXp - 18050) / 750);
  }
  if (safeXp < 61800) {
    return 75 + Math.floor((safeXp - 36800) / 1000);
  }
  return 100 + Math.floor((safeXp - 61800) / 1200);
}

export type LevelProgressInfo = {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressRatio: number;
  totalXpForCurrentLevel: number;
  totalXpForNextLevel: number;
};

export function getLevelProgress(xp: number): LevelProgressInfo {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  const level = getPlayerLevel(safeXp);
  const currentLevelBaseXp = getXpForLevel(level);
  const nextLevelXp = getXpRequiredForNextLevel(level);
  const currentLevelXp = Math.max(0, safeXp - currentLevelBaseXp);
  const progressRatio = Math.min(1, Math.max(0.04, currentLevelXp / nextLevelXp));

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progressRatio,
    totalXpForCurrentLevel: currentLevelBaseXp,
    totalXpForNextLevel: currentLevelBaseXp + nextLevelXp,
  };
}
