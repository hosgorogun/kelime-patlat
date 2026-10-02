import { MAX_LIVES } from "../lives-economy";
import { getPlayerLevel } from "../level-curves";

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
  variation?: number;
  level?: number;
  themeId: ThemePackId;
  title?: string;
  rewardXp: number;
  targetScore?: number;
  size?: number;
  words?: string[];
};

export type MatchHistoryEntry = {
  id: string;
  mode: "ranked" | "friend" | "bot" | "solo" | "arcade" | "vintage" | "daily";
  size?: number;
  opponentName?: string;
  opponentAvatar?: string;
  won: boolean;
  isDraw?: boolean;
  myScore: number;
  opponentScore?: number;
  lpChange?: number;
  xpEarned?: number;
  coinsEarned?: number;
  wordsCount?: number;
  date: number;
};

export type VintageProgress = {
  maxUnlockedLevel: number;
  completedLevels: number[];
  score: number;
};

export type GenderType = "male" | "female" | "unspecified";

export type ChestType = "bronze_chest" | "silver_chest" | "gold_chest" | "cyber_chest" | "legendary_chest" | "mythic_chest";

export type MilestoneReward = {
  level: number;
  title: string;
  coins: number;
  shields: number;
  xp: number;
  desc: string;
  chestType: ChestType;
  icon: string;
  accent: string;
  badge: string;
  badgeId: string;
  badgeTitle: string;
  badgeIcon: string;
};

export const MILESTONE_REWARDS: MilestoneReward[] = [
  { level: 15, title: "BRONZ SANDIK", coins: 20, shields: 1, xp: 150, desc: "Seviye 15 mini kelime ödülü!", chestType: "bronze_chest", icon: "📦", accent: "#CD7F32", badge: "BRONZ SANDIK", badgeId: "badge-lvl-15", badgeTitle: "4×4 BRONZ MİMAR", badgeIcon: "🥉" },
  { level: 30, title: "GÜMÜŞ SANDIK", coins: 35, shields: 1, xp: 200, desc: "Seviye 30 orta hat ustalık ödülü!", chestType: "silver_chest", icon: "🧰", accent: "#E0E0E0", badge: "GÜMÜŞ SANDIK", badgeId: "badge-lvl-30", badgeTitle: "GÜMÜŞ AĞ UZMANI", badgeIcon: "🥈" },
  { level: 45, title: "ALTIN USTALIK SANDIĞI", coins: 50, shields: 2, xp: 300, desc: "Seviye 45 geniş tahta ustalık ödülü!", chestType: "gold_chest", icon: "🎁", accent: "#FFD700", badge: "ALTIN SANDIK", badgeId: "badge-lvl-45", badgeTitle: "6×6 ALTIN USTA", badgeIcon: "🥇" },
  { level: 60, title: "KRİSTAL SANDIK", coins: 75, shields: 2, xp: 400, desc: "Seviye 60 derin tahta ödülü!", chestType: "cyber_chest", icon: "🗃️", accent: "#00E5FF", badge: "KRİSTAL SANDIK", badgeId: "badge-lvl-60", badgeTitle: "DERİN TAHTA KRİSTALİ", badgeIcon: "💎" },
  { level: 75, title: "EFSANEVİ SANDIK", coins: 100, shields: 2, xp: 500, desc: "Seviye 75 devasa ızgara ödülü!", chestType: "legendary_chest", icon: "🔮", accent: "#A855F7", badge: "EFSANEVİ SANDIK", badgeId: "badge-lvl-75", badgeTitle: "EFSANEVİ HÂKİM", badgeIcon: "🔮" },
  { level: 100, title: "KOZMİK ŞAMPİYON SANDIĞI", coins: 150, shields: 3, xp: 1000, desc: "Seviye 100 mutlak şampiyonluk ödülü!", chestType: "mythic_chest", icon: "👑", accent: "#FF1493", badge: "KOZMİK SANDIK", badgeId: "badge-lvl-100", badgeTitle: "KOZMİK İMPARATOR", badgeIcon: "👑" },
];

export type AvatarOption = { id: AvatarId; label: string; icon: string; color: string; surface: string; unlockHint: string };

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
    streakBonus?: number;
    pvpWinStreak?: number;
    isCrushingWin?: boolean;
  };
  pvpWinStreak?: number;
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
  infiniteLivesUntil?: number;
  lastSpinTimestamp?: number;
  boosters?: {
    hint: number;
    freeze: number;
    shuffle: number;
  };
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
  matchHistory?: MatchHistoryEntry[];
};

export const DEFAULT_PROGRESS: PlayerProgress = {
  xp: 0,
  lp: 0,
  dailyCompletedId: null,
  streak: 0,
  pvpWinStreak: 0,
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
  infiniteLivesUntil: 0,
  lastSpinTimestamp: 0,
  boosters: {
    hint: 3,
    freeze: 2,
    shuffle: 2,
  },
  friends: [],
  matchHistory: [],
};

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
  { id: "lexicon", name: "KELİME BÜKÜCÜ", badge: "[KELİME BÜKÜCÜ]", icon: "📚", accent: "#34D399", unlockHint: "En az 30 kelime çöz veya 7 harfli kelime bul.", unlocked: (p) => (p.history ? p.history.length >= 30 || p.history.some((w) => w.length >= 7) : false) || (p.missions?.wordsmith || 0) >= 1 },
  { id: "storm", name: "FIRTINA OPERATÖRÜ", badge: "[FIRTINA]", icon: "🌪️", accent: "#38BDF8", unlockHint: "En az 4 K/DK tempo hızına ulaş.", unlocked: (p) => (p.bestTempo || 0) >= 4 },
  { id: "firestreak", name: "ALEV HÜKÜMDARI", badge: "[ALEV MUHAFIZI]", icon: "🔥", accent: "#FF7849", unlockHint: "7 günlük galibiyet serisine ulaş.", unlocked: (p) => p.streak >= 7 },
  { id: "tycoon", name: "KAPİTAL LİDERİ", badge: "[KOZMİK ZENGİN]", icon: "🪙", accent: "#F59E0B", unlockHint: "Kasadaki çip miktarını 200'e ulaştır.", unlocked: (p) => (p.coins || 0) >= 200 },
  { id: "ranked-gold", name: "LİG ŞAMPİYONU", badge: "[LİG FATİHİ]", icon: "🏅", accent: "#FFD700", unlockHint: "Lig puanını (LP) 1000'e ulaştır.", unlocked: (p) => (p.lp || 0) >= 1000 },
  { id: "mastermind", name: "BİLGE MATRİS", badge: "[KOD BİLGE]", icon: "🔮", accent: "#C084FC", unlockHint: "Seviye 6'ya ulaş.", unlocked: (p) => getPlayerLevel(p.xp) >= 6 },
  { id: "legend", name: "MATRİS EFSANESİ", badge: "[MATRİS EFSANESİ]", icon: "👑", accent: "#FFC24A", unlockHint: "Seviye 10'a ulaş veya 500 Arcade puanı yap.", unlocked: (p) => getPlayerLevel(p.xp) >= 10 || (p.bestArcadeScore || 0) >= 500 },
  { id: "overlord", name: "SİBER OVERLORD", badge: "[SİBER HAKİM]", icon: "🪐", accent: "#E879F9", unlockHint: "Seviye 15'e ulaş veya 2000 XP biriktir.", unlocked: (p) => getPlayerLevel(p.xp) >= 15 || p.xp >= 2000 },
];

export type DailyMystery = {
  word: string;
  definition: string;
  rewardXp: number;
};

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

export type StreakReconciliationResult = {
  updatedProgress: PlayerProgress;
  shieldUsed: boolean;
  shieldsConsumed: number;
  streakReset: boolean;
  previousStreak: number;
};

export type SeasonResetResult = {
  seasonResetPerformed: boolean;
  oldSeasonId?: string;
  newSeasonId: string;
  previousRank?: string;
  previousLp?: number;
  newLp?: number;
};

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
