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
  "NAM", "LAK", "PRUVA", "MEME", "PISMA", "TONLUK", "EKSERİ", "EKSERİYA", "ÖZENİ", "ÖRMELİ", "GİTMEK", "DİTMEK",
  "BAV", "RUF", "DUN", "FEL", "SEM", "NOM", "POG", "ALG", "HAV", "CUP", "PIR", "DEH", "BED",
  "ZOM", "PÖÇ", "SÜMEK", "KUSMA", "SIVAMA", "KAPMACA", "TUTMACA",
  "PİÇ", "KOV", "ARİ", "ŞUH", "ÇAV", "TÖS", "İDE", "ÖZE", "KAM", "HAF", "AKA", "KÖS", "KIĞ",
  "POF", "AFİ", "İYE", "ŞOR", "OMA", "ZEM", "TÜN", "VIN", "ELK", "LÖS", "ÇİR", "ÖHÖ", "EDİ",
  "ŞEM", "MEH", "FEK", "EKE", "ŞAD", "KİK", "ŞAZ", "CIZ", "UZO", "ABE", "YEĞ", "TAL",
  "BİDE", "BİTİ", "BÖKE", "BUZUK", "CABA", "CACIK", "CAKA", "CILK", "ÇELİK", "ÇEPNİ", "ÇEŞT",
  "ÇIKIN", "ÇİMÇİK", "DALIZ", "DAMLI", "DEBİ", "DEFNE", "DEĞE", "DEĞİM", "DENK", "DEPSİ",
  "DESEN", "DEŞİK", "DESTE", "DEVİ", "DEVRİ", "DEYİŞ", "DİBEK", "DİDAR", "DİDİM", "DİLEK",
  "DİLİM", "DİMAĞ", "DİNAMO", "DİNGİL", "DİNGO", "DİPER", "DİPÇİK", "DİREN", "DİRİĞ", "DİRLİK",
  "DİSKO", "DİŞLİ", "DİTMEK", "DİVAL", "DİVAN", "DİVİT", "DİZEK", "DİZEL", "DİZGİ", "DİZME",
  "DOĞAÇ", "DOĞAL", "DOĞAN", "DOĞRU", "DOĞUŞ", "DOKU", "DOKUM", "DOLAM", "DOLAP", "DOLAR",
  "DOLAY", "DOLGU", "DOLUM", "DOMBAY", "DOMDOM", "DONER", "DONAM", "DONUK", "DORUM", "DOSTU",
  "DOYUM", "DÖLÜK", "DÖNEK", "DÖNEL", "DÖNEM", "DÖNEŞ", "DÖNGÜ", "DÖNMESİ", "DÖNÜŞ", "DÖŞEK",
  "DÖŞEM", "DÖŞER", "DUBLE", "DUDAK", "DUHUL", "DUKA", "DUMAN", "DURAK", "DURAL", "DURGU",
  "DURMA", "DURUK", "DURUM", "DURUŞ", "DUŞAK", "DUYAR", "DUYGU", "DUYMA", "DUYUM", "DUYUŞ",
  "DÜĞME", "DÜĞÜM", "DÜĞÜN", "DÜMEN", "DÜNKÜ", "DÜNYA", "DÜRZİ", "DÜŞÜK", "DÜŞÜŞ", "DÜZEL",
  "DÜZEN", "DÜZEY", "DÜZGÜ", "DÜZME", "EBEDİ", "EBELİK", "EBRULİ", "ECELİ", "ECNEBİ", "EDA",
  "EVİMİ", "EVİNİ", "ADINI", "GÜNÜ", "SESİNİ", "YOLUNU", "KIZINI", "OĞLUNU", "CANINI", "İŞİNİ", "SÖZÜNÜ", "ELİNİ", "GÖZÜNÜ", "AKLINI", "BAŞINI", "SUYUNU"
]);

// Senior QA Stem Filter: Removes possessive, case, participial and artificial derived suffixes
const ARTIFICIAL_SUFFIX_REGEX = /(Sİ|SÜ|SU|SI|LİK|LUK|LÜK|MA|ME|MELİ|MALI|MEK|MAK|Cİ|CU|CÜ|CI|Çİ|ÇU|ÇÜ|ÇI|SEL|SAL|MACA|MECE|EN|AN|LENME|LANMA|ULMA|İLME)$/;

// Living Turkish natural infinitives (approved core verbs)
const NATURAL_INFINITIVES = [
  "SEVMEK", "GÖRMEK", "KOŞMAK", "BİLMEK", "YAŞAMAK", "ÇÖZMEK", "ANLAMAK", "YÜRÜMEK", "YAZMAK", "OKUMAK",
  "DUYMAK", "BULMAK", "GÜLMEK", "BAKMAK", "GEZMEK", "UÇMAK", "YÜZMEK", "DÜŞÜNMEK", "BAŞLAMAK", "ÖĞRENMEK",
  "ANLATMAK", "ÇALIŞMAK", "KAZANMAK", "KORUMAK", "PAYLAŞMAK", "DİNLEMEK", "DURMAK", "KALKMAK", "OTURMAK", "KONUŞMAK",
  "BEKLEMEK", "BİTİRMEK", "DÖNMEK", "SEÇMEK", "İSTEMEK", "DENEMEK", "YAPMAK", "GİTMEK", "GELMEK", "ALMAK",
  "VERMEK", "AÇMAK", "KAPAMAK", "BULUŞMAK", "YAKALAMAK", "SAVUNMAK", "KUTLAMAK", "YENMEK", "YARIŞMAK"
];

// Whitelist of valid stem words that coincidentally end with suffix patterns
const STEM_WHITELIST = new Set([
  "MEYVE", "GÜNEŞ", "ELMA", "YÜZME", "ÇİZME", "KALE", "DÜME", "KÜME", "KİME", "DİME",
  "ÇEŞME", "BÖLME", "DÖNME", "GÖRME", "GELME", "ORMAN", "ADAM", "KADIN", "İNSAN", "VADİ",
  "SAHİL", "KENT", "ŞEHİR", "DUVAR", "TAVAN", "MASA", "KAPILMA", "SARMA", "DOLMA", "KIZARTMA",
  "FOTOSENTEZ", "EKOSİSTEM", "BİYOÇEŞİTLİLİK",
  ...NATURAL_INFINITIVES
]);


const THEME_WORDS: Record<Exclude<WordTheme, "general">, readonly string[]> = {
  nature: [
    "ADA", "ARI", "BAL", "DAL", "GÖL", "GÜL", "KUM", "TAŞ", "YAZ", "AĞAÇ", "BİTKİ", "ÇİMEN", "KARA", "VADİ", "DERE", "KAYA", "KURT", "GEYİK",
    "DENİZ", "ÇİÇEK", "BAHÇE", "ORMAN", "SAHİL", "BULUT", "NEHİR", "DALGA", "BALIK", "ASLAN", "KAPLAN", "BUZUL", "YOSUN", "ZİRVE", "YAMAÇ", "TABİAT", "VOLKAN",
    "YAPRAK", "YAĞMUR", "TOPRAK", "MEVSİM", "RÜZGAR", "KANYON", "MAĞARA", "OKYANUS", "TAVŞAN", "KUMSAL", "MERCAN", "TUNDRA", "TAYFUN", "YILDIRIM", "BİYOM",
    "KUTUPLAR", "FIRTINA", "ŞİMŞEK", "ŞELALE", "EKOSİSTEM", "FOTOSENTEZ", "MANGROV", "SARMAŞIK", "TROPİKAL",
    "GÖKKUŞAĞI", "BİYOÇEŞİTLİLİK", "YANARDAĞ", "KUTUPAYISI", "BUZULLAR"
  ],
  city: [
    "EVİM", "ODA", "KAPI", "KENT", "YOLU", "PARK", "BİNA", "KULE", "YAYA", "ÇATI", "OTEL",
    "ŞEHİR", "YOLCU", "SEFER", "SOKAK", "CADDE", "KÖPRÜ", "PAZAR", "METRO", "ARABA", "LAMBA", "LİMAN", "SİTE",
    "HARİTA", "PUSULA", "MACERA", "TİYATRO", "SİNEMA", "MARKET", "DÜKKAN", "OTOBÜS", "TRAFİK", "BALKON", "MEYDAN", "OTOGAR", "BULVAR", "KAVŞAK", "VİYADÜK", "SANAYİ",
    "MAHALLE", "TRAMVAY", "BİSİKLET", "ASANSÖR", "PENCERE", "RESTORAN", "İSTASYON", "GÖKDELEN", "BELEDİYE", "OTOPARK", "KAMUSAL",
    "YOLCULUK", "MERDİVEN", "METROPOL", "MİMARİ", "ÜSTGEÇİT", "ALTGEÇİT", "ALTYAPI", "ŞEHİRCİLİK", "URBANİZASYON"
  ],
  mind: [
    "DİL", "SES", "OYUN", "RİSK", "ÖLÇÜ", "İZİN", "AKIL", "ZEKA", "OKUL", "DERS", "SORU", "ZEKİ",
    "BİLGİ", "ÇÖZÜM", "DENGE", "GİZEM", "FİKİR", "BEYİN", "KİTAP", "SINAV", "CEVAP", "TEORİ", "SANAT", "MERAK", "DENEY", "BİLİM", "ŞUUR", "İDRAK", "KAVRAM",
    "KELİME", "HAFIZA", "EĞİTİM", "DEFTER", "MANTIK", "FORMÜL", "SÖZLÜK", "DİKKAT", "SEZGİ", "ANALİZ", "HİPOTEZ", "BİLİNÇ",
    "BİLMECE", "BULMACA", "GİZEMLİ", "ANLAMLI", "BİLİNMEZ", "HATIRLA", "DÜŞÜNCE", "ÖĞRENME", "FELSEFE", "EDEBİYAT", "MANTIKLI", "ÇIKARIM", "AKADEMİK",
    "ALGORİTMA", "KOGNİTİF", "PSİKOLOJİ", "METODOLOJİ", "BİLİNÇALTI", "MUHAKEME", "ENSEKLOPEDİ"
  ],
  space: [
    "GÖK", "UZAY", "MARS", "TAYF", "FÜZE", "UYDU", "IŞIK",
    "GÜNEŞ", "EVREN", "MEKİK", "ROKET", "KÜTLE", "ÇEKİM", "FOTON", "VENÜS", "BOŞLUK", "KUŞAK", "SONDA", "ROVER",
    "YILDIZ", "GEZEGEN", "METEOR", "KOZMOZ", "NEBULA", "KRATER", "SİSTEM", "PULSAR", "KUAZAR", "MERKÜR", "SATÜRN", "NEPTÜN", "URANÜS", "PLÜTON", "JÜPİTER", "MODÜL", "KAPSÜL", "IŞIMAK",
    "GALAKSİ", "YÖRÜNGE", "ASTRONOM", "KOZMONOT", "IŞIKHIZI", "GÖKTAŞI", "KIZILÖTE", "RADYASYON", "İSTASYON",
    "ASTRONOT", "SAMANYOLU", "KARADELİK", "ASTEROİT", "METEORİT", "GÖZLEMEVİ", "TELESKOP", "TEKİLLİK", "SÜPERKÜME", "ATMOSFER",
    "SÜPERNOVA", "ÖTEGEZEGEN", "ASTROFİZİK", "KUTUPYILDIZI", "KÜTLEÇEKİM", "YERÇEKİMİ", "YILDIZTOZU"
  ],
  sports: [
    "GOL", "ŞUT", "PAS", "LİG", "MAÇ", "KOŞU", "KALE", "FİLE", "POTA", "KASK", "SPOR",
    "TAKIM", "RAKET", "HAKEM", "KUPA", "ATLET", "GÜREŞ", "YARIŞ", "KROSS", "REKOR", "BOKSÖR", "HÜCUM", "KAPTAN",
    "FUTBOL", "BASKET", "TENİS", "MADALYA", "PARKUR", "DEFANS", "TRİBÜN", "NAKAVT", "PERİYOT",
    "STADYUM", "MARATON", "PENALTI", "TURNUVA", "BİSİKLET", "VOLEYBOL", "HENTBOL", "DEPLASMAN",
    "ANTRENMAN", "ŞAMPİYON", "OLİMPİYAT", "KONDİSYON", "TARAFTAR", "SKORBORD", "MÜCADELE", "DİSİPLİN", "ŞAMPİYONLUK"
  ],
  food: [
    "TUZ", "BAL", "YAĞ", "SÜT", "ÇAY", "AŞÇI", "FIRIN", "OCAK", "TARİF", "ÇORBA", "PİLAV", "SEBZE", "MEYVE", "TATLI",
    "EKMEK", "LEZZET", "YEMEK", "TUZLU", "ŞEKER", "TAVUK", "BALIK", "KAHVE", "BÖREK", "KÖFTE", "IZGARA", "ŞERBET", "PEYNİR", "MEZE", "HELVA", "MANTI",
    "MUTFAK", "BAHARAT", "KAVURMA", "DONDURMA", "PASTA", "SOSLAR", "İÇECEK", "GOURMET", "ZİYAFET", "SUNUM", "MENEMEN", "BAKLAVA",
    "KIZARTMA", "RESTORAN", "APARATİF", "ENGİNAR", "KAHVALTI", "TEREYAĞI",
    "GASTRONOMİ", "ZEYTİNYAĞLI", "AKŞAMYEMEĞİ"
  ]
};

export { THEME_WORDS };

// Curated theme words as high-priority catalog entries
const THEME_ENTRIES: WordEntry[] = [];
for (const [theme, list] of Object.entries(THEME_WORDS)) {
  for (const word of list) {
    THEME_ENTRIES.push({
      word,
      difficulty: word.length <= 5 ? "easy" : word.length <= 7 ? "medium" : "hard",
      boards: [4, 6, 8, 10],
      tags: [theme as WordTheme, "general"],
      weight: 4,
    });
  }
}

function getBoardsForLength(len: number): number[] {
  if (len <= 6) return [4, 6, 8, 10];
  if (len <= 8) return [6, 8, 10];
  if (len <= 10) return [8, 10];
  return [10];
}

const rawFilteredWords = (catalog as CatalogPayload).words
  .filter((entry) => {
    const word = entry.word;
    if (word.length < 3 || WORD_BLACKLIST.has(word)) return false;
    if (STEM_WHITELIST.has(word)) return true;
    if (ARTIFICIAL_SUFFIX_REGEX.test(word)) return false;
    return true;
  })
  .map((entry) => ({
    ...entry,
    boards: getBoardsForLength(entry.word.length),
  }));

const wordMap = new Map<string, WordEntry>();
for (const entry of rawFilteredWords) {
  wordMap.set(entry.word, entry);
}
for (const entry of THEME_ENTRIES) {
  const existing = wordMap.get(entry.word);
  if (existing) {
    wordMap.set(entry.word, {
      ...existing,
      boards: Array.from(new Set([...existing.boards, ...entry.boards])),
      tags: Array.from(new Set([...existing.tags, ...entry.tags])),
    });
  } else {
    wordMap.set(entry.word, entry);
  }
}

for (const verb of NATURAL_INFINITIVES) {
  if (!wordMap.has(verb)) {
    wordMap.set(verb, {
      word: verb,
      difficulty: verb.length <= 6 ? "easy" : "medium",
      boards: getBoardsForLength(verb.length),
      tags: ["general"],
      weight: 4,
    });
  }
}

export const WORD_CATALOG_DATA = {
  version: (catalog as CatalogPayload).version,
  words: Array.from(wordMap.values()),
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

export function catalogWordsForBoard(size: 4 | 6 | 8 | 10, maximumLength: number = Math.max(size, 12)) {
  const specific = WORD_CATALOG[size].filter((entry) => entry.word.length <= maximumLength);
  if (specific.length >= 30) return specific;
  return WORD_CATALOG_DATA.words.filter((entry) => entry.word.length <= maximumLength);
}

export function catalogWordsForTheme(size: 4 | 6 | 8 | 10, theme: WordTheme, maximumLength: number = Math.max(size, 12)) {
  const boardWords = catalogWordsForBoard(size, maximumLength);
  if (theme === "general") return boardWords;
  const themedWords = new Set(THEME_WORDS[theme]);
  const selected = boardWords.filter((entry) => themedWords.has(entry.word) || entry.tags.includes(theme));
  return selected.length >= 3 ? selected : boardWords;
}
