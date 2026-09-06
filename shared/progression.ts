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
  lastLoginDay?: string;
  loginDaysCount?: number;
  weeklyClaimed?: Record<string, boolean>;
  claimedMilestones?: Record<number, boolean>;
};

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

export function getRank(progress: PlayerProgress) {
  if (progress.xp >= 900) return "ALTIN";
  if (progress.xp >= 350) return "GÜMÜŞ";
  return "BRONZ";
}

export function missionProgress(progress: PlayerProgress, mission: SeasonMission) {
  return Math.min(progress.missions[mission.id] ?? 0, mission.target);
}

export function applyMatchProgress(
  progress: PlayerProgress,
  result: { score: number; tempo: number; won: boolean; longWord?: boolean; foundWords?: string[]; arcadeScore?: number },
  type: "pvp" | "bot" | "solo" = "pvp"
) {
  const previousDuels = progress.missions?.duels ?? 0;
  const previousWordsmith = progress.missions?.wordsmith ?? 0;

  const duelProgress = Math.min(2, previousDuels + (type !== "solo" ? 1 : 0));
  const hasLongWord = result.longWord || (result.foundWords && result.foundWords.some((w) => w.length >= 7));
  const wordsmithProgress = Math.min(1, previousWordsmith + (hasLongWord ? 1 : 0));
  const newHistory = [...(progress.history || []), ...(result.foundWords || [])].slice(-150);

  let xpGain = 0;
  if (type === "pvp") {
    xpGain = 40 + (result.won ? 25 : 0);
  } else if (type === "bot") {
    xpGain = 20 + (result.won ? 15 : 0);
  } else if (type === "solo") {
    xpGain = 30;
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
  if (result.foundWords && result.foundWords.some((w) => w.toUpperCase() === mystery.word.toUpperCase())) {
    xpGain += mystery.rewardXp;
  }

  // Coin earnings for victories
  let coinsEarned = 0;
  if (result.won) {
    coinsEarned = type === "pvp" ? 25 : type === "bot" ? 15 : 10;
  }

  return {
    ...progress,
    xp: progress.xp + xpGain,
    coins: (progress.coins ?? 50) + coinsEarned,
    wins: progress.wins + (result.won ? 1 : 0),
    matches: progress.matches + (type !== "solo" ? 1 : 0),
    bestScore: Math.max(progress.bestScore, result.score),
    bestTempo: Math.max(progress.bestTempo, result.tempo),
    bestArcadeScore: Math.max(progress.bestArcadeScore || 0, result.arcadeScore || 0),
    missions: { ...progress.missions, duels: type !== "solo" ? duelProgress : progress.missions.duels, wordsmith: wordsmithProgress },
    history: newHistory,
  };
}

export function applyArcadeProgress(progress: PlayerProgress, score: number) {
  const newBest = Math.max(progress.bestArcadeScore || 0, score);
  const xpGain = Math.max(5, Math.floor(score / 10));
  return {
    ...progress,
    xp: progress.xp + xpGain,
    bestArcadeScore: newBest,
  };
}

export function completeDailyProgress(progress: PlayerProgress, daily: DailyChallenge) {
  if (progress.dailyCompletedId === daily.id) return progress;
  return {
    ...progress,
    xp: progress.xp + daily.rewardXp,
    dailyCompletedId: daily.id,
    streak: progress.streak + 1,
    missions: { ...progress.missions, daily: 1 },
  };
}

export function getPlayerLevel(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

export function isAvatarUnlocked(avatarId: AvatarId, progress: PlayerProgress): boolean {
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
  return available.at(-1)?.badge || "[ÇAYLAK]";
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
