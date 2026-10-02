import { CatalogMission } from "./missions.types";
import { DAILY_EASY_POOL, DAILY_MEDIUM_POOL, DAILY_HARD_POOL } from "./daily-missions";
import { WEEKLY_POOL } from "./weekly-missions";

export const ALL_MISSIONS: CatalogMission[] = [
  ...DAILY_EASY_POOL,
  ...DAILY_MEDIUM_POOL,
  ...DAILY_HARD_POOL,
  ...WEEKLY_POOL,
];

export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Returns 3 daily missions for a given day (1 Easy, 1 Medium, 1 Hard)
 * Deterministic based on todayId (e.g. '2026-09-09')
 */
export function getDailyMissions(todayId: string): CatalogMission[] {
  const seed = stringToSeed('daily_' + todayId);
  const rng = seededRandom(seed);

  const easyIdx = Math.floor(rng() * DAILY_EASY_POOL.length);
  const medIdx = Math.floor(rng() * DAILY_MEDIUM_POOL.length);
  const hardIdx = Math.floor(rng() * DAILY_HARD_POOL.length);

  return [
    DAILY_EASY_POOL[easyIdx],
    DAILY_MEDIUM_POOL[medIdx],
    DAILY_HARD_POOL[hardIdx],
  ];
}

/**
 * Returns 3 unique weekly missions for a given ISO week
 * Deterministic based on weekId (e.g. '2026-W37')
 */
export function getWeeklyMissions(weekId: string): CatalogMission[] {
  const seed = stringToSeed('weekly_' + weekId);
  const rng = seededRandom(seed);

  const pool = [...WEEKLY_POOL];
  const selected: CatalogMission[] = [];

  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }

  return selected;
}

export function findMissionById(id: string): CatalogMission | undefined {
  return ALL_MISSIONS.find((m) => m.id === id);
}
