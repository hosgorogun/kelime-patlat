export type BoosterType = "hint" | "freeze" | "shuffle";

export const BOOSTER_CONFIG: Record<BoosterType, { name: string; icon: string; cost: number; description: string }> = {
  hint: {
    name: "Radar / İpucu",
    icon: "🎯",
    cost: 25,
    description: "Tahtadaki gizli bir kelimenin ilk 2 harfini parlatır.",
  },
  freeze: {
    name: "Zaman Dondurucu",
    icon: "❄️",
    cost: 30,
    description: "Süreyi 5 saniyeliğine tamamen dondurur.",
  },
  shuffle: {
    name: "Tahtayı Karıştır",
    icon: "🔀",
    cost: 20,
    description: "Harfleri karıştırarak yeni görüş açısı kazandırır.",
  },
};

export interface BoosterProgressState {
  boosters?: {
    hint?: number;
    freeze?: number;
    shuffle?: number;
  };
  coins?: number;
  lastSpinTimestamp?: number;
  infiniteLivesUntil?: number;
  lives?: number;
  [key: string]: any;
}

export function useBooster<T extends BoosterProgressState>(
  progress: T,
  type: BoosterType
): { success: boolean; message: string; updatedProgress: T } {
  const currentCount = progress.boosters?.[type] ?? 0;
  if (currentCount > 0) {
    const nextBoosters = {
      hint: progress.boosters?.hint ?? 0,
      freeze: progress.boosters?.freeze ?? 0,
      shuffle: progress.boosters?.shuffle ?? 0,
      [type]: currentCount - 1,
    };
    return {
      success: true,
      message: `${BOOSTER_CONFIG[type].name} kullanıldı!`,
      updatedProgress: {
        ...progress,
        boosters: nextBoosters,
      },
    };
  }

  const cost = BOOSTER_CONFIG[type].cost;
  const currentCoins = progress.coins ?? 0;
  if (currentCoins < cost) {
    return {
      success: false,
      message: `Yetersiz çip! ${cost} Çip gerekiyor.`,
      updatedProgress: progress,
    };
  }

  return {
    success: true,
    message: `${BOOSTER_CONFIG[type].name} satın alındı ve kullanıldı!`,
    updatedProgress: {
      ...progress,
      coins: currentCoins - cost,
    },
  };
}

export function buyBooster<T extends BoosterProgressState>(
  progress: T,
  type: BoosterType,
  count = 1
): { success: boolean; message: string; updatedProgress: T } {
  const totalCost = BOOSTER_CONFIG[type].cost * count;
  const currentCoins = progress.coins ?? 0;
  if (currentCoins < totalCost) {
    return {
      success: false,
      message: `Yetersiz çip! ${totalCost} Çip gerekiyor.`,
      updatedProgress: progress,
    };
  }

  const nextBoosters = {
    hint: progress.boosters?.hint ?? 0,
    freeze: progress.boosters?.freeze ?? 0,
    shuffle: progress.boosters?.shuffle ?? 0,
    [type]: (progress.boosters?.[type] ?? 0) + count,
  };

  return {
    success: true,
    message: `+${count} ${BOOSTER_CONFIG[type].name} envanterinize eklendi!`,
    updatedProgress: {
      ...progress,
      coins: currentCoins - totalCost,
      boosters: nextBoosters,
    },
  };
}

export type LuckyWheelSector = {
  id: number;
  label: string;
  icon: string;
  type: "coins" | "life" | "infinite_lives" | "booster";
  value: number;
  boosterType?: BoosterType;
  color: string;
};

export const LUCKY_WHEEL_SECTORS: readonly LuckyWheelSector[] = [
  { id: 0, label: "25 Çip", icon: "🪙", type: "coins", value: 25, color: "#F59E0B" },
  { id: 1, label: "+1 Can", icon: "💚", type: "life", value: 1, color: "#10B981" },
  { id: 2, label: "1x Radar", icon: "🎯", type: "booster", value: 1, boosterType: "hint", color: "#3B82F6" },
  { id: 3, label: "50 Çip", icon: "💰", type: "coins", value: 50, color: "#EC4899" },
  { id: 4, label: "15 Dk Sonsuz Can", icon: "♾️", type: "infinite_lives", value: 15, color: "#8B5CF6" },
  { id: 5, label: "1x Dondurucu", icon: "❄️", type: "booster", value: 1, boosterType: "freeze", color: "#06B6D4" },
  { id: 6, label: "100 Çip", icon: "💎", type: "coins", value: 100, color: "#EAB308" },
  { id: 7, label: "1x Karıştır", icon: "🔀", type: "booster", value: 1, boosterType: "shuffle", color: "#14B8A6" },
];

export const LUCKY_WHEEL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function canSpinLuckyWheel(progress: { lastSpinTimestamp?: number }): { canSpin: boolean; remainingSeconds: number } {
  const lastSpin = progress.lastSpinTimestamp ?? 0;
  const now = Date.now();
  const elapsed = now - lastSpin;
  if (elapsed >= LUCKY_WHEEL_COOLDOWN_MS) {
    return { canSpin: true, remainingSeconds: 0 };
  }
  return { canSpin: false, remainingSeconds: Math.ceil((LUCKY_WHEEL_COOLDOWN_MS - elapsed) / 1000) };
}

export function claimLuckyWheelReward<T extends BoosterProgressState>(
  progress: T,
  sectorIndex: number,
  isAdSpin = false
): {
  reward: LuckyWheelSector;
  updatedProgress: T;
  message: string;
} {
  const sector = LUCKY_WHEEL_SECTORS[sectorIndex] ?? LUCKY_WHEEL_SECTORS[0]!;
  let updated: T = { ...progress };
  if (!isAdSpin) {
    updated.lastSpinTimestamp = Date.now();
  }

  let message = "";
  if (sector.type === "coins") {
    updated.coins = (updated.coins ?? 0) + sector.value;
    message = `+${sector.value} Çip Kazandın! 🪙`;
  } else if (sector.type === "life") {
    updated.lives = Math.min(5, (updated.lives ?? 5) + sector.value);
    message = `+${sector.value} Can Kazandın! 💚`;
  } else if (sector.type === "infinite_lives") {
    const currentExpiry = updated.infiniteLivesUntil && updated.infiniteLivesUntil > Date.now() ? updated.infiniteLivesUntil : Date.now();
    updated.infiniteLivesUntil = currentExpiry + sector.value * 60 * 1000;
    updated.lives = 5;
    message = `${sector.value} Dakika Sonsuz Can Kazandın! ♾️`;
  } else if (sector.type === "booster" && sector.boosterType) {
    const bType = sector.boosterType;
    const currentCount = updated.boosters?.[bType] ?? 0;
    updated.boosters = {
      hint: updated.boosters?.hint ?? 0,
      freeze: updated.boosters?.freeze ?? 0,
      shuffle: updated.boosters?.shuffle ?? 0,
      [bType]: currentCount + sector.value,
    };
    message = `+${sector.value} ${BOOSTER_CONFIG[bType].name} Kazandın! ${sector.icon}`;
  }

  return { reward: sector, updatedProgress: updated, message };
}
