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

export type WeeklyCohortMember = {
  id: string;
  name: string;
  avatar: string;
  selectedTitle?: string;
  selectedFrame?: string;
  lp: number;
  tier: LeagueTierName;
  weeklyPoints: number;
  isCurrentPlayer?: boolean;
  zone: "promotion" | "safe" | "relegation";
};

export type WeeklyDivisionCohort = {
  weekId: string;
  tier: LeagueTierName;
  divisionNumber: number;
  members: WeeklyCohortMember[];
  secondsUntilReset: number;
};

const COHORT_RIVAL_NAMES = [
  "Caner_Patlat", "Deniz_Matrix", "Selin_Harf", "Kaan_Gladyator", "Merve_Neon",
  "Burak_Usta", "Zeynep_Kelimelik", "Emre_Zaman", "Elif_Simyaci", "Baris_Ruzgar",
  "Ayse_Pusula", "Kerem_Kivilcim", "Defne_Ayna", "Onur_Kripto", "Ezgi_Yildiz",
  "Okan_Sonsuz", "Buse_Gunes", "Serkan_Firtina", "Derya_Kozmos", "Tolga_Kutub",
];

export function getWeeklyCohort(
  player: {
    id: string;
    name: string;
    avatar?: string;
    avatarPhoto?: string;
    lp?: number;
    selectedTitle?: string;
    selectedFrame?: string;
  },
  now = new Date()
): WeeklyDivisionCohort {
  const currentLp = Math.max(0, player.lp ?? 0);
  const tierInfo = getLeagueTier(currentLp);

  // ISO Hafta ID hesaplaması
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekId = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;

  // Pazar 23:59:59 kalan saniye
  const nextSunday = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7;
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 59, 999);
  const secondsUntilReset = Math.max(0, Math.floor((nextSunday.getTime() - now.getTime()) / 1000));

  // Seeded PRNG for consistent division
  const strSeed = `${weekId}:${player.id}:${tierInfo.tier}`;
  let seed = [...strSeed].reduce((acc, c) => ((acc * 33) ^ c.charCodeAt(0)) >>> 0, 5381);
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const divisionNumber = 1 + (seed % 42);

  // Oyuncunun haftalık puanı (taban LP'nin modüler kısmı + aktif performans simülasyonu)
  const playerWeeklyPoints = Math.max(80, (currentLp % 350) + 120);

  const members: WeeklyCohortMember[] = [];

  // Mevcut oyuncu
  members.push({
    id: player.id,
    name: player.name || "SEN",
    avatar: player.avatar || "spark",
    selectedTitle: player.selectedTitle || "[OYUNCU]",
    selectedFrame: player.selectedFrame || "signal",
    lp: currentLp,
    tier: tierInfo.tier,
    weeklyPoints: playerWeeklyPoints,
    isCurrentPlayer: true,
    zone: "safe",
  });

  // 19 Gerçekçi Rakip
  const baseScore = Math.max(100, playerWeeklyPoints);
  for (let i = 0; i < 19; i++) {
    const rName = COHORT_RIVAL_NAMES[i % COHORT_RIVAL_NAMES.length]!;
    // Skoru oyuncu etrafında gerçekçi dağıt (+/- %40)
    const factor = 0.6 + rng() * 0.8;
    const weeklyPoints = Math.max(30, Math.round(baseScore * factor));
    const rivalLp = Math.max(tierInfo.minPoints, Math.round(tierInfo.minPoints + rng() * (tierInfo.maxPoints === Infinity ? 2000 : (tierInfo.maxPoints - tierInfo.minPoints))));
    members.push({
      id: `cohort_rival_${i}_${divisionNumber}`,
      name: rName,
      avatar: ["spark", "orbit", "sage", "comet", "ember"][i % 5]!,
      selectedTitle: ["[NEON HÂKİMİ]", "[ÇAYLAK]", "[KELİME AVCISI]", "[MİMAR]", "[GLADYATÖR]"][i % 5],
      selectedFrame: ["signal", "neon", "chrome", "gold"][i % 4],
      lp: rivalLp,
      tier: tierInfo.tier,
      weeklyPoints,
      isCurrentPlayer: false,
      zone: "safe",
    });
  }

  // Puan sırasına göre sırala
  members.sort((a, b) => b.weeklyPoints - a.weeklyPoints);

  // Bölgeleri ata: 1-3: Yükselme, 4-17: Güvenli, 18-20: Düşme
  members.forEach((m, idx) => {
    if (idx < 3) {
      m.zone = "promotion";
    } else if (idx >= 17) {
      m.zone = "relegation";
    } else {
      m.zone = "safe";
    }
  });

  return {
    weekId,
    tier: tierInfo.tier,
    divisionNumber,
    members,
    secondsUntilReset,
  };
}
