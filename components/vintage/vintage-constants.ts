export const TR_ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
export const VINTAGE_STORAGE_KEY = "@kelime_patlat:vintage_puzzle_progress";
export const VINTAGE_HINT_COST = 25;

/**
 * Seviye zorluğuna göre 3 yıldız ve 2 yıldız azami süre sınırları (saniye)
 * - 1-5 Kolay: 3 Yıldız <= 90sn (1.5 dk), 2 Yıldız <= 180sn (3 dk)
 * - 6-10 Orta: 3 Yıldız <= 120sn (2 dk), 2 Yıldız <= 240sn (4 dk)
 * - 11-15 Zor: 3 Yıldız <= 160sn (2.6 dk), 2 Yıldız <= 300sn (5 dk)
 * - 16-20 Usta: 3 Yıldız <= 210sn (3.5 dk), 2 Yıldız <= 390sn (6.5 dk)
 */
export function getLevelTimeThresholds(level: number): { threeStar: number; twoStar: number } {
  if (level <= 5) return { threeStar: 90, twoStar: 180 };
  if (level <= 10) return { threeStar: 120, twoStar: 240 };
  if (level <= 15) return { threeStar: 160, twoStar: 300 };
  return { threeStar: 210, twoStar: 390 };
}

export function calculateLevelStars(level: number, elapsedSeconds: number): number {
  const { threeStar, twoStar } = getLevelTimeThresholds(level);
  if (elapsedSeconds <= threeStar) return 3;
  if (elapsedSeconds <= twoStar) return 2;
  return 1;
}

export function formatElapsedTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
