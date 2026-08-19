export type ThemePackId = "nature" | "city" | "mind";
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
};

export type AvatarOption = { id: AvatarId; label: string; icon: string; color: string; surface: string };
export type Badge = { id: string; title: string; description: string; icon: string; accent: string; unlocked: boolean };

export const AVATARS: AvatarOption[] = [
  { id: "spark", label: "KIVILCIM", icon: "✦", color: "#50E3C2", surface: "#153E3A" },
  { id: "orbit", label: "YÖRÜNGE", icon: "◌", color: "#9A76ED", surface: "#332456" },
  { id: "sage", label: "BİLGE", icon: "◇", color: "#FFC24A", surface: "#4E3A1D" },
  { id: "comet", label: "KUYRUKLU", icon: "☄", color: "#79C8FF", surface: "#18375A" },
  { id: "crown", label: "TAÇ", icon: "♕", color: "#FF83A4", surface: "#55233B" },
  { id: "ember", label: "KOR", icon: "✺", color: "#FF9B62", surface: "#513024" },
];

export const THEME_PACKS: ThemePack[] = [
  { id: "nature", label: "DOĞA", title: "YEŞİL PUSULA", description: "Orman, deniz ve gökyüzünden kıvrımlı rotalar.", accent: "#55E6B2", glow: "#113F3B", icon: "✦" },
  { id: "city", label: "ŞEHİR", title: "NEON SOKAKLAR", description: "Kent, yol ve keşif kelimelerinin hızlı paketi.", accent: "#79C8FF", glow: "#1B3159", icon: "⌁" },
  { id: "mind", label: "ZİHİN", title: "BİLMECE ODASI", description: "Bilgi, çözüm ve mantık rotaları için uzman paketi.", accent: "#FFC86A", glow: "#50391B", icon: "◈" },
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
};

export function badgesFor(progress: PlayerProgress): Badge[] {
  return [
    { id: "first-route", title: "İLK ROTA", description: "İlk turunu bitir.", icon: "✦", accent: "#50E3C2", unlocked: progress.matches >= 1 },
    { id: "victor", title: "ZAFER HATTI", description: "İlk düellonu kazan.", icon: "♕", accent: "#FFC24A", unlocked: progress.wins >= 1 },
    { id: "daily", title: "GÜNEŞ İZİ", description: "Günlük rotayı tamamla.", icon: "☀", accent: "#FF9B62", unlocked: progress.missions.daily >= 1 },
    { id: "wordsmith", title: "UZUN USTA", description: "Yedi harfli kelime bul.", icon: "◌", accent: "#9A76ED", unlocked: progress.missions.wordsmith >= 1 },
    { id: "streak", title: "AKIŞTA", description: "Üç günlük seri yap.", icon: "↗", accent: "#79C8FF", unlocked: progress.streak >= 3 },
    { id: "collector", title: "ROTA KOLEKSİYONCUSU", description: "Altı maç tamamla.", icon: "◇", accent: "#FF83A4", unlocked: progress.matches >= 6 },
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
    level: 6 + (seed % 3),
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

export function applyMatchProgress(progress: PlayerProgress, result: { score: number; tempo: number; won: boolean; longWord?: boolean; foundWords?: string[]; arcadeScore?: number }) {
  const duelProgress = Math.min(2, (progress.missions.duels ?? 0) + 1);
  const wordsmithProgress = Math.min(1, (progress.missions.wordsmith ?? 0) + (result.longWord ? 1 : 0));
  const newHistory = [...(progress.history || []), ...(result.foundWords || [])].slice(-150);
  return {
    ...progress,
    xp: progress.xp + 35 + (result.won ? 25 : 0),
    wins: progress.wins + (result.won ? 1 : 0),
    matches: progress.matches + 1,
    bestScore: Math.max(progress.bestScore, result.score),
    bestTempo: Math.max(progress.bestTempo, result.tempo),
    bestArcadeScore: Math.max(progress.bestArcadeScore || 0, result.arcadeScore || 0),
    missions: { ...progress.missions, duels: duelProgress, wordsmith: wordsmithProgress },
    history: newHistory,
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
