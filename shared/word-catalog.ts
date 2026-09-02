import catalog from "../data/word-catalog.json";

export type WordDifficulty = "easy" | "medium" | "hard";
export type WordTheme = "general" | "nature" | "city" | "mind" | "space" | "sports" | "food";

export type WordEntry = {
  word: string;
  difficulty: WordDifficulty;
  boards: number[];
  tags: WordTheme[];
  weight: number;
};

type CatalogPayload = { version: number; words: WordEntry[] };

const WORD_BLACKLIST = new Set([
  "NAM", "LAK", "PRUVA", "MEME",
  "BAV", "RUF", "DUN", "FEL", "SEM", "NOM", "POG", "ALG", "HAV", "CUP", "PIR", "DEH", "BED",
  "ZOM", "PÖÇ", "SÜMEK",
  "PİÇ", "KOV", "ARİ", "ŞUH", "ÇAV", "TÖS", "İDE", "ÖZE", "KAM", "HAF", "AKA", "KÖS", "KIĞ",
  "POF", "AFİ", "İYE", "ŞOR", "OMA", "ZEM", "TÜN", "VIN", "ELK", "LÖS", "ÇİR", "ÖHÖ", "EDİ",
  "ŞEM", "MEH", "FEK", "EKE", "ŞAD", "KİK", "ŞAZ", "CIZ", "UZO", "ABE", "YEĞ", "TAL"
]);

export const WORD_CATALOG_DATA = {
  version: (catalog as CatalogPayload).version,
  words: (catalog as CatalogPayload).words.filter((entry) => entry.word.length >= 3 && !WORD_BLACKLIST.has(entry.word))
};

export const WORD_CATALOG = {
  4: WORD_CATALOG_DATA.words.filter((entry) => entry.boards.includes(4)),
  6: WORD_CATALOG_DATA.words.filter((entry) => entry.boards.includes(6)),
  8: WORD_CATALOG_DATA.words.filter((entry) => entry.boards.includes(8)),
  10: WORD_CATALOG_DATA.words.filter((entry) => entry.boards.includes(10)),
} as const;

export const WORD_BANK = {
  4: WORD_CATALOG[4].map((entry) => entry.word),
  6: WORD_CATALOG[6].map((entry) => entry.word),
  8: WORD_CATALOG[8].map((entry) => entry.word),
  10: WORD_CATALOG[10].map((entry) => entry.word),
} as const;

const THEME_WORDS: Record<Exclude<WordTheme, "general">, readonly string[]> = {
  nature: [
    "ADA", "ARI", "BAL", "DAL", "GÖL", "GÜL", "KUM", "TAŞ", "YAZ", "ELMA", "DENİZ", "ÇİÇEK", "BAHÇE", "ORMAN", "SAHİL", "YAPRAK", "YILDIZ", "YAĞMUR", "BULUT", "GÜNEŞ", "TOPRAK", "MEVSİM", "NEHİR", "GÖKKUŞAĞI", "RÜZGAR", "KIYILAR", "KUTUPLAR",
    "AĞAÇ", "BİTKİ", "ÇİMEN", "KAR", "FIRTINA", "ŞİMŞEK", "VOLKAN", "KANYON", "MAĞARA", "YAYLA", "ŞELALE", "OKYANUS", "DALGA", "BALIK", "KUŞ", "ASLAN", "KAPLAN", "GEYİK", "TAVŞAN", "ÇÖL", "KUMSAL", "SAHRA", "KUTUP", "BUZUL", "GÖKYÜZÜ", "GEZEGEN", "EVREN", "DOĞA", "TABİAT", "YOSUN", "ASMALAR", "KARA"
  ],
  city: [
    "KENT", "ŞEHİR", "EVİM", "ODA", "KAPI", "YOLU", "YOLCU", "SEFER", "HARİTA", "PUSULA", "YOLCULUK", "MACERA", "KIYILAR",
    "SOKAK", "CADDE", "MAHALLE", "BİNA", "KULE", "KÖPRÜ", "PARK", "MÜZE", "SİNEMA", "TİYATRO", "MARKET", "DÜKKAN", "PAZAR", "METRO", "OTOBÜS", "TRAMVAY", "ARABA", "BİSİKLET", "TRAFİK", "YAYA", "LAMBA", "ASANSÖR", "MERDİVEN", "PENCERE", "BALKON", "ÇATI", "OTEL", "RESTORAN", "MEYDAN", "LİMAN", "İSTASYON"
  ],
  mind: [
    "DİL", "SES", "OYUN", "RİSK", "ÖLÇÜ", "İZİN", "KELİME", "BİLGİ", "BİLMECE", "BULMACA", "ÇÖZÜM", "DENGE", "GİZEM", "GİZEMLİ", "ANLAMLI", "BİLİNMEZ", "BİLGİLER", "HATIRLA",
    "DÜŞÜNCE", "FİKİR", "AKIL", "ZEKA", "BEYİN", "HAFIZA", "EĞİTİM", "ÖĞRENME", "OKUL", "KİTAP", "DEFTER", "KALEM", "DERS", "SINAV", "SORU", "CEVAP", "MANTIK", "DENEY", "BİLİM", "FORMÜL", "TEORİ", "SÖZLÜK", "EDEBİYAT", "FELSEFE", "SANAT", "ZEKİ", "MERAK", "DİKKAT"
  ],
  space: [
    "KOZMOZ", "GEZEGEN", "YILDIZ", "ROKET", "UYDU", "GALAKSİ", "METEOR", "KARADELİK", "ASTRONOT", "YÖRÜNGE", "KRATER", "KUYRUKLU", "ÇEKİM", "UZAY", "EVREN", "GÜNEŞ", "DÜNYA", "MARS", "AY", "NEBULA", "KUŞAK", "KUYRUK", "ÇARPIŞMA", "MEKİK", "GÖZCÜ", "SİSTEM", "BOŞLUK"
  ],
  sports: [
    "FUTBOL", "BASKET", "TENİS", "KOŞU", "KALE", "ŞUT", "PAS", "TAKIM", "STADYUM", "RAKET", "ANTRENMAN", "HAKEM", "MADALYA", "OLİMPİYAT", "ŞAMPİYON", "KUPA", "LİG", "MAÇ", "SPOR", "ATLET", "FİLE", "GOL", "POTA", "KASK", "FORMULA", "PARKUR", "GÜREŞ", "YARIŞ"
  ],
  food: [
    "EKMEK", "ÇORBA", "PİLAV", "SEBZE", "MEYVE", "TATLI", "MUTFAK", "LEZZET", "YEMEK", "TUZLU", "BAHARAT", "TARİF", "FIRIN", "OCAK", "AŞÇI", "TUZ", "ŞEKER", "BAL", "YAĞ", "ET", "TAVUK", "BALIK", "ÇAY", "KAHVE", "SU", "SÜT", "MEYVELER", "TATLAR", "KIZARTMA"
  ]
};

export function catalogWordsForBoard(size: 4 | 6 | 8 | 10, maximumLength: number = Math.max(size, 12)) {
  const specific = WORD_CATALOG[size].filter((entry) => entry.word.length <= maximumLength);
  if (specific.length >= 30) return specific;
  return WORD_CATALOG_DATA.words.filter((entry) => entry.word.length <= maximumLength);
}

export function catalogWordsForTheme(size: 4 | 6 | 8 | 10, theme: WordTheme, maximumLength: number = Math.max(size, 12)) {
  const boardWords = catalogWordsForBoard(size, maximumLength);
  if (theme === "general") return boardWords;
  const themedWords = new Set(THEME_WORDS[theme]);
  const selected = boardWords.filter((entry) => themedWords.has(entry.word));
  return selected.length >= 3 ? selected : boardWords;
}
