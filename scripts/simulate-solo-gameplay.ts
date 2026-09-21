import { getSoloLevel, createSoloBoard } from "../shared/solo";
import { getDifficultyProfile } from "../shared/difficulty";

interface PlayerProfile {
  name: string;
  wordTimeByTier: {
    4: { min: number; max: number };
    6: { min: number; max: number };
    8: { min: number; max: number };
    10: { min: number; max: number };
  };
}

const PLAYERS: PlayerProfile[] = [
  {
    name: "Hızlı / Usta Oyuncu",
    wordTimeByTier: {
      4: { min: 4, max: 7 },
      6: { min: 6, max: 9 },
      8: { min: 8, max: 11 },
      10: { min: 9, max: 12 },
    },
  },
  {
    name: "Standart / Ortalama Oyuncu",
    wordTimeByTier: {
      4: { min: 6, max: 10 },
      6: { min: 9, max: 13 },
      8: { min: 11, max: 16 },
      10: { min: 13, max: 18 },
    },
  },
  {
    name: "Rahat / Yeni Başlayan",
    wordTimeByTier: {
      4: { min: 8, max: 14 },
      6: { min: 12, max: 18 },
      8: { min: 15, max: 22 },
      10: { min: 18, max: 26 },
    },
  },
];

function simulateLevel(
  level: number,
  player: PlayerProfile,
  timeLimitOverride?: (lvl: number, size: number, wordCount: number) => number
) {
  const meta = getSoloLevel(level);
  const board = createSoloBoard(level, 42, "general");
  const words = board.words;
  const size = meta.size as 4 | 6 | 8 | 10;
  const timeLimit = timeLimitOverride ? timeLimitOverride(level, size, words.length) : meta.timeLimit;

  let currentSeconds = timeLimit;
  let lastFindTime = 0;
  let wordsFound = 0;
  let totalTimeSpent = 0;

  const tierTimes = player.wordTimeByTier[size];

  for (let i = 0; i < words.length; i++) {
    // Deterministic random word time based on level and index
    const pseudoRand = ((level * 37 + i * 17) % 100) / 100;
    const timeToFindWord = tierTimes.min + pseudoRand * (tierTimes.max - tierTimes.min);

    if (currentSeconds < timeToFindWord) {
      // Ran out of time
      return {
        level,
        size,
        wordCount: words.length,
        timeLimit,
        wordsFound,
        completed: false,
        remainingTime: 0,
        totalTimeSpent: totalTimeSpent + currentSeconds,
      };
    }

    currentSeconds -= timeToFindWord;
    totalTimeSpent += timeToFindWord;
    wordsFound++;

    // Time bonus logic: +8s if combo (< 8s since last word), else +4s
    const isCombo = lastFindTime > 0 && timeToFindWord < 8;
    const bonus = isCombo ? 8 : 4;
    currentSeconds = Math.min(timeLimit, currentSeconds + bonus);
    lastFindTime = totalTimeSpent;
  }

  return {
    level,
    size,
    wordCount: words.length,
    timeLimit,
    wordsFound,
    completed: true,
    remainingTime: Math.round(currentSeconds),
    totalTimeSpent: Math.round(totalTimeSpent),
  };
}

console.log("===============================================================");
console.log("   MEVCUT SİSTEMLE SEVİYE 1 - 100 OYNANIŞ SİMÜLASYONU");
console.log("===============================================================\n");

for (const player of PLAYERS) {
  let passed = 0;
  let firstFailLevel: number | null = null;
  const stageStats: Record<string, { total: number; passed: number }> = {
    "4x4 (1-15)": { total: 15, passed: 0 },
    "6x6 (16-45)": { total: 30, passed: 0 },
    "8x8 (46-75)": { total: 30, passed: 0 },
    "10x10 (76-100)": { total: 25, passed: 0 },
  };

  for (let lvl = 1; lvl <= 100; lvl++) {
    const result = simulateLevel(lvl, player);
    const stageKey =
      lvl <= 15 ? "4x4 (1-15)" : lvl <= 45 ? "6x6 (16-45)" : lvl <= 75 ? "8x8 (46-75)" : "10x10 (76-100)";

    if (result.completed) {
      passed++;
      stageStats[stageKey].passed++;
    } else if (firstFailLevel === null) {
      firstFailLevel = lvl;
    }
  }

  console.log(`[${player.name}]`);
  console.log(`  Toplam Tamamlama: ${passed}/100 Seviye`);
  console.log(`  İlk Elendiği Seviye: ${firstFailLevel ?? "Tümünü geçti"}`);
  for (const [stg, stat] of Object.entries(stageStats)) {
    const pct = Math.round((stat.passed / stat.total) * 100);
    console.log(`  ${stg.padEnd(16)}: ${stat.passed}/${stat.total} (%${pct})`);
  }
  console.log("");
}

function proposedTimeLimit(lvl: number, size: number, wordCount: number): number {
  if (size === 4) {
    // Levels 1-15: 55s -> 45s
    const progress = (lvl - 1) / 14;
    return Math.round(55 - progress * 10);
  }
  if (size === 6) {
    // Levels 16-45: 85s -> 75s
    const progress = (lvl - 16) / 29;
    return Math.round(85 - progress * 10);
  }
  if (size === 8) {
    // Levels 46-75: 135s -> 115s
    const progress = (lvl - 46) / 29;
    return Math.round(135 - progress * 20);
  }
  // Levels 76-100 (10x10): 175s -> 150s
  const progress = (lvl - 76) / 24;
  return Math.round(175 - progress * 25);
}

console.log("===============================================================");
console.log("   ÖNERİLEN DENGELİ SİSTEMLE SEVİYE 1 - 100 SİMÜLASYONU");
console.log("===============================================================\n");

for (const player of PLAYERS) {
  let passed = 0;
  let firstFailLevel: number | null = null;
  const stageStats: Record<string, { total: number; passed: number }> = {
    "4x4 (1-15)": { total: 15, passed: 0 },
    "6x6 (16-45)": { total: 30, passed: 0 },
    "8x8 (46-75)": { total: 30, passed: 0 },
    "10x10 (76-100)": { total: 25, passed: 0 },
  };

  for (let lvl = 1; lvl <= 100; lvl++) {
    const result = simulateLevel(lvl, player, proposedTimeLimit);
    const stageKey =
      lvl <= 15 ? "4x4 (1-15)" : lvl <= 45 ? "6x6 (16-45)" : lvl <= 75 ? "8x8 (46-75)" : "10x10 (76-100)";

    if (result.completed) {
      passed++;
      stageStats[stageKey].passed++;
    } else if (firstFailLevel === null) {
      firstFailLevel = lvl;
    }
  }

  console.log(`[${player.name}] (Önerilen Model)`);
  console.log(`  Toplam Tamamlama: ${passed}/100 Seviye`);
  console.log(`  İlk Elendiği Seviye: ${firstFailLevel ?? "Tümünü geçti"}`);
  for (const [stg, stat] of Object.entries(stageStats)) {
    const pct = Math.round((stat.passed / stat.total) * 100);
    console.log(`  ${stg.padEnd(16)}: ${stat.passed}/${stat.total} (%${pct})`);
  }
  console.log("");
}

