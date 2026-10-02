import { getPlayerLevel } from "./level-curves";

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  unlocked: boolean;
};

export interface BadgeProgressInput {
  matches: number;
  history?: string[];
  wins: number;
  xp?: number;
  dailyCompletedId?: string | null;
  missions?: Record<string, number>;
  streak?: number;
  bestArcadeScore?: number;
  bestTempo?: number;
  coins?: number;
  claimedMilestones?: Record<number, boolean>;
}

export function badgesFor(progress: BadgeProgressInput): Badge[] {
  const totalMatchesCount = progress.matches + (progress.history ? Math.floor(progress.history.length / 3) : 0);
  const wordsCount = progress.history ? progress.history.length : 0;
  const currentXp = progress.xp ?? 0;
  const currentLevel = getPlayerLevel(currentXp);

  return [
    { id: "first-route", title: "İLK ROTA", description: "İlk turunu bitir.", icon: "✦", accent: "#50E3C2", unlocked: totalMatchesCount >= 1 || progress.wins >= 1 || currentXp > 0 },
    { id: "victor", title: "ZAFER HATTI", description: "İlk düellonu kazan.", icon: "♕", accent: "#FFC24A", unlocked: progress.wins >= 1 },
    { id: "daily", title: "GÜNEŞ İZİ", description: "Günlük rotayı tamamla.", icon: "☀", accent: "#FF9B62", unlocked: Boolean(progress.dailyCompletedId) || (progress.missions?.daily ?? 0) >= 1 || (progress.streak ?? 0) >= 1 },
    { id: "wordsmith", title: "UZUN USTA", description: "Yedi harfli kelime bul.", icon: "◌", accent: "#9A76ED", unlocked: (progress.missions?.wordsmith ?? 0) >= 1 || (progress.history ? progress.history.some((w) => w.length >= 7) : false) },
    { id: "streak", title: "AKIŞTA", description: "Üç günlük seri yap.", icon: "↗", accent: "#79C8FF", unlocked: (progress.streak ?? 0) >= 3 },
    { id: "streak-expert", title: "NEON HAKİMİ", description: "Yedi günlük seri yap.", icon: "🔥", accent: "#FF9B62", unlocked: (progress.streak ?? 0) >= 7 },
    { id: "streak-master", title: "ALEV EFENDİSİ", description: "On dört günlük seri yap.", icon: "🌟", accent: "#F43F5E", unlocked: (progress.streak ?? 0) >= 14 },
    { id: "collector", title: "ROTA KOLEKSİYONCUSU", description: "Altı maç tamamla.", icon: "◇", accent: "#FF83A4", unlocked: totalMatchesCount >= 6 },
    { id: "veteran-fighter", title: "GLADYATÖR", description: "Yirmi beş maç tamamla.", icon: "⚔️", accent: "#C084FC", unlocked: totalMatchesCount >= 25 },
    { id: "duel-master", title: "DÜELLO KRALI", description: "On galibiyet kazan.", icon: "👑", accent: "#FBBF24", unlocked: progress.wins >= 10 },
    { id: "conqueror", title: "FATİH", description: "Yirmi beş galibiyet kazan.", icon: "🏆", accent: "#34D399", unlocked: progress.wins >= 25 },
    { id: "arcade-hero", title: "ARCADE USTA", description: "Zamana Karşı modda 500 puan yap.", icon: "⚡", accent: "#FFC24A", unlocked: (progress.bestArcadeScore || 0) >= 500 },
    { id: "arcade-god", title: "REKOR AVCISI", description: "Zamana Karşı modda 1000 puan yap.", icon: "🎯", accent: "#38BDF8", unlocked: (progress.bestArcadeScore || 0) >= 1000 },
    { id: "speedy-fingers", title: "HIZLI PARMAK", description: "Toplam 600 XP biriktir.", icon: "🚀", accent: "#FF647C", unlocked: currentXp >= 600 },
    { id: "xp-overload", title: "BİLGİ KAYNAĞI", description: "Toplam 2000 XP biriktir.", icon: "💎", accent: "#A855F7", unlocked: currentXp >= 2000 },
    { id: "tempo-beast", title: "FIRTINA TEMPO", description: "Dakikada en az 4 kelime temposuna ulaş.", icon: "🌪️", accent: "#06B6D4", unlocked: (progress.bestTempo || 0) >= 4 },
    { id: "word-hoarder", title: "SÖZLÜK EFENDİSİ", description: "Toplam 50 kelime çöz.", icon: "📖", accent: "#10B981", unlocked: wordsCount >= 50 },
    { id: "rich-operator", title: "KOZMİK ZENGİN", description: "Kasanı 200 çipe ulaştır.", icon: "🪙", accent: "#F59E0B", unlocked: (progress.coins || 0) >= 200 },
    // Level Milestone Achievement Badges (Earned from Level Chests)
    { id: "badge-lvl-15", title: "4×4 BRONZ MİMAR", description: "Seviye 15 Siber Harita Sandığı ödülü.", icon: "🥉", accent: "#CD7F32", unlocked: Boolean(progress.claimedMilestones?.[15]) || currentXp >= 15 * 200 || currentLevel >= 15 || Boolean(progress.missions?.["badge-lvl-15"]) },
    { id: "badge-lvl-30", title: "GÜMÜŞ AĞ UZMANI", description: "Seviye 30 Siber Harita Sandığı ödülü.", icon: "🥈", accent: "#E0E0E0", unlocked: Boolean(progress.claimedMilestones?.[30]) || currentXp >= 30 * 200 || currentLevel >= 30 || Boolean(progress.missions?.["badge-lvl-30"]) },
    { id: "badge-lvl-45", title: "6×6 ALTIN USTA", description: "Seviye 45 Siber Harita Sandığı ödülü.", icon: "🥇", accent: "#FFD700", unlocked: Boolean(progress.claimedMilestones?.[45]) || currentXp >= 45 * 200 || currentLevel >= 45 || Boolean(progress.missions?.["badge-lvl-45"]) },
    { id: "badge-lvl-60", title: "DERİN AĞ KRİSTALİ", description: "Seviye 60 Siber Harita Sandığı ödülü.", icon: "💎", accent: "#00E5FF", unlocked: Boolean(progress.claimedMilestones?.[60]) || currentXp >= 60 * 200 || currentLevel >= 60 || Boolean(progress.missions?.["badge-lvl-60"]) },
    { id: "badge-lvl-75", title: "EFSANEVİ HÂKİM", description: "Seviye 75 Siber Harita Sandığı ödülü.", icon: "🔮", accent: "#A855F7", unlocked: Boolean(progress.claimedMilestones?.[75]) || currentXp >= 75 * 200 || currentLevel >= 75 || Boolean(progress.missions?.["badge-lvl-75"]) },
    { id: "badge-lvl-100", title: "KOZMİK İMPARATOR", description: "Seviye 100 Siber Harita Sandığı ödülü.", icon: "👑", accent: "#FF1493", unlocked: Boolean(progress.claimedMilestones?.[100]) || currentXp >= 100 * 200 || currentLevel >= 100 || Boolean(progress.missions?.["badge-lvl-100"]) },
  ];
}
