import { createSoloBoard, type SoloBoard } from "./solo";

export type DailyWordleData = {
  dateId: string; // YYYY-MM-DD
  dayNumber: number; // Day count since epoch start (e.g. Day #142)
  board: SoloBoard;
  targetWords: string[];
  size: number;
};

export type DailyWordleSubmission = {
  dateId: string;
  secondsTaken: number;
  score: number;
  wordsFound: string[];
};

export type DailyWordleResult = {
  success: boolean;
  dateId: string;
  secondsTaken: number;
  score: number;
  percentile: number; // e.g. top 5%
  shareText: string;
  coinsEarned: number;
  xpEarned: number;
};

const EPOCH_START = new Date("2026-01-01T00:00:00Z").getTime();

export function getTodayDateId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayNumber(dateId: string = getTodayDateId()): number {
  const parts = dateId.split("-").map(Number);
  const targetDate = new Date(parts[0]!, parts[1]! - 1, parts[2]!).getTime();
  const diffDays = Math.max(1, Math.floor((targetDate - EPOCH_START) / (24 * 60 * 60 * 1000)));
  return diffDays;
}

export function generateDailyWordle(dateId: string = getTodayDateId()): DailyWordleData {
  const parts = dateId.split("-").map(Number);
  const seed = (parts[0]! * 10000 + parts[1]! * 100 + parts[2]!) >>> 0;
  // Representative level: rotates smoothly based on day of week (4x4 on weekdays, 6x6 on weekend)
  const dayOfWeek = new Date(parts[0]!, parts[1]! - 1, parts[2]!).getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const level = isWeekend ? 20 : 8; // 6x6 on weekend, 4x4 on weekdays
  const variation = (seed % 1000) + 1;

  const board = createSoloBoard(level, variation, "general");
  return {
    dateId,
    dayNumber: getDayNumber(dateId),
    board,
    targetWords: board.words,
    size: board.size,
  };
}

export function calculateDailyPercentile(secondsTaken: number): number {
  if (secondsTaken <= 20) return 2;
  if (secondsTaken <= 35) return 5;
  if (secondsTaken <= 50) return 12;
  if (secondsTaken <= 70) return 25;
  if (secondsTaken <= 95) return 40;
  if (secondsTaken <= 120) return 60;
  return 80;
}

export function buildDailyShareText(
  dayNumber: number,
  secondsTaken: number,
  percentile: number,
  wordsCount: number,
  dateId: string = getTodayDateId()
): string {
  const emojiRows = [
    "🟩🟩🟩🟩",
    "🟩🟨🟩🟩",
    "🟩🟩🟩🟩",
  ];
  if (wordsCount > 3) {
    emojiRows.push("🟨🟩🟩🟩");
  }

  const emojiBlock = emojiRows.join("\n");
  const speedBadge = percentile <= 10 ? `🔥 (En Hızlı %${percentile})` : `⚡ (%${percentile})`;

  return [
    `🧩 Kelime Patlat • Günün Bulmacası #${dayNumber}`,
    `⏱️ ${secondsTaken} saniyede tamamladım! ${speedBadge}`,
    emojiBlock,
    "",
    "Sen benden daha hızlı çözebilir misin? 🏆",
    `👉 https://kelimepatlat.com/daily?d=${dateId}`,
  ].join("\n");
}
