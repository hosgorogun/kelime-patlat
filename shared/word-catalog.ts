import catalog from "../data/word-catalog.json";

export type WordDifficulty = "easy" | "medium" | "hard";
export type WordTheme = "general" | "nature" | "city" | "mind";

export type WordEntry = {
  word: string;
  difficulty: WordDifficulty;
  boards: number[];
  tags: WordTheme[];
  weight: number;
};

type CatalogPayload = { version: number; words: WordEntry[] };

export const WORD_CATALOG_DATA = catalog as CatalogPayload;

export const WORD_CATALOG = {
  4: WORD_CATALOG_DATA.words.filter((entry) => entry.boards.includes(4)),
  6: WORD_CATALOG_DATA.words.filter((entry) => entry.word.length <= 6 && (entry.boards.includes(4) || entry.boards.includes(6) || entry.boards.includes(8))),
  8: WORD_CATALOG_DATA.words.filter((entry) => entry.word.length <= 8 && (entry.boards.includes(4) || entry.boards.includes(6) || entry.boards.includes(8))),
} as const;

export const WORD_BANK = {
  4: WORD_CATALOG[4].map((entry) => entry.word),
  6: WORD_CATALOG[6].map((entry) => entry.word),
  8: WORD_CATALOG[8].map((entry) => entry.word),
} as const;

const THEME_WORDS: Record<Exclude<WordTheme, "general">, readonly string[]> = {
  nature: ["AY", "ADA", "ARI", "BAL", "DAL", "GÖL", "GÜL", "KUM", "TAŞ", "YAZ", "ELMA", "DENİZ", "ÇİÇEK", "BAHÇE", "ORMAN", "SAHİL", "YAPRAK", "YILDIZ", "YAĞMUR", "BULUT", "GÜNEŞ", "TOPRAK", "MEVSİM", "NEHİR", "GÖKKUŞAĞI", "RÜZGAR", "KIYILAR", "KUTUPLAR"],
  city: ["KENT", "ŞEHİR", "EVİM", "ODA", "KAPI", "YOLU", "YOLCU", "SEFER", "HARİTA", "PUSULA", "YOLCULUK", "MACERA", "KIYILAR"],
  mind: ["DİL", "SES", "OYUN", "RİSK", "ÖLÇÜ", "İZİN", "KELİME", "BİLGİ", "BİLMECE", "BULMACA", "ÇÖZÜM", "DENGE", "GİZEM", "GİZEMLİ", "ANLAMLI", "BİLİNMEZ", "BİLGİLER", "HATIRLA"],
};

export function catalogWordsForBoard(size: 4 | 6 | 8, maximumLength: number = size) {
  return WORD_CATALOG[size].filter((entry) => entry.word.length <= maximumLength);
}

export function catalogWordsForTheme(size: 4 | 6 | 8, theme: WordTheme, maximumLength: number = size) {
  const boardWords = catalogWordsForBoard(size, maximumLength);
  if (theme === "general") return boardWords;
  const themedWords = new Set(THEME_WORDS[theme]);
  const selected = boardWords.filter((entry) => themedWords.has(entry.word));
  return selected.length >= 3 ? selected : boardWords;
}
