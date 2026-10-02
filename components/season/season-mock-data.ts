import { type LeaderboardEntry } from "@/shared/game";

export type SeasonTab = "leagues" | "leaderboard" | "friends";
export type RankingType = "lp" | "level";

// Lig Kademesi (LP) Sıralaması için Özel Yarışmacılar
export const MOCK_LP_LEADERBOARD: LeaderboardEntry[] = [
  { id: "lp1", name: "Radyant_Yalçın", score: 9200, wins: 84, matches: 92, bestRound: 580, lp: 10450, tier: "RADIAN", level: 32 },
  { id: "lp2", name: "Ege Neon", score: 4850, wins: 38, matches: 45, bestRound: 420, lp: 7800, tier: "ÖLÜMSÜZLÜK", level: 24 },
  { id: "lp3", name: "Kraliçe_Bora", score: 6100, wins: 52, matches: 64, bestRound: 490, lp: 5900, tier: "YÜCELİK", level: 29 },
  { id: "lp4", name: "Zeynep Matrix", score: 3900, wins: 28, matches: 35, bestRound: 380, lp: 4100, tier: "ELMAS", level: 21 },
  { id: "lp5", name: "Kaan Kiber", score: 3200, wins: 22, matches: 30, bestRound: 310, lp: 2850, tier: "PLATİN", level: 16 },
  { id: "lp6", name: "Selin Vektör", score: 2600, wins: 18, matches: 25, bestRound: 290, lp: 2150, tier: "ALTIN", level: 14 },
  { id: "lp7", name: "Deniz Siber", score: 2100, wins: 14, matches: 20, bestRound: 260, lp: 1350, tier: "GÜMÜŞ", level: 12 },
  { id: "lp8", name: "Barış Piksel", score: 1450, wins: 9, matches: 15, bestRound: 210, lp: 620, tier: "BRONZ", level: 9 },
];

// Seviye Sıralaması için Özel Yarışmacılar (En çok XP / Seviye kasan tecrübeli ustalar)
export const MOCK_LEVEL_LEADERBOARD: LeaderboardEntry[] = [
  { id: "lvl1", name: "Usta_Kelimeci", score: 14200, wins: 120, matches: 140, bestRound: 640, lp: 3400, tier: "PLATİN", level: 71 },
  { id: "lvl2", name: "Gece_Avcısı", score: 11800, wins: 98, matches: 115, bestRound: 550, lp: 5200, tier: "YÜCELİK", level: 59 },
  { id: "lvl3", name: "Prof_Murat", score: 9900, wins: 76, matches: 90, bestRound: 510, lp: 2400, tier: "ALTIN", level: 49 },
  { id: "lvl4", name: "Leyla_Harf", score: 8400, wins: 64, matches: 80, bestRound: 460, lp: 1900, tier: "ALTIN", level: 42 },
  { id: "lvl5", name: "Ege Neon", score: 4850, wins: 38, matches: 45, bestRound: 420, lp: 7800, tier: "ÖLÜMSÜZLÜK", level: 24 },
  { id: "lvl6", name: "Taktik_Mete", score: 4100, wins: 32, matches: 40, bestRound: 390, lp: 1200, tier: "GÜMÜŞ", level: 20 },
  { id: "lvl7", name: "Kaan Kiber", score: 3200, wins: 22, matches: 30, bestRound: 310, lp: 2850, tier: "PLATİN", level: 16 },
  { id: "lvl8", name: "Çaylak_Ozan", score: 1800, wins: 12, matches: 18, bestRound: 240, lp: 400, tier: "DEMİR", level: 9 },
];
