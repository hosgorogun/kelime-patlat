export const MAX_LIVES = 5;
export const LIVES_REGEN_INTERVAL_MS = 30 * 60 * 1000; // 30 dakika
export const COST_PER_LIFE = 20;
export const COST_REFILL_ALL = 75;

export interface LivesProgressState {
  lives?: number;
  lastLifeRegenTimestamp?: number;
  infiniteLivesUntil?: number;
  coins?: number;
  [key: string]: any;
}

export function getCalculatedLives(progress: Partial<LivesProgressState>): {
  lives: number;
  lastLifeRegenTimestamp: number;
  nextLifeTimerSeconds: number;
  isInfinite?: boolean;
  infiniteRemainingSeconds?: number;
} {
  const now = Date.now();
  // Anti-time travel protection: If infiniteLivesUntil is absurdly far in future (> 2 days), cap it to max 2 hours
  if (progress.infiniteLivesUntil && progress.infiniteLivesUntil > now) {
    const maxAllowedFuture = now + 48 * 60 * 60 * 1000;
    const safeInfiniteUntil = Math.min(progress.infiniteLivesUntil, maxAllowedFuture);
    const remainingSeconds = Math.ceil((safeInfiniteUntil - now) / 1000);
    return {
      lives: MAX_LIVES,
      lastLifeRegenTimestamp:
        typeof progress.lastLifeRegenTimestamp === "number" && Number.isFinite(progress.lastLifeRegenTimestamp)
          ? progress.lastLifeRegenTimestamp
          : now,
      nextLifeTimerSeconds: 0,
      isInfinite: true,
      infiniteRemainingSeconds: remainingSeconds,
    };
  }

  const max = MAX_LIVES;
  const currentLives = typeof progress.lives === "number" && Number.isFinite(progress.lives) ? Math.max(0, Math.min(max, progress.lives)) : max;
  let lastRegen = typeof progress.lastLifeRegenTimestamp === "number" && Number.isFinite(progress.lastLifeRegenTimestamp) ? progress.lastLifeRegenTimestamp : Date.now();

  if (currentLives >= max) {
    return { lives: max, lastLifeRegenTimestamp: Date.now(), nextLifeTimerSeconds: 0 };
  }

  // Anti time-jump exploit: If lastRegen is in the future or corrupted, reset to current now
  if (lastRegen > now) {
    lastRegen = now;
  }
  const elapsed = Math.max(0, now - lastRegen);
  const regenerated = Math.floor(elapsed / LIVES_REGEN_INTERVAL_MS);

  if (regenerated > 0) {
    const nextLives = Math.min(max, currentLives + regenerated);
    if (nextLives >= max) {
      return { lives: max, lastLifeRegenTimestamp: now, nextLifeTimerSeconds: 0 };
    }
    const nextRegenTime = lastRegen + regenerated * LIVES_REGEN_INTERVAL_MS;
    const remainingMs = Math.max(0, nextRegenTime + LIVES_REGEN_INTERVAL_MS - now);
    return { lives: nextLives, lastLifeRegenTimestamp: nextRegenTime, nextLifeTimerSeconds: Math.ceil(remainingMs / 1000) };
  }

  const remainingMs = Math.max(0, LIVES_REGEN_INTERVAL_MS - elapsed);
  return { lives: currentLives, lastLifeRegenTimestamp: lastRegen, nextLifeTimerSeconds: Math.ceil(remainingMs / 1000) };
}

export function deductLife<T extends LivesProgressState>(progress: T): T {
  if (progress.infiniteLivesUntil && progress.infiniteLivesUntil > Date.now()) {
    return progress; // Sonsuz can aktifken can düşmez
  }
  const calc = getCalculatedLives(progress);
  if (calc.lives <= 0) return { ...progress, lives: 0, lastLifeRegenTimestamp: calc.lastLifeRegenTimestamp };
  const nextLives = calc.lives - 1;
  const now = Date.now();
  const nextTimestamp = calc.lives === MAX_LIVES ? now : calc.lastLifeRegenTimestamp;
  return {
    ...progress,
    lives: nextLives,
    lastLifeRegenTimestamp: nextTimestamp,
  };
}

export function buyLives<T extends LivesProgressState>(progress: T, option: "one" | "all" | "ad"): { success: boolean; message: string; updatedProgress: T } {
  const calc = getCalculatedLives(progress);
  if (calc.isInfinite) {
    return { success: false, message: "Sonsuz can süreniz devam ediyor!", updatedProgress: progress };
  }
  if (calc.lives >= MAX_LIVES) {
    return { success: false, message: "Canlarınız zaten dolu!", updatedProgress: progress };
  }

  if (option === "ad") {
    const nextLives = Math.min(MAX_LIVES, calc.lives + 1);
    const updated: T = {
      ...progress,
      lives: nextLives,
      lastLifeRegenTimestamp: nextLives >= MAX_LIVES ? Date.now() : calc.lastLifeRegenTimestamp,
    };
    return { success: true, message: "+1 Can kazandınız!", updatedProgress: updated };
  }

  const cost = option === "one" ? COST_PER_LIFE : COST_REFILL_ALL;
  const currentCoins = progress.coins ?? 0;
  if (currentCoins < cost) {
    return { success: false, message: `Yetersiz çip! En az ${cost} Çip gerekiyor.`, updatedProgress: progress };
  }

  const targetLives = option === "one" ? Math.min(MAX_LIVES, calc.lives + 1) : MAX_LIVES;
  const updated: T = {
    ...progress,
    coins: currentCoins - cost,
    lives: targetLives,
    lastLifeRegenTimestamp: targetLives >= MAX_LIVES ? Date.now() : calc.lastLifeRegenTimestamp,
  };

  const msg = option === "one" ? "+1 Can satın alındı!" : "Tüm canlarınız (5/5) dolduruldu!";
  return { success: true, message: msg, updatedProgress: updated };
}

export function grantInfiniteLives<T extends LivesProgressState>(progress: T, minutes: number): T {
  const now = Date.now();
  const currentExpiry = progress.infiniteLivesUntil && progress.infiniteLivesUntil > now ? progress.infiniteLivesUntil : now;
  return {
    ...progress,
    lives: MAX_LIVES,
    infiniteLivesUntil: currentExpiry + minutes * 60 * 1000,
  };
}
