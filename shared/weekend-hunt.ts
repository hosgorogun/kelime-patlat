import { normalizeTrUpper, isEqualTr } from "./tr-utils";
import type { PlayerProgress } from "./progression/progression.types";
import { getWeekId } from "./progression/date-utils";

export interface WeekendHuntTierReward {
  count: number;
  xp: number;
  coins: number;
  shields?: number;
}

export interface WeekendHuntTheme {
  id: string;
  themeTitle: string;
  subtitle: string;
  icon: string;
  accent: string;
  targetWords: string[];
  hints: Record<string, string>;
  tierRewards: WeekendHuntTierReward[];
}

export interface WeekendHuntEvent extends WeekendHuntTheme {
  eventId: string;
}

export const WEEKEND_THEMES: WeekendHuntTheme[] = [
  {
    id: "w_cosmos",
    themeTitle: "Kozmik Yolculuk",
    subtitle: "Uzay ve gökyüzü terimlerini yakala",
    icon: "🚀",
    accent: "#8B5CF6",
    targetWords: ["YILDIZ", "GALAKSİ", "GEZEGEN", "KUASAR", "YÖRÜNGE"],
    hints: {
      YILDIZ: "Gökyüzünde ışıldayan parlak gök cismi",
      GALAKSİ: "Milyarlarca yıldız ve nebula barındıran devasa ada",
      GEZEGEN: "Güneş'in etrafında dolanan gök cismi",
      KUASAR: "Uzayın derinliklerinde olağanüstü enerji saçan çekirdek",
      YÖRÜNGE: "Bir cismin diğeri etrafında izlediği kapalı yol",
    },
    tierRewards: [
      { count: 1, xp: 100, coins: 30 },
      { count: 3, xp: 200, coins: 60 },
      { count: 5, xp: 350, coins: 120, shields: 1 },
    ],
  },
  {
    id: "w_nature",
    themeTitle: "Kadim Doğa & Orman",
    subtitle: "Doğanın yeşil fısıltılarını çöz",
    icon: "🌿",
    accent: "#10B981",
    targetWords: ["YAPRAK", "SARMAŞIK", "ŞELALE", "ORMAN", "ÇINAR"],
    hints: {
      YAPRAK: "Ağacın yeşil örtüsü, nefes alan parçası",
      SARMAŞIK: "Duvarlara tırmanan sarılıcı zarif bitki",
      ŞELALE: "Kayalıklardan coşkuyla dökülen duru su",
      ORMAN: "Ağaçların oluşturduğu devasa yaşam alanı",
      ÇINAR: "Yüzyıllarca ayakta kalan gölgeli asırlık ağaç",
    },
    tierRewards: [
      { count: 1, xp: 100, coins: 30 },
      { count: 3, xp: 200, coins: 60 },
      { count: 5, xp: 350, coins: 120, shields: 1 },
    ],
  },
  {
    id: "w_ocean",
    themeTitle: "Derin Deniz & Okyanus",
    subtitle: "Maviliklerin altındaki sırları keşfet",
    icon: "🌊",
    accent: "#06B6D4",
    targetWords: ["MERCAN", "DALGIÇ", "GİRDAP", "OKYANUS", "YUNUS"],
    hints: {
      MERCAN: "Denizaltını renklendiren canlı kayalıklar",
      DALGIÇ: "Derin suların sırlarını araştıran kaşif",
      GİRDAP: "Kendi etrafında hızla dönen su burgacı",
      OKYANUS: "Kıtaları birbirinden ayıran uçsuz bucaksız engin deniz",
      YUNUS: "Dalgalarla dans eden oyuncu ve akıllı deniz memelisi",
    },
    tierRewards: [
      { count: 1, xp: 100, coins: 30 },
      { count: 3, xp: 200, coins: 60 },
      { count: 5, xp: 350, coins: 120, shields: 1 },
    ],
  },
  {
    id: "w_literature",
    themeTitle: "Edebiyat & Felsefe",
    subtitle: "Kelamın ve düşüncenin derinliği",
    icon: "📚",
    accent: "#F59E0B",
    targetWords: ["HAKİKAT", "EFSANE", "ŞAİR", "HİKAYE", "MİTOLOJİ"],
    hints: {
      HAKİKAT: "Yalanın örtüsünü yırtan kesin gerçek",
      EFSANE: "Dilden dile dolaşarak ölümsüzleşen kadim öykü",
      ŞAİR: "Duyguları kafiyeli dizelere döken söz ustası",
      HİKAYE: "Yaşanmış ya da kurgulanmış anlatı",
      MİTOLOJİ: "Tanrılar ve kadim kahramanlar efsanesi bilimi",
    },
    tierRewards: [
      { count: 1, xp: 100, coins: 30 },
      { count: 3, xp: 200, coins: 60 },
      { count: 5, xp: 350, coins: 120, shields: 1 },
    ],
  },
  {
    id: "w_cuisine",
    themeTitle: "Lezzetler & Mutfak",
    subtitle: "Geleneksel tatların peşine düş",
    icon: "🍲",
    accent: "#EF4444",
    targetWords: ["BAHARAT", "ZEYTİN", "LEZZET", "SOFRA", "TARÇIN"],
    hints: {
      BAHARAT: "Yemeklere eşsiz aroma katan lezzet tohumları",
      ZEYTİN: "Akdeniz'in kadim ağacının bereketli meyvesi",
      LEZZET: "Damakta iz bırakan enfes tat",
      SOFRA: "Bütün aileyi bir araya toplayan yemek masası",
      TARÇIN: "Tatlılara sıcak koku veren kabuk baharat",
    },
    tierRewards: [
      { count: 1, xp: 100, coins: 30 },
      { count: 3, xp: 200, coins: 60 },
      { count: 5, xp: 350, coins: 120, shields: 1 },
    ],
  },
];

/**
 * Checks whether the weekend event is currently active.
 * Active on Friday (day 5), Saturday (day 6), and Sunday (day 0).
 */
export function isWeekendActive(date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 5 || day === 6;
}

/**
 * Deterministically generates the weekend event for the current calendar week.
 */
export function getWeekendHuntEvent(date = new Date()): WeekendHuntEvent {
  const weekId = getWeekId(date);
  const eventId = `weekend-${weekId}`;
  const charSum = [...eventId].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const themeIndex = charSum % WEEKEND_THEMES.length;
  const theme = WEEKEND_THEMES[themeIndex]!;

  return {
    ...theme,
    eventId,
  };
}

/**
 * Checks if a candidate word matches any of the weekend target words using Turkish normalization.
 */
export function isWeekendTargetWord(candidate: string, targetWords: string[]): boolean {
  const normalizedCandidate = normalizeTrUpper(candidate);
  return targetWords.some((t) => isEqualTr(normalizedCandidate, normalizeTrUpper(t)));
}

/**
 * Evaluates a list of words found during a match/daily/solo level,
 * and records newly discovered target words into PlayerProgress.weekendHunt.
 */
export function recordWeekendHuntWords(
  progress: PlayerProgress,
  words: string[],
  event?: WeekendHuntEvent
): PlayerProgress {
  if (!words || words.length === 0) return progress;
  const currentEvent = event || getWeekendHuntEvent();
  const currentEventId = currentEvent.eventId;

  const currentHunt = progress.weekendHunt && progress.weekendHunt.eventId === currentEventId
    ? progress.weekendHunt
    : { eventId: currentEventId, foundWords: [], claimedTiers: [] };

  const newlyMatched: string[] = [];

  for (const w of words) {
    const norm = normalizeTrUpper(w);
    for (const target of currentEvent.targetWords) {
      if (isEqualTr(norm, normalizeTrUpper(target))) {
        if (!currentHunt.foundWords.some((f) => isEqualTr(f, target)) && !newlyMatched.some((m) => isEqualTr(m, target))) {
          newlyMatched.push(target);
        }
      }
    }
  }

  if (newlyMatched.length === 0 && progress.weekendHunt?.eventId === currentEventId) {
    return progress;
  }

  const updatedFoundWords = [...currentHunt.foundWords, ...newlyMatched];

  return {
    ...progress,
    weekendHunt: {
      ...currentHunt,
      foundWords: updatedFoundWords,
    },
  };
}

/**
 * Claims a milestone reward tier from the weekend event.
 */
export function claimWeekendHuntReward(
  progress: PlayerProgress,
  tierIndex: number,
  event?: WeekendHuntEvent
): { updatedProgress: PlayerProgress; reward: WeekendHuntTierReward } | null {
  const currentEvent = event || getWeekendHuntEvent();
  const currentEventId = currentEvent.eventId;

  const hunt = progress.weekendHunt?.eventId === currentEventId
    ? progress.weekendHunt
    : { eventId: currentEventId, foundWords: [], claimedTiers: [] };

  const tier = currentEvent.tierRewards[tierIndex];
  if (!tier) return null;

  if (hunt.foundWords.length < tier.count) return null; // Not reached yet
  if (hunt.claimedTiers.includes(tierIndex)) return null; // Already claimed

  const updatedClaimed = [...hunt.claimedTiers, tierIndex];
  const updatedProgress: PlayerProgress = {
    ...progress,
    xp: progress.xp + tier.xp,
    coins: (progress.coins ?? 0) + tier.coins,
    streakShields: (progress.streakShields ?? 0) + (tier.shields ?? 0),
    weekendHunt: {
      ...hunt,
      claimedTiers: updatedClaimed,
    },
  };

  return {
    updatedProgress,
    reward: tier,
  };
}
