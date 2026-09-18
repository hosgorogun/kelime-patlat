export type ThemePackId = "nature" | "city" | "mind" | "space" | "sports" | "food";
export type AvatarId = "spark" | "orbit" | "sage" | "comet" | "ember";

export type ThemePack = {
  id: ThemePackId;
  label: string;
  title: string;
  description: string;
  accent: string;
  glow: string;
  icon: string;
};

export type SeasonMission = {
  id: "daily" | "duels" | "wordsmith";
  title: string;
  description: string;
  target: number;
  rewardXp: number;
  icon: string;
};

export type DailyChallenge = {
  id: string;
  variation: number;
  level: number;
  themeId: ThemePackId;
  title: string;
  rewardXp: number;
};

export * from "./missions-catalog";
import { getDailyMissions, getWeeklyMissions, CatalogMission } from "./missions-catalog";

export type PlayerProgress = {
  xp: number;
  lp?: number;
  dailyCompletedId: string | null;
  streak: number;
  wins: number;
  matches: number;
  bestScore: number;
  bestTempo: number;
  bestArcadeScore: number;
  missions: Record<string, number>;
  selectedTheme: ThemePackId;
  selectedAvatar: AvatarId;
  history: string[];
  coins?: number;
  streakShields?: number;
  radarChargesBonus?: number;
  welcomeRewardClaimed?: boolean;
  lastMatchReward?: {
    xp: number;
    lp: number;
    coins: number;
  };
  lastLoginDay?: string;
  loginDaysCount?: number;
  lastStreakCheckDate?: string;
  missionsDate?: string;
  dailyClaimed?: Record<string, boolean>;
  weeklyMissionsWeek?: string;
  weeklyClaimed?: Record<string, boolean>;
  claimedMilestones?: Record<number, boolean>;
  purchasedAvatars?: Record<string, boolean>;
  selectedTitle?: string;
  gender?: GenderType;
  avatarPhoto?: string;
  selectedFrame?: string;
  selectedVictoryEffect?: string;
  ownedFrames?: Record<string, boolean>;
  ownedVictoryEffects?: Record<string, boolean>;
  selectedBoardSkin?: string;
  ownedBoardSkins?: Record<string, boolean>;
  seasonHistory?: Array<{ seasonId: string; rank: string; lp: number; date: string }>;
  lastSeasonResetId?: string;
  soloUnlockedLevel?: number;
  vintageProgress?: VintageProgress;
  sfxEnabled?: boolean;
  hapticsEnabled?: boolean;
  lives?: number;
  lastLifeRegenTimestamp?: number;
  friends?: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
    xp: number;
    level?: number;
    lp?: number;
    tier?: string;
    wins?: number;
    matches?: number;
  }>;
};

export type VintageProgress = {
  maxUnlockedLevel: number;
  completedLevels: number[];
  score: number;
};

export type GenderType = "male" | "female" | "unspecified";


export type MilestoneReward = {
  level: number;
  title: string;
  coins: number;
  shields: number;
  xp: number;
  desc: string;
};

export const MILESTONE_REWARDS: MilestoneReward[] = [
  { level: 15, title: "4×4 MEZUNİYETİ", coins: 20, shields: 1, xp: 150, desc: "Mini siber ağı tamamladın!" },
  { level: 30, title: "SİBER ROTA SANDIĞI", coins: 35, shields: 1, xp: 200, desc: "Orta hat operasyon başarısı!" },
  { level: 45, title: "6×6 USTALIK SANDIĞI", coins: 50, shields: 2, xp: 300, desc: "6×6 geniş ağı fethettin!" },
  { level: 60, title: "DERİN SİBER KASASI", coins: 75, shields: 2, xp: 400, desc: "Büyük 8×8 operasyon ödülü!" },
  { level: 75, title: "8×8 EFSANE SANDIĞI", coins: 100, shields: 2, xp: 500, desc: "Devasa ızgarayı aştın!" },
  { level: 100, title: "KOZMİK ŞAMPİYON TACI", coins: 150, shields: 3, xp: 1000, desc: "100 seviyenin mutlak galibi!" },
];

export type AvatarOption = { id: AvatarId; label: string; icon: string; color: string; surface: string; unlockHint: string };
export type Badge = { id: string; title: string; description: string; icon: string; accent: string; unlocked: boolean };

export const AVATARS: AvatarOption[] = [
  { id: "spark", label: "KIVILCIM", icon: "✦", color: "#50E3C2", surface: "#153E3A", unlockHint: "Her zaman açık siber mod." },
  { id: "orbit", label: "YÖRÜNGE", icon: "◌", color: "#9A76ED", surface: "#332456", unlockHint: "Seviye 3 olduğunda açılır." },
  { id: "sage", label: "BİLGE", icon: "◇", color: "#FFC24A", surface: "#4E3A1D", unlockHint: "Seviye 6 olduğunda açılır." },
  { id: "comet", label: "KUYRUKLU", icon: "☄", color: "#79C8FF", surface: "#18375A", unlockHint: "Arcade modda 400 puanı aş." },
  { id: "ember", label: "KOR", icon: "✺", color: "#FF9B62", surface: "#513024", unlockHint: "Günlük serini 5 güne çıkar." },
];

export const THEME_PACKS: ThemePack[] = [
  { id: "nature", label: "DOĞA", title: "YEŞİL PUSULA", description: "Orman, deniz ve gökyüzünden kıvrımlı rotalar.", accent: "#55E6B2", glow: "#113F3B", icon: "✦" },
  { id: "city", label: "ŞEHİR", title: "NEON SOKAKLAR", description: "Kent, yol ve keşif kelimelerinin hızlı paketi.", accent: "#79C8FF", glow: "#1B3159", icon: "⌁" },
  { id: "mind", label: "ZİHİN", title: "BİLMECE ODASI", description: "Bilgi, çözüm ve mantık rotaları için uzman paketi.", accent: "#FFC86A", glow: "#50391B", icon: "◈" },
  { id: "space", label: "UZAY", title: "KOZMİK ROTA", description: "Yıldızlar, gezegenler ve derin galaksi yolları.", accent: "#A78BFA", glow: "#2E1065", icon: "☄" },
  { id: "sports", label: "SPOR", title: "ŞAMPİYONLAR HATTI", description: "Futbol, basketbol ve rekabetçi spor terimleri.", accent: "#FB923C", glow: "#7C2D12", icon: "⚽" },
  { id: "food", label: "YEMEK", title: "LEZZET ROTASI", description: "Mutfak, tatlılar ve en lezzetli yemek kelimeleri.", accent: "#F43F5E", glow: "#881337", icon: "🍳" },
];

export const SEASON_MISSIONS: SeasonMission[] = [
  { id: "daily", title: "GÜNÜN İZİ", description: "Günlük sabit tahtayı tamamla.", target: 1, rewardXp: 120, icon: "☀" },
  { id: "duels", title: "BASKI HATTI", description: "İki düelloyu bitir.", target: 2, rewardXp: 80, icon: "⚡" },
  { id: "wordsmith", title: "UZUN ROTA", description: "Yedi harfli bir kelime bul.", target: 1, rewardXp: 70, icon: "◌" },
];

export const SEASON_LEADERBOARD = [
  { rank: 1, name: "LÂL", score: 2480, tag: "USTA", accent: "#FFC24A" },
  { rank: 2, name: "ROTAKURT", score: 2260, tag: "EFSANE", accent: "#A78BFA" },
  { rank: 3, name: "MİNTY", score: 2140, tag: "SEÇKİN", accent: "#50E3C2" },
  { rank: 4, name: "KIVRIM", score: 1980, tag: "UZMAN", accent: "#79C8FF" },
] as const;

export const MAX_LIVES = 5;
export const LIVES_REGEN_INTERVAL_MS = 15 * 60 * 1000; // 15 dakika
export const COST_PER_LIFE = 25;
export const COST_REFILL_ALL = 125;

export const DEFAULT_PROGRESS: PlayerProgress = {
  xp: 0,
  lp: 0,
  dailyCompletedId: null,
  streak: 0,
  wins: 0,
  matches: 0,
  bestScore: 0,
  bestTempo: 0,
  bestArcadeScore: 0,
  missions: { daily: 0, duels: 0, wordsmith: 0 },
  selectedTheme: "nature",
  selectedAvatar: "spark",
  history: [],
  streakShields: 0,
  coins: 0,
  radarChargesBonus: 0,
  claimedMilestones: {},
  dailyClaimed: {},
  gender: "unspecified",
  avatarPhoto: undefined,
  selectedFrame: "signal",
  selectedVictoryEffect: "pulse",
  ownedFrames: { signal: true },
  ownedVictoryEffects: { pulse: true },
  selectedBoardSkin: "grid",
  ownedBoardSkins: { grid: true },
  soloUnlockedLevel: 1,
  vintageProgress: {
    maxUnlockedLevel: 1,
    completedLevels: [],
    score: 0,
  },
  sfxEnabled: true,
  hapticsEnabled: true,
  lives: MAX_LIVES,
  lastLifeRegenTimestamp: Date.now(),
  friends: [],
};

export function getCalculatedLives(progress: Partial<PlayerProgress>): {
  lives: number;
  lastLifeRegenTimestamp: number;
  nextLifeTimerSeconds: number;
} {
  const max = MAX_LIVES;
  const currentLives = typeof progress.lives === "number" && Number.isFinite(progress.lives) ? Math.max(0, Math.min(max, progress.lives)) : max;
  let lastRegen = typeof progress.lastLifeRegenTimestamp === "number" && Number.isFinite(progress.lastLifeRegenTimestamp) ? progress.lastLifeRegenTimestamp : Date.now();

  if (currentLives >= max) {
    return { lives: max, lastLifeRegenTimestamp: Date.now(), nextLifeTimerSeconds: 0 };
  }

  const now = Date.now();
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

export function deductLife(progress: PlayerProgress): PlayerProgress {
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

export function buyLives(progress: PlayerProgress, option: "one" | "all" | "ad"): { success: boolean; message: string; updatedProgress: PlayerProgress } {
  const calc = getCalculatedLives(progress);
  if (calc.lives >= MAX_LIVES) {
    return { success: false, message: "Canlarınız zaten dolu!", updatedProgress: progress };
  }

  if (option === "ad") {
    const nextLives = Math.min(MAX_LIVES, calc.lives + 1);
    const updated: PlayerProgress = {
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
  const updated: PlayerProgress = {
    ...progress,
    coins: currentCoins - cost,
    lives: targetLives,
    lastLifeRegenTimestamp: targetLives >= MAX_LIVES ? Date.now() : calc.lastLifeRegenTimestamp,
  };

  const msg = option === "one" ? "+1 Can satın alındı!" : "Tüm canlarınız (5/5) dolduruldu!";
  return { success: true, message: msg, updatedProgress: updated };
}

export function badgesFor(progress: PlayerProgress): Badge[] {
  const totalMatchesCount = progress.matches + (progress.history ? Math.floor(progress.history.length / 3) : 0);
  const wordsCount = progress.history ? progress.history.length : 0;
  return [
    { id: "first-route", title: "İLK ROTA", description: "İlk turunu bitir.", icon: "✦", accent: "#50E3C2", unlocked: totalMatchesCount >= 1 || progress.wins >= 1 || progress.xp > 0 },
    { id: "victor", title: "ZAFER HATTI", description: "İlk düellonu kazan.", icon: "♕", accent: "#FFC24A", unlocked: progress.wins >= 1 },
    { id: "daily", title: "GÜNEŞ İZİ", description: "Günlük rotayı tamamla.", icon: "☀", accent: "#FF9B62", unlocked: Boolean(progress.dailyCompletedId) || progress.missions.daily >= 1 },
    { id: "wordsmith", title: "UZUN USTA", description: "Yedi harfli kelime bul.", icon: "◌", accent: "#9A76ED", unlocked: progress.missions.wordsmith >= 1 },
    { id: "streak", title: "AKIŞTA", description: "Üç günlük seri yap.", icon: "↗", accent: "#79C8FF", unlocked: progress.streak >= 3 },
    { id: "streak-expert", title: "NEON HAKİMİ", description: "Yedi günlük seri yap.", icon: "🔥", accent: "#FF9B62", unlocked: progress.streak >= 7 },
    { id: "streak-master", title: "ALEV EFENDİSİ", description: "On dört günlük seri yap.", icon: "🌟", accent: "#F43F5E", unlocked: progress.streak >= 14 },
    { id: "collector", title: "ROTA KOLEKSİYONCUSU", description: "Altı maç tamamla.", icon: "◇", accent: "#FF83A4", unlocked: totalMatchesCount >= 6 },
    { id: "veteran-fighter", title: "GLADYATÖR", description: "Yirmi beş maç tamamla.", icon: "⚔️", accent: "#C084FC", unlocked: totalMatchesCount >= 25 },
    { id: "duel-master", title: "DÜELLO KRALI", description: "On galibiyet kazan.", icon: "👑", accent: "#FBBF24", unlocked: progress.wins >= 10 },
    { id: "conqueror", title: "FATİH", description: "Yirmi beş galibiyet kazan.", icon: "🏆", accent: "#34D399", unlocked: progress.wins >= 25 },
    { id: "arcade-hero", title: "ARCADE USTA", description: "Zamana Karşı modda 500 puan yap.", icon: "⚡", accent: "#FFC24A", unlocked: (progress.bestArcadeScore || 0) >= 500 },
    { id: "arcade-god", title: "REKOR AVCISI", description: "Zamana Karşı modda 1000 puan yap.", icon: "🎯", accent: "#38BDF8", unlocked: (progress.bestArcadeScore || 0) >= 1000 },
    { id: "speedy-fingers", title: "HIZLI PARMAK", description: "Toplam 600 XP biriktir.", icon: "🚀", accent: "#FF647C", unlocked: progress.xp >= 600 },
    { id: "xp-overload", title: "BİLGİ KAYNAĞI", description: "Toplam 2000 XP biriktir.", icon: "💎", accent: "#A855F7", unlocked: progress.xp >= 2000 },
    { id: "tempo-beast", title: "FIRTINA TEMPO", description: "Dakikada en az 4 kelime temposuna ulaş.", icon: "🌪️", accent: "#06B6D4", unlocked: (progress.bestTempo || 0) >= 4 },
    { id: "word-hoarder", title: "SÖZLÜK EFENDİSİ", description: "Toplam 50 kelime çöz.", icon: "📖", accent: "#10B981", unlocked: wordsCount >= 50 },
    { id: "rich-operator", title: "KOZMİK ZENGİN", description: "Kasanı 200 çipe ulaştır.", icon: "🪙", accent: "#F59E0B", unlocked: (progress.coins || 0) >= 200 },
  ];
}

function seededNumber(input: string) {
  return [...input].reduce((value, char) => ((value * 31) ^ char.charCodeAt(0)) >>> 0, 7_431);
}

export function getDayId(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const id = getDayId(date);
  const seed = seededNumber(id);
  const themeId = THEME_PACKS[seed % THEME_PACKS.length]!.id;
  return {
    id,
    variation: seed % 1_000_000,
    level: 20 + (seed % 5),
    themeId,
    title: "GÜNÜN ROTASI",
    rewardXp: 120,
  };
}

export type LeagueTierInfo = {
  name: string;
  tier: "DEMİR" | "BRONZ" | "GÜMÜŞ" | "ALTIN" | "PLATİN" | "ELMAS" | "YÜCELİK" | "ÖLÜMSÜZLÜK" | "RADIAN";
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

export function getLeagueTier(progressOrPoints: PlayerProgress | number): LeagueTierInfo {
  let points = 0;
  if (typeof progressOrPoints === "number") {
    points = progressOrPoints;
  } else if (progressOrPoints) {
    points = Math.max(0, progressOrPoints.lp ?? 0);
  }

  const tiers = [
    { tier: "DEMİR", icon: "🛡️", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/iron.jpg", color: "#94A3B8", minPoints: 0, maxPoints: 349 },
    { tier: "BRONZ", icon: "🛡️", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/bronze.jpg", color: "#F97316", minPoints: 350, maxPoints: 899 },
    { tier: "GÜMÜŞ", icon: "🛡️", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/silver.jpg", color: "#38BDF8", minPoints: 900, maxPoints: 1599 },
    { tier: "ALTIN", icon: "🦅", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/gold.jpg", color: "#FBBF24", minPoints: 1600, maxPoints: 2499 },
    { tier: "PLATİN", icon: "🪽", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/platinum.jpg", color: "#67E8F9", minPoints: 2500, maxPoints: 3599 },
    { tier: "ELMAS", icon: "💎", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/diamond.jpg", color: "#60A5FA", minPoints: 3600, maxPoints: 4999 },
    { tier: "YÜCELİK", icon: "🔮", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/ascendant.jpg", color: "#C084FC", minPoints: 5000, maxPoints: 6999 },
    { tier: "ÖLÜMSÜZLÜK", icon: "🔥", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/immortal.jpg", color: "#FB7185", minPoints: 7000, maxPoints: 9999 },
    { tier: "RADIAN", icon: "👑", image: "https://raw.githubusercontent.com/hosgorogun/kelime-patlat/main/assets/ranks/radian.jpg", color: "#FDE047", minPoints: 10000, maxPoints: Number.POSITIVE_INFINITY },
  ] as const;
  const current = [...tiers].reverse().find((tier) => points >= tier.minPoints) ?? tiers[0];
  const next = tiers[tiers.indexOf(current) + 1];
  return {
    name: `${current.tier} LİGİ`,
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

export function getRank(progress: PlayerProgress) {
  return getLeagueTier(progress).tier;
}

export function applyMatchProgress(
  progress: PlayerProgress,
  result: { score: number; tempo: number; won: boolean; isDraw?: boolean; longWord?: boolean; foundWords?: string[]; arcadeScore?: number; size?: number },
  type: "pvp" | "bot" | "solo" = "pvp"
) {
  const previousDuels = progress.missions?.duels ?? 0;
  const previousWordsmith = progress.missions?.wordsmith ?? 0;

  const duelProgress = Math.min(2, previousDuels + (type !== "solo" ? 1 : 0));
  const hasLongWord = result.longWord || (result.foundWords && result.foundWords.some((w) => w.length >= 7));
  const wordsmithProgress = Math.min(1, previousWordsmith + (hasLongWord ? 1 : 0));
  const newHistory = [...(progress.history || []), ...(result.foundWords || [])].slice(-150);

  // --- KADEMELİ VE DİNAMİK LİG PUANI (LP) HESAPLAMASI ---
  const currentLp = Math.max(0, progress.lp ?? 0);
  const tierInfo = getLeagueTier(currentLp);
  const isHighTier = tierInfo.tier === "ELMAS" || tierInfo.tier === "YÜCELİK" || tierInfo.tier === "ÖLÜMSÜZLÜK" || tierInfo.tier === "RADIAN";
  const isEntryTier = tierInfo.tier === "DEMİR" || tierInfo.tier === "BRONZ";

  let baseXP = 0;
  let lpGain = 0;
  if (type === "pvp") {
    if (result.won) {
      baseXP = 25;
      lpGain = isEntryTier ? 30 : isHighTier ? 20 : 25;
      if (result.score >= 120 || (result.tempo && result.tempo >= 3.5)) {
        lpGain += 5; // Ezici galibiyet bonusu
      }
    } else if (result.isDraw) {
      baseXP = 12;
      lpGain = 0;
    } else {
      baseXP = 5;
      lpGain = isEntryTier ? -10 : isHighTier ? -22 : -18;
    }
  } else if (type === "bot") {
    if (result.won) {
      baseXP = 15;
      lpGain = isHighTier ? 0 : isEntryTier ? 12 : 8; // Yüksek liglerde bot maçı LP vermez
    } else if (result.isDraw) {
      baseXP = 8;
      lpGain = 0;
    } else {
      baseXP = 3;
      lpGain = isHighTier ? -15 : -10;
    }
  } else if (type === "solo") {
    baseXP = 10;
    lpGain = 0;
  }

  // 2. Kelime Dağarcığı ve Harf Uzunluğu Bonusu (Harf Başı İlerleme)
  let wordLengthBonus = 0;
  if (result.foundWords && result.foundWords.length > 0) {
    result.foundWords.forEach((w) => {
      if (w.length >= 7) wordLengthBonus += 8; // 7+ Harfli efsanevi kelime
      else if (w.length >= 5) wordLengthBonus += 3; // 5-6 Harfli kelime
      else if (w.length >= 3) wordLengthBonus += 1; // 3-4 Harfli kelime
    });
    wordLengthBonus = Math.min(25, wordLengthBonus); // Maksimum uzunluk bonus tavanı: +25 XP
  } else if (result.longWord) {
    wordLengthBonus = 10;
  }

  // 3. Hız ve Tempo Bonusu (Saniye ve Çözüm Hızına Göre)
  let speedBonus = 0;
  if (result.won && result.tempo) {
    if (result.tempo >= 3.5) speedBonus = 20; // Şimşek Hızı (< 20 saniye)
    else if (result.tempo >= 2.0) speedBonus = 10; // Seri Çözüm (< 40 saniye)
    else if (result.tempo >= 1.0) speedBonus = 5; // Normal Çözüm (< 60 saniye)
  }

  let xpGain = baseXP + wordLengthBonus + speedBonus;

  // Mission completion XP rewards
  if (previousDuels < 2 && duelProgress >= 2) {
    xpGain += 50;
  }
  if (previousWordsmith < 1 && wordsmithProgress >= 1) {
    xpGain += 50;
  }

  // Daily Mystery Word bonus (+150 XP)
  const mystery = getDailyMysteryWord();
  if (result.foundWords && result.foundWords.some((w) => w.toLocaleUpperCase("tr-TR") === mystery.word.toLocaleUpperCase("tr-TR"))) {
    xpGain += mystery.rewardXp;
  }

  // Coin earnings (Dengeli Çip İlerlemesi)
  let coinsEarned = 0;
  if (result.won) {
    coinsEarned = type === "pvp" ? 10 : type === "bot" ? 4 : 3;
  } else {
    coinsEarned = 1;
  }

  let nextMissions: Record<string, number> = {
    ...progress.missions,
    daily: progress.missions?.daily ?? 0,
    duels: duelProgress,
    wordsmith: wordsmithProgress,
  };

  const todayId = getDayId();
  const weekId = getWeekId();
  const activeCatalogMissions = [...getDailyMissions(todayId), ...getWeeklyMissions(weekId)];

  // Update duel_play
  if (type !== "solo") {
    nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "duel_play", 1, result.size);
  }
  // Update duel_win
  if (result.won && type !== "solo") {
    nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "duel_win", 1, result.size);
  }
  // Update solo_progress
  if (type === "solo" && result.won) {
    nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "solo_progress", 1);
  }
  // Update word_count
  const foundWordsCount = result.foundWords?.length || (result.score > 0 ? 1 : 0);
  if (foundWordsCount > 0) {
    nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "word_count", foundWordsCount);
  }
  // Update word_length
  if (result.foundWords && result.foundWords.length > 0) {
    for (const w of result.foundWords) {
      nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "word_length", 1, w.length);
    }
  } else if (result.longWord) {
    nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "word_length", 1, 7);
  }
  // Update combo_count
  if (result.tempo && result.tempo >= 2.0) {
    const comboIncrement = result.tempo >= 3.5 ? 2 : 1;
    nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "combo_count", comboIncrement);
  }
  // Update earn_chips
  if (coinsEarned > 0) {
    nextMissions = updateMissionAction(nextMissions, activeCatalogMissions, "earn_chips", coinsEarned);
  }

  const nextLp = Math.max(0, currentLp + lpGain);

  return {
    ...progress,
    xp: progress.xp + xpGain,
    lp: nextLp,
    coins: (progress.coins ?? 0) + coinsEarned,
    wins: progress.wins + (result.won ? 1 : 0),
    matches: progress.matches + (type !== "solo" ? 1 : 0),
    bestScore: Math.max(progress.bestScore, result.score),
    bestTempo: Math.max(progress.bestTempo, result.tempo),
    bestArcadeScore: Math.max(progress.bestArcadeScore || 0, result.arcadeScore || 0),
    missions: nextMissions,
    history: newHistory,
    lastMatchReward: {
      xp: xpGain,
      lp: lpGain,
      coins: coinsEarned,
    },
  };
}

export function applyArcadeProgress(progress: PlayerProgress, score: number) {
  const newBest = Math.max(progress.bestArcadeScore || 0, score);
  const xpGain = Math.max(5, Math.floor(score / 10));
  const coinsGain = Math.floor(score / 40);

  const activeCatalog = [...getDailyMissions(getDayId()), ...getWeeklyMissions(getWeekId())];
  let nextMissions = updateMissionAction(progress.missions, activeCatalog, "arcade_score", score);
  if (coinsGain > 0) {
    nextMissions = updateMissionAction(nextMissions, activeCatalog, "earn_chips", coinsGain);
  }

  return {
    ...progress,
    xp: progress.xp + xpGain,
    coins: (progress.coins ?? 0) + coinsGain,
    bestArcadeScore: newBest,
    missions: nextMissions,
  };
}

export function applyVintageProgress(
  progress: PlayerProgress,
  level: number,
  score: number = 30
): PlayerProgress {
  const xpGain = score;
  const coinsGain = Math.max(2, Math.floor(score / 10));
  const activeCatalog = [...getDailyMissions(getDayId()), ...getWeeklyMissions(getWeekId())];
  let nextMissions = updateMissionAction(progress.missions || {}, activeCatalog, "vintage_solve", 1);
  if (coinsGain > 0) {
    nextMissions = updateMissionAction(nextMissions, activeCatalog, "earn_chips", coinsGain);
  }

  const currentVintage = progress.vintageProgress;
  const nextMaxUnlocked = Math.min(20, Math.max(currentVintage?.maxUnlockedLevel ?? 1, level + 1));
  const nextCompleted = Array.from(new Set([...(currentVintage?.completedLevels ?? []), level])).sort((a, b) => a - b);
  const nextScore = (currentVintage?.score ?? 0) + (score >= 100 ? score : 100);

  return {
    ...progress,
    xp: progress.xp + xpGain,
    coins: (progress.coins ?? 0) + coinsGain,
    missions: nextMissions,
    vintageProgress: {
      maxUnlockedLevel: nextMaxUnlocked,
      completedLevels: nextCompleted,
      score: nextScore,
    },
  };
}

export function mergePlayerProgress(
  local: PlayerProgress,
  remote?: Partial<PlayerProgress> | null,
  options?: { preferRemoteBalances?: boolean; addGuestBalances?: boolean }
): PlayerProgress {
  if (!remote) return local;
  const safeNum = (val: any, fallback: number, maxCap = 2_000_000_000) => {
    const num = typeof val === "number" && Number.isFinite(val) ? val : fallback;
    return Math.max(0, Math.min(maxCap, num));
  };

  const useRemoteBalances = Boolean(options?.preferRemoteBalances);
  const addGuest = Boolean(options?.addGuestBalances);

  // Filter out explicit undefined keys from remote so they don't overwrite local defined values
  const cleanRemote: Record<string, any> = {};
  for (const [k, v] of Object.entries(remote)) {
    if (v !== undefined) cleanRemote[k] = v;
  }

  // Gender resolution: priority to explicit choices ("male" | "female") over "unspecified"
  const resolveGender = (): GenderType => {
    if (local.gender && local.gender !== "unspecified") return local.gender;
    if (cleanRemote.gender && cleanRemote.gender !== "unspecified") return cleanRemote.gender;
    return local.gender || cleanRemote.gender || "unspecified";
  };

  const nextXp = addGuest
    ? safeNum((local.xp ?? 0) + (cleanRemote.xp ?? 0), local.xp)
    : safeNum(Math.max(local.xp, cleanRemote.xp ?? 0), local.xp);

  const nextLp = useRemoteBalances && cleanRemote.lp !== undefined
    ? safeNum(cleanRemote.lp, local.lp ?? 0)
    : safeNum(Math.max(local.lp ?? 0, cleanRemote.lp ?? 0), local.lp ?? 0);

  const nextCoins = addGuest
    ? safeNum((local.coins ?? 0) + (cleanRemote.coins ?? 0), local.coins ?? 0)
    : useRemoteBalances && cleanRemote.coins !== undefined
      ? safeNum(cleanRemote.coins, local.coins ?? 0)
      : safeNum(Math.max(local.coins ?? 0, cleanRemote.coins ?? 0), local.coins ?? 0);

  const nextShields = addGuest
    ? safeNum((local.streakShields ?? 0) + (cleanRemote.streakShields ?? 0), local.streakShields ?? 0, 99)
    : useRemoteBalances && cleanRemote.streakShields !== undefined
      ? safeNum(cleanRemote.streakShields, local.streakShields ?? 0, 99)
      : safeNum(Math.max(local.streakShields ?? 0, cleanRemote.streakShields ?? 0), local.streakShields ?? 0, 99);

  const nextRadar = addGuest
    ? safeNum((local.radarChargesBonus ?? 0) + (cleanRemote.radarChargesBonus ?? 0), local.radarChargesBonus ?? 0, 99)
    : useRemoteBalances && cleanRemote.radarChargesBonus !== undefined
      ? safeNum(cleanRemote.radarChargesBonus, local.radarChargesBonus ?? 0, 99)
      : safeNum(Math.max(local.radarChargesBonus ?? 0, cleanRemote.radarChargesBonus ?? 0), local.radarChargesBonus ?? 0, 99);

  const mergedSeasonHistory = (() => {
    const map = new Map<string, { seasonId: string; rank: string; lp: number; date: string }>();
    (local.seasonHistory ?? []).forEach((s) => map.set(s.seasonId, s));
    (cleanRemote.seasonHistory ?? []).forEach((s: any) => {
      const existing = map.get(s.seasonId);
      if (!existing || s.lp > existing.lp) {
        map.set(s.seasonId, s);
      }
    });
    return Array.from(map.values());
  })();

  return {
    ...DEFAULT_PROGRESS,
    ...local,
    ...cleanRemote,
    welcomeRewardClaimed: Boolean(local.welcomeRewardClaimed || cleanRemote.welcomeRewardClaimed),
    xp: nextXp,
    lp: nextLp,
    coins: nextCoins,
    streakShields: nextShields,
    radarChargesBonus: nextRadar,
    lives: useRemoteBalances && cleanRemote.lives !== undefined
      ? safeNum(cleanRemote.lives, local.lives ?? MAX_LIVES, MAX_LIVES)
      : safeNum(typeof cleanRemote.lives === "number" && typeof local.lives === "number" ? Math.min(local.lives, cleanRemote.lives) : (cleanRemote.lives ?? local.lives ?? MAX_LIVES), MAX_LIVES, MAX_LIVES),
    lastLifeRegenTimestamp: typeof cleanRemote.lastLifeRegenTimestamp === "number" ? cleanRemote.lastLifeRegenTimestamp : (typeof local.lastLifeRegenTimestamp === "number" ? local.lastLifeRegenTimestamp : Date.now()),
    streak: safeNum(Math.max(local.streak, cleanRemote.streak ?? 0), local.streak, 3650),
    wins: addGuest
      ? safeNum((local.wins ?? 0) + (cleanRemote.wins ?? 0), local.wins)
      : safeNum(Math.max(local.wins, cleanRemote.wins ?? 0), local.wins),
    matches: addGuest
      ? safeNum((local.matches ?? 0) + (cleanRemote.matches ?? 0), local.matches)
      : safeNum(Math.max(local.matches, cleanRemote.matches ?? 0), local.matches),
    bestScore: safeNum(Math.max(local.bestScore, cleanRemote.bestScore ?? 0), local.bestScore),
    bestTempo: safeNum(Math.max(local.bestTempo, cleanRemote.bestTempo ?? 0), local.bestTempo),
    bestArcadeScore: safeNum(Math.max(local.bestArcadeScore ?? 0, cleanRemote.bestArcadeScore ?? 0), local.bestArcadeScore ?? 0),
    dailyCompletedId: local.dailyCompletedId || cleanRemote.dailyCompletedId || null,
    missions: (() => {
      const mergedMissions: Record<string, number> = {
        daily: safeNum(Math.max(local.missions?.daily ?? 0, cleanRemote.missions?.daily ?? 0), local.missions?.daily ?? 0, 100),
        duels: safeNum(Math.max(local.missions?.duels ?? 0, cleanRemote.missions?.duels ?? 0), local.missions?.duels ?? 0, 100),
        wordsmith: safeNum(Math.max(local.missions?.wordsmith ?? 0, cleanRemote.missions?.wordsmith ?? 0), local.missions?.wordsmith ?? 0, 100),
      };
      const allKeys = new Set([...Object.keys(local.missions ?? {}), ...Object.keys(cleanRemote?.missions ?? {})]);
      for (const k of allKeys) {
        mergedMissions[k] = safeNum(Math.max(local.missions?.[k] ?? 0, cleanRemote?.missions?.[k] ?? 0), local.missions?.[k] ?? 0, 10000);
      }
      return mergedMissions;
    })(),
    claimedMilestones: {
      ...(cleanRemote.claimedMilestones ?? {}),
      ...(local.claimedMilestones ?? {}),
    },
    purchasedAvatars: {
      ...(cleanRemote.purchasedAvatars ?? {}),
      ...(local.purchasedAvatars ?? {}),
    },
    weeklyClaimed: {
      ...(cleanRemote.weeklyClaimed ?? {}),
      ...(local.weeklyClaimed ?? {}),
    },
    dailyClaimed: {
      ...(cleanRemote.dailyClaimed ?? {}),
      ...(local.dailyClaimed ?? {}),
    },
    history: Array.from(new Set([...(local.history ?? []), ...(cleanRemote.history ?? [])])).slice(-150),
    selectedAvatar: local.selectedAvatar || cleanRemote.selectedAvatar || "spark",
    selectedTheme: local.selectedTheme || cleanRemote.selectedTheme || "nature",
    selectedTitle: local.selectedTitle || cleanRemote.selectedTitle || "[ÇAYLAK]",
    gender: resolveGender(),
    avatarPhoto: local.avatarPhoto || cleanRemote.avatarPhoto,
    selectedFrame: local.selectedFrame || cleanRemote.selectedFrame || "signal",
    selectedVictoryEffect: local.selectedVictoryEffect || cleanRemote.selectedVictoryEffect || "pulse",
    ownedFrames: { ...(cleanRemote.ownedFrames ?? {}), ...(local.ownedFrames ?? {}) },
    ownedVictoryEffects: { ...(cleanRemote.ownedVictoryEffects ?? {}), ...(local.ownedVictoryEffects ?? {}) },
    selectedBoardSkin: local.selectedBoardSkin || cleanRemote.selectedBoardSkin || "grid",
    ownedBoardSkins: { ...(cleanRemote.ownedBoardSkins ?? {}), ...(local.ownedBoardSkins ?? {}) },
    soloUnlockedLevel: safeNum(Math.max(local.soloUnlockedLevel ?? 1, cleanRemote.soloUnlockedLevel ?? 1), local.soloUnlockedLevel ?? 1, 101),
    vintageProgress: {
      maxUnlockedLevel: safeNum(Math.max(local.vintageProgress?.maxUnlockedLevel ?? 1, cleanRemote.vintageProgress?.maxUnlockedLevel ?? 1), 1, 20),
      completedLevels: Array.from(new Set([
        ...(local.vintageProgress?.completedLevels ?? []),
        ...(cleanRemote.vintageProgress?.completedLevels ?? []),
      ])).sort((a, b) => a - b),
      score: safeNum(Math.max(local.vintageProgress?.score ?? 0, cleanRemote.vintageProgress?.score ?? 0), 0),
    },
    sfxEnabled: cleanRemote?.sfxEnabled ?? local.sfxEnabled ?? true,
    hapticsEnabled: cleanRemote?.hapticsEnabled ?? local.hapticsEnabled ?? true,
    lastLoginDay: local.lastLoginDay || cleanRemote?.lastLoginDay,
    loginDaysCount: safeNum(Math.max(local.loginDaysCount ?? 0, cleanRemote?.loginDaysCount ?? 0), 0),
    lastStreakCheckDate: local.lastStreakCheckDate || cleanRemote?.lastStreakCheckDate,
    missionsDate: local.missionsDate || cleanRemote?.missionsDate,
    weeklyMissionsWeek: local.weeklyMissionsWeek || cleanRemote?.weeklyMissionsWeek,
    seasonHistory: mergedSeasonHistory,
    lastSeasonResetId: local.lastSeasonResetId || cleanRemote?.lastSeasonResetId,
    friends: (() => {
      const map = new Map<string, any>();
      (local.friends ?? []).forEach((f) => map.set(f.username.toLocaleLowerCase("tr-TR"), f));
      (cleanRemote?.friends ?? []).forEach((f: any) => map.set(f.username.toLocaleLowerCase("tr-TR"), f));
      return Array.from(map.values());
    })(),
  };
}

export function completeDailyProgress(progress: PlayerProgress, daily: DailyChallenge) {
  if (progress.dailyCompletedId === daily.id && (progress.missions?.daily ?? 0) >= 1) return progress;
  const activeCatalog = [...getDailyMissions(daily.id), ...getWeeklyMissions(getWeekId())];
  const updatedMissions = updateMissionAction({ ...progress.missions, daily: 1 }, activeCatalog, "daily_route", 1);

  return {
    ...progress,
    xp: progress.xp + daily.rewardXp,
    dailyCompletedId: daily.id,
    lastStreakCheckDate: daily.id,
    streak: progress.streak + 1,
    missions: updatedMissions,
  };
}

export function getPlayerLevel(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function isAvatarUnlocked(avatarId: AvatarId, progress: PlayerProgress): boolean {
  if (progress.purchasedAvatars?.[avatarId]) return true;
  if (progress.selectedAvatar === avatarId) return true;
  const currentLevel = getPlayerLevel(progress.xp);
  if (avatarId === "spark") return true;
  if (avatarId === "orbit") return currentLevel >= 3;
  if (avatarId === "sage") return currentLevel >= 6;
  if (avatarId === "comet") return (progress.bestArcadeScore || 0) >= 400;
  if (avatarId === "ember") return progress.streak >= 5;
  return true;
}

export type CyberTitle = {
  id: string;
  name: string;
  badge: string;
  icon?: string;
  accent?: string;
  unlockHint: string;
  unlocked: (p: PlayerProgress) => boolean;
};

export const CYBER_TITLES: CyberTitle[] = [
  { id: "novice", name: "ÇAYLAK ROTA", badge: "[ÇAYLAK]", icon: "🌱", accent: "#50E3C2", unlockHint: "Oyuna başlarken açık.", unlocked: () => true },
  { id: "scout", name: "SİBER İZCİ", badge: "[İZCİ]", icon: "🧭", accent: "#79C8FF", unlockHint: "3 maç tamamla.", unlocked: (p) => p.matches >= 3 },
  { id: "architect", name: "ROTA MİMARI", badge: "[MİMAR]", icon: "📐", accent: "#A78BFA", unlockHint: "Seviye 3'e ulaş.", unlocked: (p) => getPlayerLevel(p.xp) >= 3 },
  { id: "victor", name: "NEON HAKİMİ", badge: "[NEON HAKİMİ]", icon: "⚡", accent: "#00F5D4", unlockHint: "5 düello kazan.", unlocked: (p) => p.wins >= 5 },
  { id: "hunter", name: "DÜELLO AVCISI", badge: "[AVCI]", icon: "🎯", accent: "#F43F5E", unlockHint: "10 düello kazan.", unlocked: (p) => p.wins >= 10 },
  { id: "gladiator", name: "ARENA KURDU", badge: "[GLADYATÖR]", icon: "⚔️", accent: "#FB923C", unlockHint: "20 maç tamamla.", unlocked: (p) => p.matches >= 20 },
  { id: "lexicon", name: "KELİME BÜKÜCÜ", badge: "[KELİME BÜKÜCÜ]", icon: "📚", accent: "#34D399", unlockHint: "En az 30 kelime çöz veya 7 harfli kelime bul.", unlocked: (p) => (p.history ? p.history.length >= 30 : false) || (p.missions?.wordsmith || 0) >= 1 },
  { id: "storm", name: "FIRTINA OPERATÖRÜ", badge: "[FIRTINA]", icon: "🌪️", accent: "#38BDF8", unlockHint: "En az 4 K/DK tempo hızına ulaş.", unlocked: (p) => (p.bestTempo || 0) >= 4 },
  { id: "firestreak", name: "ALEV HÜKÜMDARI", badge: "[ALEV MUHAFIZI]", icon: "🔥", accent: "#FF7849", unlockHint: "7 günlük galibiyet serisine ulaş.", unlocked: (p) => p.streak >= 7 },
  { id: "tycoon", name: "KAPİTAL LİDERİ", badge: "[KOZMİK ZENGİN]", icon: "🪙", accent: "#F59E0B", unlockHint: "Kasadaki çip miktarını 200'e ulaştır.", unlocked: (p) => (p.coins || 0) >= 200 },
  { id: "ranked-gold", name: "LİG ŞAMPİYONU", badge: "[LİG FATİHİ]", icon: "🏅", accent: "#FFD700", unlockHint: "Lig puanını (LP) 1000'e ulaştır.", unlocked: (p) => (p.lp || 0) >= 1000 },
  { id: "mastermind", name: "BİLGE MATRİS", badge: "[KOD BİLGE]", icon: "🔮", accent: "#C084FC", unlockHint: "Seviye 6'ya ulaş.", unlocked: (p) => getPlayerLevel(p.xp) >= 6 },
  { id: "legend", name: "MATRİS EFSANESİ", badge: "[MATRİS EFSANESİ]", icon: "👑", accent: "#FFC24A", unlockHint: "Seviye 10'a ulaş veya 500 Arcade puanı yap.", unlocked: (p) => getPlayerLevel(p.xp) >= 10 || (p.bestArcadeScore || 0) >= 500 },
  { id: "overlord", name: "SİBER OVERLORD", badge: "[SİBER HAKİM]", icon: "🪐", accent: "#E879F9", unlockHint: "Seviye 15'e ulaş veya 2000 XP biriktir.", unlocked: (p) => getPlayerLevel(p.xp) >= 15 || p.xp >= 2000 },
];

export function getActiveCyberTitle(progress: PlayerProgress): string {
  const available = CYBER_TITLES.filter((t) => t.unlocked(progress));
  if (progress.selectedTitle && available.some((t) => t.badge === progress.selectedTitle)) {
    return progress.selectedTitle;
  }
  return available.at(-1)?.badge || "[ÇAYLAK]";
}

export function getUnclaimedMilestonesCount(progress: PlayerProgress, unlockedLevel = 1): number {
  if (!progress) return 0;
  let count = 0;
  for (const milestone of MILESTONE_REWARDS) {
    const isUnlocked = unlockedLevel > milestone.level;
    const isClaimed = Boolean(progress.claimedMilestones?.[milestone.level]);
    if (isUnlocked && !isClaimed) {
      count++;
    }
  }
  return count;
}

export type DailyMystery = {
  word: string;
  definition: string;
  rewardXp: number;
};

export function getDailyMysteryWord(date = new Date()): DailyMystery {
  // Tam 30 günlük bilmeceli gizemli kelime havuzu (Her ay başı 1. güne sıfırlanır, 31 çeken aylarda 31. gün 1. kelimeye döner)
  const dayOfMonth = date.getDate(); // 1 - 31
  const mysteryWords: { word: string; definition: string }[] = [
    { word: "ANAFOR", definition: "Görünmez bir el gibi seni derine çekerim; suyun içinde kendi etrafımda dönen gizli bir kapıyım." },
    { word: "ŞİMŞEK", definition: "Gökyüzünde saniyelerce çakan devasa bir kılıcım; arkamdan hemen gök gürültüsü yürür." },
    { word: "YANKI", definition: "Sesini bana verirsin, sana aynısını geri yankılatırım; yalnız kayalıklarda yaşayan gölgeyim." },
    { word: "KİMBİLİR", definition: "Bilinmezin ardındaki soruların cevapsız anahtarıyım; ne zaman gelsen sırrı korurum." },
    { word: "GÖLGE", definition: "Işık varken arkandan ayrılmam, karanlık çökünce aniden ortadan kaybolurum." },
    { word: "PUSULA", definition: "Yolunu kaybettiğinde iğnem hep kuzeyi gösterir, ama sana nereye gideceğini söylemem." },
    { word: "ZAMAN", definition: "Görünmem ama herkesi yaşlandırırım, durduramazsın; sürekli akar ama kabı yoktur." },
    { word: "AYNA", definition: "Bana bakarsan seni gösteririm; ama konuşmam, sır tutarım ve dokunursan soğuğumdur." },
    { word: "KOSMOS", definition: "Sonsuz karanlığın içinde milyarlarca elmas taşıyan devasa gizemli çarkım." },
    { word: "RÜZGAR", definition: "Dokunamazsın ama saçını dalgalandırırım; ağaçları eğip geçerim ama izim görünmez." },
    { word: "SARMAŞIK", definition: "Duvarlara sessizce tırmanır, etrafı kuşatırım; ayaksızım ama her yere sarılırım." },
    { word: "SERAP", definition: "Susuz çölde sana serin bir göl vaat ederim, yaklaştıkça kaybolup seni hayal kırıklığına uğratırım." },
    { word: "TILSIM", definition: "Boynunda taşırsın ya da zihninde saklarsın; kötü gözlerden koruduğuna inanılan gizli güç." },
    { word: "KRİSTAL", definition: "Karanlık mağarada doğarım, ışık vurduğunda rengarenk parlayan geometrik bir mucizeyim." },
    { word: "HAKİKAT", definition: "Herkes beni arar ama kimse bütünüyle kabullenemez; yalanın maskesini düşüren keskin kılıç." },
    { word: "LABİRENT", definition: "Binbir yolum vardır ama sadece biri seni özgürlüğe çıkarır; yanlış adımda başa dönersin." },
    { word: "KEHANET", definition: "Henüz yaşanmamış günlerin üzerindeki sis perdesini aralayan gizemli kehanet fısıltısı." },
    { word: "KIVILCIM", definition: "Küçücük bir temasla doğarım; dikkatsiz olursan koskoca bir ormanı küleye çeviririm." },
    { word: "UFUK", definition: "Bana doğru ne kadar koşarsan koş, aramızdaki mesafe hiç kısalmaz." },
    { word: "EFSANE", definition: "Gerçek mi yalan mı kimse bilmez; dilden dile dolaşarak ölümsüzleşen kadim öykü." },
    { word: "SENTEZ", definition: "Ayrı ayrı parçaları simya gibi eritip yepyeni bir hakikate dönüştüren bağ." },
    { word: "ZİRVE", definition: "Oraya tırmanmak yıllar alır, orada kalmak ise rüzgara karşı amansız bir mücadeledir." },
    { word: "BELLEK", definition: "Gözlerini kapattığında çocukluğunu ve geçmişi sana tekrar yaşatan zihin kütüphanesi." },
    { word: "KİLİT", definition: "Anahtarım olmadan kapıları açamazsın; sırları koruyan dilsiz muhafızım." },
    { word: "RESONANS", definition: "Aynı frekansta atan iki yüreğin veya telin birleşip dünyayı sarsan titreşimi." },
    { word: "DÖNÜŞÜM", definition: "Tırtılın kozadan çıkıp kanat çırpması gibi, eski halinden eser bırakmayan değişim." },
    { word: "KEŞİF", definition: "Karanlık haritalarda ayak basılmamış kara parçalarını gün ışığına çıkarma cesareti." },
    { word: "ÖZELLİK", definition: "Seni sen yapan, eşsiz kılan ve kalabalıklar arasında parlamanı sağlayan gizli imza." },
    { word: "SARMAL", definition: "Kendi etrafında döne döne sonsuzluğa veya merkeze doğru çekilen gizemli çizgi." },
    { word: "MÜCADELE", definition: "Düşsen de defalarca ayağa kalkıp hedefe doğru atılan kararlı adım." },
  ];

  // (dayOfMonth - 1) % 30 ile tam 30 günlük döngü sağlanır.
  const index = (dayOfMonth - 1) % mysteryWords.length;
  const picked = mysteryWords[index]!;
  return { ...picked, rewardXp: 150 };
}

export type DailyLoginReward = {
  day: number;
  label: string;
  rewardType: "xp" | "coins" | "shield";
  amount: number;
  icon: string;
};

export const DAILY_LOGIN_REWARDS: DailyLoginReward[] = [
  { day: 1, label: "1. GÜN", rewardType: "coins", amount: 15, icon: "🪙" },
  { day: 2, label: "2. GÜN", rewardType: "xp", amount: 100, icon: "⚡" },
  { day: 3, label: "3. GÜN", rewardType: "coins", amount: 30, icon: "🪙" },
  { day: 4, label: "4. GÜN", rewardType: "xp", amount: 200, icon: "⚡" },
  { day: 5, label: "5. GÜN", rewardType: "coins", amount: 50, icon: "🪙" },
  { day: 6, label: "6. GÜN", rewardType: "xp", amount: 300, icon: "⚡" },
  { day: 7, label: "7. GÜN", rewardType: "shield", amount: 2, icon: "🛡️" },
];

export function checkDailyLoginReward(progress: PlayerProgress, todayId: string): { reward: DailyLoginReward; updatedProgress: PlayerProgress } | null {
  if (progress.lastLoginDay === todayId) return null;
  const currentCount = (progress.loginDaysCount || 0) % 7;
  const reward = DAILY_LOGIN_REWARDS[currentCount]!;
  
  let xpBonus = reward.rewardType === "xp" ? reward.amount : 0;
  let shieldBonus = reward.rewardType === "shield" ? reward.amount : 0;
  let coinsBonus = reward.rewardType === "coins" ? reward.amount : 0;

  const updatedProgress: PlayerProgress = {
    ...progress,
    xp: progress.xp + xpBonus,
    coins: (progress.coins ?? 0) + coinsBonus,
    streakShields: (progress.streakShields || 0) + shieldBonus,
    lastLoginDay: todayId,
    loginDaysCount: (progress.loginDaysCount || 0) + 1,
  };

  return { reward, updatedProgress };
}

export function getWeekId(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export type StreakReconciliationResult = {
  updatedProgress: PlayerProgress;
  shieldUsed: boolean;
  shieldsConsumed: number;
  streakReset: boolean;
  previousStreak: number;
};

export function reconcileDailyStreak(progress: PlayerProgress, todayId: string): StreakReconciliationResult {
  if (progress.lastStreakCheckDate === todayId) {
    return { updatedProgress: progress, shieldUsed: false, shieldsConsumed: 0, streakReset: false, previousStreak: progress.streak };
  }

  if (!progress.dailyCompletedId || progress.streak === 0) {
    return {
      updatedProgress: { ...progress, lastStreakCheckDate: todayId },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: false,
      previousStreak: progress.streak,
    };
  }

  if (progress.dailyCompletedId === todayId) {
    return {
      updatedProgress: { ...progress, lastStreakCheckDate: todayId },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: false,
      previousStreak: progress.streak,
    };
  }

  const lastDate = new Date(progress.dailyCompletedId + "T00:00:00Z");
  const today = new Date(todayId + "T00:00:00Z");
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    return {
      updatedProgress: { ...progress, lastStreakCheckDate: todayId },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: false,
      previousStreak: progress.streak,
    };
  }

  const missedDays = diffDays - 1;
  const availableShields = progress.streakShields || 0;

  if (availableShields >= missedDays) {
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayId = getDayId(yesterday);
    return {
      updatedProgress: {
        ...progress,
        streakShields: availableShields - missedDays,
        dailyCompletedId: yesterdayId,
        lastStreakCheckDate: todayId,
      },
      shieldUsed: true,
      shieldsConsumed: missedDays,
      streakReset: false,
      previousStreak: progress.streak,
    };
  } else {
    return {
      updatedProgress: {
        ...progress,
        streak: 0,
        dailyCompletedId: null,
        lastStreakCheckDate: todayId,
      },
      shieldUsed: false,
      shieldsConsumed: 0,
      streakReset: true,
      previousStreak: progress.streak,
    };
  }
}

export function updateMissionAction(
  missions: Record<string, number>,
  activeMissions: CatalogMission[],
  actionType: string,
  increment: number = 1,
  param?: number
): Record<string, number> {
  const nextMissions = { ...missions };
  for (const m of activeMissions) {
    if (m.actionType === actionType) {
      if (m.param !== undefined) {
        if (actionType === "duel_play" || actionType === "duel_win") {
          // Düello tahta boyutu (4x4, 6x6, 8x8, 10x10) tam eşleşmeli
          if (param !== undefined && param === m.param) {
            nextMissions[m.id] = (nextMissions[m.id] ?? 0) + increment;
          }
        } else if (param !== undefined && param >= m.param) {
          nextMissions[m.id] = (nextMissions[m.id] ?? 0) + increment;
        }
      } else {
        nextMissions[m.id] = (nextMissions[m.id] ?? 0) + increment;
      }
    }
  }
  return nextMissions;
}

export function reconcileMissions(progress: PlayerProgress, todayId: string, weekId: string): PlayerProgress {
  let updated = { ...progress };

  if (updated.missionsDate !== todayId) {
    // Reset daily mission counters and claimed state
    const nextMissions = { ...(updated.missions || {}) };
    // Clear old legacy keys
    nextMissions.daily = 0;
    nextMissions.duels = 0;
    nextMissions.wordsmith = 0;
    // Clear catalog daily keys
    const dailyMissions = getDailyMissions(todayId);
    dailyMissions.forEach((m) => {
      nextMissions[m.id] = 0;
    });

    updated = {
      ...updated,
      missions: nextMissions,
      dailyClaimed: {},
      missionsDate: todayId,
    };
  }

  if (updated.weeklyMissionsWeek !== weekId) {
    const nextMissions = { ...(updated.missions || {}) };
    const weeklyMissions = getWeeklyMissions(weekId);
    weeklyMissions.forEach((m) => {
      nextMissions[m.id] = 0;
    });

    updated = {
      ...updated,
      missions: nextMissions,
      weeklyClaimed: {},
      weeklyMissionsWeek: weekId,
    };
  }

  return updated;
}

export function getUnclaimedMissionsCount(progress: PlayerProgress, todayId?: string, weekId?: string): number {
  if (!progress) return 0;
  let count = 0;

  const currentTodayId = todayId || getDayId();
  const currentWeekId = weekId || getWeekId();

  // Dynamic daily missions from pool
  const activeDaily = getDailyMissions(currentTodayId);
  let catalogDailyClaimedOrDone = false;
  for (const mission of activeDaily) {
    const current = progress.missions?.[mission.id] ?? 0;
    const isDone = current >= mission.target;
    const isClaimed = Boolean(progress.dailyClaimed?.[mission.id]);
    if (isDone && !isClaimed) {
      count++;
      catalogDailyClaimedOrDone = true;
    }
  }

  // Legacy daily missions fallback for tests and old progress format:
  if (!catalogDailyClaimedOrDone) {
    for (const key of ["daily", "duels", "wordsmith"] as const) {
      const target = key === "duels" ? 2 : 1;
      const current = progress.missions?.[key] ?? 0;
      const isDone = current >= target;
      const isClaimed = Boolean(progress.dailyClaimed?.[key]);
      if (isDone && !isClaimed) {
        count++;
      }
    }
  }

  // Dynamic weekly missions from pool
  const activeWeekly = getWeeklyMissions(currentWeekId);
  for (const mission of activeWeekly) {
    const current = progress.missions?.[mission.id] ?? 0;
    const isDone = current >= mission.target;
    const isClaimed = Boolean(progress.weeklyClaimed?.[mission.id]);
    if (isDone && !isClaimed) {
      count++;
    }
  }

  // Legacy weekly fallbacks for tests
  if (progress.wins >= 3 && !progress.weeklyClaimed?.victoryStreak) {
    count++;
  }
  if ((progress.bestArcadeScore || 0) >= 400 && !progress.weeklyClaimed?.speedDemon) {
    count++;
  }

  return count;
}

export function getSeasonId(date = new Date()): string {
  const bimonthlySeason = Math.floor(date.getMonth() / 2) + 1;
  return `${date.getFullYear()}-S${String(bimonthlySeason).padStart(2, "0")}`;
}

export function getSeasonRemainingTime(date = new Date()): { days: number; hours: number; minutes: number; seconds: number; formatted: string } {
  const currentMonth = date.getMonth();
  const nextSeasonMonth = currentMonth % 2 === 0 ? currentMonth + 2 : currentMonth + 1;
  const nextSeasonDate = new Date(date.getFullYear(), nextSeasonMonth, 1, 0, 0, 0, 0);
  
  const diffMs = Math.max(0, nextSeasonDate.getTime() - date.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  const formatted = days > 0 ? `${days}g ${hours}s` : `${hours}s ${minutes}dk`;
  return { days, hours, minutes, seconds, formatted };
}

export type SeasonResetResult = {
  seasonResetPerformed: boolean;
  oldSeasonId?: string;
  newSeasonId: string;
  previousRank?: string;
  previousLp?: number;
  newLp?: number;
};

export function reconcileSeasonReset(progress: PlayerProgress, date = new Date()): { updatedProgress: PlayerProgress; resetResult: SeasonResetResult } {
  const currentSeasonId = getSeasonId(date);
  const lastReset = progress.lastSeasonResetId;

  if (lastReset === currentSeasonId) {
    return {
      updatedProgress: progress,
      resetResult: { seasonResetPerformed: false, newSeasonId: currentSeasonId },
    };
  }

  const currentLp = progress.lp ?? 0;
  const currentTierInfo = getLeagueTier(currentLp);
  const oldRank = currentTierInfo.tier;

  // Kademeli Lig Puanı Soft Reset Mantığı:
  // DEMİR / BRONZ (0 - 899 LP): LP değişmez
  // GÜMÜŞ / ALTIN / PLATİN (900 - 3599 LP): LP %30 düşürülür
  // ELMAS / YÜCELİK / ÖLÜMSÜZLÜK / RADIAN (3600+ LP): LP 2500'e (Platin kademesine) çekilir
  let newLp = currentLp;
  if (currentLp >= 3600) {
    newLp = 2500;
  } else if (currentLp >= 900) {
    newLp = Math.floor(currentLp * 0.7);
  }

  const newHistoryEntry = {
    seasonId: lastReset || "2026-S08",
    rank: oldRank,
    lp: currentLp,
    date: getDayId(date),
  };

  const updatedProgress: PlayerProgress = {
    ...progress,
    lp: newLp,
    lastSeasonResetId: currentSeasonId,
    seasonHistory: [...(progress.seasonHistory || []), newHistoryEntry],
  };

  return {
    updatedProgress,
    resetResult: {
      seasonResetPerformed: true,
      oldSeasonId: lastReset || "Önceki Sezon",
      newSeasonId: currentSeasonId,
      previousRank: oldRank,
      previousLp: currentLp,
      newLp,
    },
  };
}

export type DailyReconciliation = {
  progress: PlayerProgress;
  shieldSaved: boolean;
  shieldsConsumed: number;
  streakReset: boolean;
  previousStreak: number;
  missionsReset: boolean;
  loginReward: DailyLoginReward | null;
  seasonReset: SeasonResetResult;
};

export function reconcilePlayerProgress(progress: PlayerProgress, date = new Date()): DailyReconciliation {
  const todayId = getDayId(date);
  const weekId = getWeekId(date);

  const streakRes = reconcileDailyStreak(progress, todayId);
  let currentProgress = streakRes.updatedProgress;

  const missionsNeedReset = currentProgress.missionsDate !== todayId;
  currentProgress = reconcileMissions(currentProgress, todayId, weekId);

  // Sezonluk Lig Puanı Soft Reset Kontrolü
  const seasonRes = reconcileSeasonReset(currentProgress, date);
  currentProgress = seasonRes.updatedProgress;

  return {
    progress: currentProgress,
    shieldSaved: streakRes.shieldUsed,
    shieldsConsumed: streakRes.shieldsConsumed,
    streakReset: streakRes.streakReset,
    previousStreak: streakRes.previousStreak,
    missionsReset: missionsNeedReset,
    loginReward: null,
    seasonReset: seasonRes.resetResult,
  };
}
