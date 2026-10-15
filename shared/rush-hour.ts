/**
 * Rush Hour (Altın Saat Turnuvası) & Günlük Eşit Tahta Liderlik Tablosu
 * Her akşam 20:00 - 21:00 arası 2x Lig Puanı (LP) ve özel turnuva tacı.
 */

import { BoardSize, fillBoardBlanks, TURKISH_LETTERS } from "./game";
import { getDayId } from "./progression/date-utils";

export const RUSH_HOUR_START_HOUR = 20; // 20:00
export const RUSH_HOUR_END_HOUR = 21;   // 21:00

export function isRushHourActive(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= RUSH_HOUR_START_HOUR && hour < RUSH_HOUR_END_HOUR;
}

export function getRushHourLpMultiplier(date: Date = new Date()): number {
  return isRushHourActive(date) ? 2.0 : 1.0;
}

export function getRushHourRemainingMinutes(date: Date = new Date()): number {
  if (!isRushHourActive(date)) return 0;
  const minutes = date.getMinutes();
  return 60 - minutes;
}

/**
 * Günün Eşit Tahtası (National Daily Board)
 * Tüm Türkiye'deki oyuncular için günün tarihine göre deterministik olarak üretilen 5x5 tahta.
 */
export function generateDailyCommunityBoard(dayId: string = getDayId()): {
  dayId: string;
  size: 5;
  board: string[];
} {
  let hash = 0;
  for (let i = 0; i < dayId.length; i++) {
    hash = (hash << 5) - hash + dayId.charCodeAt(i);
    hash |= 0;
  }

  const seeded = (index: number) => {
    let t = (hash + index * 1013904223) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const board: string[] = [];
  for (let i = 0; i < 25; i++) {
    const letter = TURKISH_LETTERS[Math.floor(seeded(i) * TURKISH_LETTERS.length)]!;
    board.push(letter);
  }

  return {
    dayId,
    size: 5,
    board,
  };
}
