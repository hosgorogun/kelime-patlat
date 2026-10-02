export type LeagueTierName = "DEMİR" | "BRONZ" | "GÜMÜŞ" | "ALTIN" | "PLATİN" | "ELMAS" | "YÜCELİK" | "ÖLÜMSÜZLÜK" | "RADIAN";

export type LeagueTierInfo = {
  name: string;
  tier: LeagueTierName;
  icon: string;
  image: string;
  color: string;
  badge: string;
  minPoints: number;
  maxPoints: number;
  currentTierPoints: number;
  targetTierPoints: number;
  totalPoints: number;
};

export interface LeagueTierConfig {
  tier: LeagueTierName;
  name: string;
  icon: string;
  image: string;
  color: string;
  minPoints: number;
  maxPoints: number;
}

export const LEAGUE_TIERS: readonly LeagueTierConfig[] = [
  { tier: "DEMİR", name: "DEMİR LİGİ", icon: "🛡️", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/iron.jpg", color: "#94A3B8", minPoints: 0, maxPoints: 349 },
  { tier: "BRONZ", name: "BRONZ LİGİ", icon: "🛡️", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/bronze.jpg", color: "#F97316", minPoints: 350, maxPoints: 899 },
  { tier: "GÜMÜŞ", name: "GÜMÜŞ LİGİ", icon: "🛡️", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/silver.jpg", color: "#38BDF8", minPoints: 900, maxPoints: 1599 },
  { tier: "ALTIN", name: "ALTIN LİGİ", icon: "🦅", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/gold.jpg", color: "#FBBF24", minPoints: 1600, maxPoints: 2499 },
  { tier: "PLATİN", name: "PLATİN LİGİ", icon: "🪽", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/platinum.jpg", color: "#67E8F9", minPoints: 2500, maxPoints: 3599 },
  { tier: "ELMAS", name: "ELMAS LİGİ", icon: "💎", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/diamond.jpg", color: "#60A5FA", minPoints: 3600, maxPoints: 4999 },
  { tier: "YÜCELİK", name: "YÜCELİK LİGİ", icon: "🔮", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/ascendant.jpg", color: "#C084FC", minPoints: 5000, maxPoints: 6999 },
  { tier: "ÖLÜMSÜZLÜK", name: "ÖLÜMSÜZLÜK LİGİ", icon: "🔥", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/immortal.jpg", color: "#FB7185", minPoints: 7000, maxPoints: 9999 },
  { tier: "RADIAN", name: "RADIAN LİGİ", icon: "👑", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/radian.jpg", color: "#FDE047", minPoints: 10000, maxPoints: Number.POSITIVE_INFINITY },
] as const;

export function getTierColor(tier?: string): string {
  if (!tier) return "#94A3B8";
  const found = LEAGUE_TIERS.find((t) => t.tier === tier);
  return found?.color ?? "#94A3B8";
}

export function getMinLpForTier(tier?: string): number {
  if (!tier) return 0;
  const found = LEAGUE_TIERS.find((t) => t.tier === tier);
  return found?.minPoints ?? 0;
}

export interface LeagueProgressState {
  lp?: number;
  [key: string]: any;
}

export function getLeagueTier(progressOrPoints: LeagueProgressState | number): LeagueTierInfo {
  let points = 0;
  if (typeof progressOrPoints === "number") {
    points = progressOrPoints;
  } else if (progressOrPoints) {
    points = Math.max(0, progressOrPoints.lp ?? 0);
  }

  const current = [...LEAGUE_TIERS].reverse().find((tier) => points >= tier.minPoints) ?? LEAGUE_TIERS[0]!;
  const currentIndex = LEAGUE_TIERS.indexOf(current);
  const next = LEAGUE_TIERS[currentIndex + 1];
  return {
    name: current.name,
    tier: current.tier,
    icon: current.icon,
    image: current.image,
    color: current.color,
    badge: current.tier,
    minPoints: current.minPoints,
    maxPoints: current.maxPoints,
    currentTierPoints: Math.max(0, points - current.minPoints),
    targetTierPoints: next ? next.minPoints - current.minPoints : 1000,
    totalPoints: points,
  };
}

export function getRank(progress: LeagueProgressState) {
  return getLeagueTier(progress).tier;
}
