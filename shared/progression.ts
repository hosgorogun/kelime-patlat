export type ThemePackId = "nature" | "city" | "mind" | "space" | "sports" | "food";
export type AvatarId = "spark" | "orbit" | "sage" | "comet" | "crown" | "ember";

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
  missions: Record<SeasonMission["id"], number>;
  selectedTheme: ThemePackId;
  selectedAvatar: AvatarId;
  history: string[];
  coins?: number;
  streakShields?: number;
  radarChargesBonus?: number;
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
  { level: 15, title: "4×4 MEZUNİYETİ", coins: 50, shields: 1, xp: 150, desc: "Mini siber ağı tamamladın!" },
  { level: 30, title: "SİBER ROTA SANDIĞI", coins: 75, shields: 1, xp: 200, desc: "Orta hat operasyon başarısı!" },
  { level: 45, title: "6×6 USTALIK SANDIĞI", coins: 100, shields: 2, xp: 300, desc: "6×6 geniş ağı fethettin!" },
  { level: 60, title: "DERİN SİBER KASASI", coins: 125, shields: 2, xp: 400, desc: "Büyük 8×8 operasyon ödülü!" },
  { level: 75, title: "8×8 EFSANE SANDIĞI", coins: 150, shields: 2, xp: 500, desc: "Devasa ızgarayı aştın!" },
  { level: 100, title: "KOZMİK ŞAMPİYON TACI", coins: 300, shields: 3, xp: 1000, desc: "100 seviyenin mutlak galibi!" },
];

export type AvatarOption = { id: AvatarId; label: string; icon: string; color: string; surface: string; unlockHint: string };
export type Badge = { id: string; title: string; description: string; icon: string; accent: string; unlocked: boolean };

export const AVATARS: AvatarOption[] = [
  { id: "spark", label: "KIVILCIM", icon: "✦", color: "#50E3C2", surface: "#153E3A", unlockHint: "Her zaman açık siber mod." },
  { id: "orbit", label: "YÖRÜNGE", icon: "◌", color: "#9A76ED", surface: "#332456", unlockHint: "Seviye 3 olduğunda açılır." },
  { id: "sage", label: "BİLGE", icon: "◇", color: "#FFC24A", surface: "#4E3A1D", unlockHint: "Seviye 6 olduğunda açılır." },
  { id: "comet", label: "KUYRUKLU", icon: "☄", color: "#79C8FF", surface: "#18375A", unlockHint: "Arcade modda 400 puanı aş." },
  { id: "crown", label: "TAÇ", icon: "♕", color: "#FF83A4", surface: "#55233B", unlockHint: "Canlı düellolarda 5 galibiyet al." },
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
  streakShields: 1,
  coins: 50,
  radarChargesBonus: 0,
  claimedMilestones: {},
  dailyClaimed: {},
  gender: "unspecified",
  avatarPhoto: undefined,
};

export function badgesFor(progress: PlayerProgress): Badge[] {
  const totalMatchesCount = progress.matches + (progress.history ? Math.floor(progress.history.length / 3) : 0);
  return [
    { id: "first-route", title: "İLK ROTA", description: "İlk turunu bitir.", icon: "✦", accent: "#50E3C2", unlocked: totalMatchesCount >= 1 || progress.wins >= 1 || progress.xp > 0 },
    { id: "victor", title: "ZAFER HATTI", description: "İlk düellonu kazan.", icon: "♕", accent: "#FFC24A", unlocked: progress.wins >= 1 },
    { id: "daily", title: "GÜNEŞ İZİ", description: "Günlük rotayı tamamla.", icon: "☀", accent: "#FF9B62", unlocked: Boolean(progress.dailyCompletedId) || progress.missions.daily >= 1 },
    { id: "wordsmith", title: "UZUN USTA", description: "Yedi harfli kelime bul.", icon: "◌", accent: "#9A76ED", unlocked: progress.missions.wordsmith >= 1 },
    { id: "streak", title: "AKIŞTA", description: "Üç günlük seri yap.", icon: "↗", accent: "#79C8FF", unlocked: progress.streak >= 3 },
    { id: "streak-expert", title: "NEON HAKİMİ", description: "Yedi günlük seri yap.", icon: "🔥", accent: "#FF9B62", unlocked: progress.streak >= 7 },
    { id: "collector", title: "ROTA KOLEKSİYONCUSU", description: "Altı maç tamamla.", icon: "◇", accent: "#FF83A4", unlocked: totalMatchesCount >= 6 },
    { id: "arcade-hero", title: "ARCADE USTA", description: "Zamana Karşı modda 500 puan yap.", icon: "⚡", accent: "#FFC24A", unlocked: (progress.bestArcadeScore || 0) >= 500 },
    { id: "speedy-fingers", title: "HIZLI PARMAK", description: "Toplam 600 XP biriktir.", icon: "🚀", accent: "#FF647C", unlocked: progress.xp >= 600 },
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
  tier: "BRONZ" | "GÜMÜŞ" | "ALTIN";
  icon: string;
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
    points = (progressOrPoints.lp !== undefined && progressOrPoints.lp > 0)
      ? progressOrPoints.lp
      : (progressOrPoints.xp ?? 0);
  }

  if (points >= 900) {
    return {
      name: "ALTIN LİGİ",
      tier: "ALTIN",
      icon: "👑",
      color: "#FBBF24",
      badge: "ALTIN",
      minPoints: 900,
      maxPoints: 9999,
      currentTierPoints: points - 900,
      targetTierPoints: 1000,
      totalPoints: points,
    };
  }
  if (points >= 350) {
    return {
      name: "GÜMÜŞ LİGİ",
      tier: "GÜMÜŞ",
      icon: "🛡️",
      color: "#38BDF8",
      badge: "GÜMÜŞ",
      minPoints: 350,
      maxPoints: 899,
      currentTierPoints: points - 350,
      targetTierPoints: 550, // 900 - 350
      totalPoints: points,
    };
  }
  return {
    name: "BRONZ LİGİ",
    tier: "BRONZ",
    icon: "⚔️",
    color: "#F97316",
    badge: "BRONZ",
    minPoints: 0,
    maxPoints: 349,
    currentTierPoints: points,
    targetTierPoints: 350,
    totalPoints: points,
  };
}

export function getRank(progress: PlayerProgress) {
  return getLeagueTier(progress).tier;
}

export function applyMatchProgress(
  progress: PlayerProgress,
  result: { score: number; tempo: number; won: boolean; isDraw?: boolean; longWord?: boolean; foundWords?: string[]; arcadeScore?: number },
  type: "pvp" | "bot" | "solo" = "pvp"
) {
  const previousDuels = progress.missions?.duels ?? 0;
  const previousWordsmith = progress.missions?.wordsmith ?? 0;

  const duelProgress = Math.min(2, previousDuels + (type !== "solo" ? 1 : 0));
  const hasLongWord = result.longWord || (result.foundWords && result.foundWords.some((w) => w.length >= 7));
  const wordsmithProgress = Math.min(1, previousWordsmith + (hasLongWord ? 1 : 0));
  const newHistory = [...(progress.history || []), ...(result.foundWords || [])].slice(-150);

  let xpGain = 0;
  let lpGain = 0;
  if (type === "pvp") {
    if (result.won) {
      xpGain = 65;
      lpGain = 25;
    } else if (result.isDraw) {
      xpGain = 40;
      lpGain = 5;
    } else {
      xpGain = 40;
      lpGain = -15;
    }
  } else if (type === "bot") {
    if (result.won) {
      xpGain = 35;
      lpGain = 15;
    } else if (result.isDraw) {
      xpGain = 20;
      lpGain = 2;
    } else {
      xpGain = 20;
      lpGain = -8;
    }
  } else if (type === "solo") {
    xpGain = 30;
    lpGain = 0;
  }

  // Mission completion XP rewards
  if (previousDuels < 2 && duelProgress >= 2) {
    xpGain += 80;
  }
  if (previousWordsmith < 1 && wordsmithProgress >= 1) {
    xpGain += 70;
  }

  // Daily Mystery Word bonus (+150 XP)
  const mystery = getDailyMysteryWord();
  if (result.foundWords && result.foundWords.some((w) => w.toLocaleUpperCase("tr-TR") === mystery.word.toLocaleUpperCase("tr-TR"))) {
    xpGain += mystery.rewardXp;
  }

  // Coin earnings
  let coinsEarned = 0;
  if (result.won) {
    coinsEarned = type === "pvp" ? 25 : type === "bot" ? 15 : 10;
  } else {
    coinsEarned = 5;
  }

  const currentLp = (progress.lp !== undefined && progress.lp > 0) ? progress.lp : (progress.xp ?? 0);
  const nextLp = Math.max(0, currentLp + lpGain);

  return {
    ...progress,
    xp: progress.xp + xpGain,
    lp: nextLp,
    coins: (progress.coins ?? 50) + coinsEarned,
    wins: progress.wins + (result.won ? 1 : 0),
    matches: progress.matches + (type !== "solo" ? 1 : 0),
    bestScore: Math.max(progress.bestScore, result.score),
    bestTempo: Math.max(progress.bestTempo, result.tempo),
    bestArcadeScore: Math.max(progress.bestArcadeScore || 0, result.arcadeScore || 0),
    missions: { ...progress.missions, duels: type !== "solo" ? duelProgress : progress.missions.duels, wordsmith: wordsmithProgress },
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
  return {
    ...progress,
    xp: progress.xp + xpGain,
    coins: (progress.coins ?? 50) + coinsGain,
    bestArcadeScore: newBest,
  };
}

export function mergePlayerProgress(
  local: PlayerProgress,
  remote?: Partial<PlayerProgress> | null
): PlayerProgress {
  if (!remote) return local;
  return {
    ...DEFAULT_PROGRESS,
    ...local,
    ...remote,
    xp: Math.max(local.xp, remote.xp ?? 0),
    lp: Math.max(local.lp ?? 0, remote.lp ?? 0),
    coins: Math.max(local.coins ?? 50, remote.coins ?? 50),
    streakShields: Math.max(local.streakShields ?? 0, remote.streakShields ?? 0),
    radarChargesBonus: Math.max(local.radarChargesBonus ?? 0, remote.radarChargesBonus ?? 0),
    streak: Math.max(local.streak, remote.streak ?? 0),
    wins: Math.max(local.wins, remote.wins ?? 0),
    matches: Math.max(local.matches, remote.matches ?? 0),
    bestScore: Math.max(local.bestScore, remote.bestScore ?? 0),
    bestTempo: Math.max(local.bestTempo, remote.bestTempo ?? 0),
    bestArcadeScore: Math.max(local.bestArcadeScore ?? 0, remote.bestArcadeScore ?? 0),
    dailyCompletedId: local.dailyCompletedId || remote.dailyCompletedId || null,
    missions: {
      daily: Math.max(local.missions?.daily ?? 0, remote.missions?.daily ?? 0),
      duels: Math.max(local.missions?.duels ?? 0, remote.missions?.duels ?? 0),
      wordsmith: Math.max(local.missions?.wordsmith ?? 0, remote.missions?.wordsmith ?? 0),
    },
    claimedMilestones: {
      ...(remote.claimedMilestones ?? {}),
      ...(local.claimedMilestones ?? {}),
    },
    purchasedAvatars: {
      ...(remote.purchasedAvatars ?? {}),
      ...(local.purchasedAvatars ?? {}),
    },
    weeklyClaimed: {
      ...(remote.weeklyClaimed ?? {}),
      ...(local.weeklyClaimed ?? {}),
    },
    dailyClaimed: {
      ...(remote.dailyClaimed ?? {}),
      ...(local.dailyClaimed ?? {}),
    },
    history: Array.from(new Set([...(local.history ?? []), ...(remote.history ?? [])])).slice(-150),
    selectedAvatar: local.selectedAvatar || remote.selectedAvatar || "spark",
    selectedTheme: local.selectedTheme || remote.selectedTheme || "nature",
    selectedTitle: local.selectedTitle || remote.selectedTitle,
    gender: remote.gender || local.gender || "unspecified",
    avatarPhoto: remote.avatarPhoto || local.avatarPhoto,
  };
}

export function completeDailyProgress(progress: PlayerProgress, daily: DailyChallenge) {
  if (progress.dailyCompletedId === daily.id && (progress.missions?.daily ?? 0) >= 1) return progress;
  return {
    ...progress,
    xp: progress.xp + daily.rewardXp,
    dailyCompletedId: daily.id,
    lastStreakCheckDate: daily.id,
    streak: progress.streak + 1,
    missions: { ...progress.missions, daily: 1 },
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
  if (avatarId === "crown") return progress.wins >= 5;
  if (avatarId === "ember") return progress.streak >= 5;
  return true;
}

export type CyberTitle = {
  id: string;
  name: string;
  badge: string;
  unlockHint: string;
  unlocked: (p: PlayerProgress) => boolean;
};

export const CYBER_TITLES: CyberTitle[] = [
  { id: "novice", name: "ÇAYLAK ROTA", badge: "[ÇAYLAK]", unlockHint: "Oyuna başlarken açık.", unlocked: () => true },
  { id: "scout", name: "SİBER İZCİ", badge: "[İZCİ]", unlockHint: "3 maç tamamla.", unlocked: (p) => p.matches >= 3 },
  { id: "architect", name: "ROTA MİMARI", badge: "[MİMAR]", unlockHint: "Seviye 3'e ulaş.", unlocked: (p) => getPlayerLevel(p.xp) >= 3 },
  { id: "victor", name: "NEON HAKİMİ", badge: "[NEON HAKİMİ]", unlockHint: "5 düello kazan.", unlocked: (p) => p.wins >= 5 },
  { id: "legend", name: "MATRİS EFSANESİ", badge: "[MATRİS EFSANESİ]", unlockHint: "Seviye 10'a ulaş veya 500 Arcade puanı yap.", unlocked: (p) => getPlayerLevel(p.xp) >= 10 || (p.bestArcadeScore || 0) >= 500 },
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
  const dayId = getDayId(date);
  const seed = seededNumber(dayId + "mystery");
  const mysteryWords = [
    { word: "DENİZ", definition: "Yeryüzünün büyük kısmını kaplayan geniş tuzlu su kütlesi." },
    { word: "YILDIZ", definition: "Gökyüzünde ışık saçan devasa plazma küresi." },
    { word: "ORMAN", definition: "Ağaçlarla kaplı geniş doğal alan ve ekosistem." },
    { word: "GİZEM", definition: "Sır, akıl erdirilemeyen bilinmez durum." },
    { word: "PUSULA", definition: "Yön bulmaya yarayan, üzerinde mıknatıslı ibre olan cihaz." },
    { word: "MACERA", definition: "Heyecan verici, sıra dışı ve riskli olaylar zinciri." },
    { word: "FORMÜL", definition: "Bir gerçeği veya kuralı sembollerle gösteren kısa anlatım." },
  ];
  const picked = mysteryWords[seed % mysteryWords.length]!;
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
  { day: 1, label: "1. GÜN", rewardType: "coins", amount: 25, icon: "🪙" },
  { day: 2, label: "2. GÜN", rewardType: "xp", amount: 60, icon: "⚡" },
  { day: 3, label: "3. GÜN", rewardType: "coins", amount: 50, icon: "🪙" },
  { day: 4, label: "4. GÜN", rewardType: "xp", amount: 100, icon: "⚡" },
  { day: 5, label: "5. GÜN", rewardType: "coins", amount: 75, icon: "🪙" },
  { day: 6, label: "6. GÜN", rewardType: "xp", amount: 150, icon: "⚡" },
  { day: 7, label: "7. GÜN", rewardType: "shield", amount: 1, icon: "🛡️" },
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
    coins: (progress.coins ?? 50) + coinsBonus,
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

export function reconcileMissions(progress: PlayerProgress, todayId: string, weekId: string): PlayerProgress {
  let updated = { ...progress };

  if (updated.missionsDate !== todayId) {
    updated = {
      ...updated,
      missions: { daily: 0, duels: 0, wordsmith: 0 },
      dailyClaimed: {},
      missionsDate: todayId,
    };
  }

  if (updated.weeklyMissionsWeek !== weekId) {
    updated = {
      ...updated,
      weeklyClaimed: {},
      weeklyMissionsWeek: weekId,
    };
  }

  return updated;
}

export function getUnclaimedMissionsCount(progress: PlayerProgress): number {
  if (!progress) return 0;
  let count = 0;

  // Daily missions
  for (const mission of SEASON_MISSIONS) {
    const current = progress.missions?.[mission.id] ?? 0;
    const isDone = current >= mission.target;
    const isClaimed = Boolean(progress.dailyClaimed?.[mission.id]);
    if (isDone && !isClaimed) {
      count++;
    }
  }

  // Weekly missions
  if (progress.wins >= 3 && !progress.weeklyClaimed?.victoryStreak) {
    count++;
  }
  if ((progress.bestArcadeScore || 0) >= 400 && !progress.weeklyClaimed?.speedDemon) {
    count++;
  }

  return count;
}

export type DailyReconciliation = {
  progress: PlayerProgress;
  shieldSaved: boolean;
  shieldsConsumed: number;
  streakReset: boolean;
  previousStreak: number;
  missionsReset: boolean;
  loginReward: DailyLoginReward | null;
};

export function reconcilePlayerProgress(progress: PlayerProgress, date = new Date()): DailyReconciliation {
  const todayId = getDayId(date);
  const weekId = getWeekId(date);

  const streakRes = reconcileDailyStreak(progress, todayId);
  let currentProgress = streakRes.updatedProgress;

  const missionsNeedReset = currentProgress.missionsDate !== todayId;
  currentProgress = reconcileMissions(currentProgress, todayId, weekId);

  // Login reward is claimed manually via the CommandCenter UI container

  return {
    progress: currentProgress,
    shieldSaved: streakRes.shieldUsed,
    shieldsConsumed: streakRes.shieldsConsumed,
    streakReset: streakRes.streakReset,
    previousStreak: streakRes.previousStreak,
    missionsReset: missionsNeedReset,
    loginReward: null,
  };
}
