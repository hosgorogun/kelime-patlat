export function getDayId(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getDiffDays(dayA: string, dayB: string): number {
  const partsA = dayA.split("-").map(Number);
  const partsB = dayB.split("-").map(Number);
  if (partsA.length !== 3 || partsB.length !== 3 || partsA.some(isNaN) || partsB.some(isNaN)) {
    return NaN;
  }
  const utcA = Date.UTC(partsA[0], partsA[1] - 1, partsA[2]);
  const utcB = Date.UTC(partsB[0], partsB[1] - 1, partsB[2]);
  return Math.round((utcA - utcB) / (1000 * 60 * 60 * 24));
}

export function getPreviousDayId(dayId: string, daysAgo = 1): string {
  const [y, m, d] = dayId.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - daysAgo));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

