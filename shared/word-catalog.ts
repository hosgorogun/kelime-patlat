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
const ARTIFICIAL_SUFFIX_REGEX = /(Sİ|SÜ|SU|SI|LİK|LUK|LÜK|MA|ME|MELİ|MALI|MEK|MAK|Cİ|CU|CÜ|Cı|Çİ|ÇU|ÇÜ|ÇI|SEL|SAL|MACA|MECE|EN|AN)$/;

// Whitelist of valid stem words that coincidentally end with suffix patterns
const STEM_WHITELIST = new Set([
  "MEYVE", "GÜNEŞ", "ELMA", "YÜZME", "ÇİZME", "KALE", "DÜME", "KÜME", "KİME", "DİME",
  "ÇEŞME", "BÖLME", "DÖNME", "GÖRME", "GELME", "ORMAN", "ADAM", "KADIN", "İNSAN", "VADİ",
  "SAHİL", "KENT", "ŞEHİR", "DUVAR", "TAVAN", "MASA", "KAPILMA", "SARMA", "DOLMA", "KIZARTMA"
]);

export const WORD_CATALOG_DATA = {
  version: (catalog as CatalogPayload).version,
  words: (catalog as CatalogPayload).words.filter((entry) => {
    const word = entry.word;
    if (word.length < 3 || WORD_BLACKLIST.has(word)) return false;
    
    // Allow pure stem whitelist words
    if (STEM_WHITELIST.has(word)) return true;

    // Filter out artificial inflected and suffix-heavy words for 3-6 letter words
    if (word.length <= 6 && ARTIFICIAL_SUFFIX_REGEX.test(word)) {
      // Exclude words that are obvious inflections or unnatural derivatives
      return false;
    }
    return true;
  })
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
    "AĞAÇ", "BİTKİ", "ÇİMEN", "KAR", "FIRTINA", "ŞİMŞEK", "VOLKAN", "KANYON", "MAĞARA", "YAYLA", "ŞELALE", "OKYANUS", "DALGA", "BALIK", "KUŞ", "ASLAN", "KAPLAN", "GEYİK", "TAVŞAN", "ÇÖL", "KUMSAL", "SAHRA", "KUTUP", "BUZUL", "GÖKYÜZÜ", "GEZEGEN", "EVREN", "DOĞA", "TABİAT", "YOSUN", "ASMALAR", "KARA",
    "ATMOSFER", "EKOSİSTEM", "BİYOM", "SARP", "ZİRVE", "YAMAÇ", "BİYOŞİFA", "MANGROV", "TUNDRA", "BORA", "TAYFUN", "HURRİKANE", "KUTUPAYISI", "MERCAN", "RESİF", "FOTOSENTEZ", "FLORA", "FAUNA", "TROPİK", "BİYOÇEŞİTLİLİK", "SARMAŞIK", "ŞELALELER", "VADİLER", "YANARDAĞ"
  ],
  city: [
    "KENT", "ŞEHİR", "EVİM", "ODA", "KAPI", "YOLU", "YOLCU", "SEFER", "HARİTA", "PUSULA", "YOLCULUK", "MACERA", "KIYILAR",
    "SOKAK", "CADDE", "MAHALLE", "BİNA", "KULE", "KÖPRÜ", "PARK", "MÜZE", "SİNEMA", "TİYATRO", "MARKET", "DÜKKAN", "PAZAR", "METRO", "OTOBÜS", "TRAMVAY", "ARABA", "BİSİKLET", "TRAFİK", "YAYA", "LAMBA", "ASANSÖR", "MERDİVEN", "PENCERE", "BALKON", "ÇATI", "OTEL", "RESTORAN", "MEYDAN", "LİMAN", "İSTASYON",
    "METROPOL", "GÖKDELEN", "MİMARİ", "URBANİZASYON", "OTOGAR", "BULVAR", "KAVŞAK", "ÜSTGEÇİT", "ALTGEÇİT", "SİRKÜLASYON", "ALTYAPI", "BELEDİYE", "VİYADÜK", "TRAFİK IŞIĞI", "ŞEHİRCİLİK", "OTOPARK", "KAMUSAL", "SANAYİ", "SİTE", "RESİDENCE", "TRAMVAY HATTI"
  ],
  mind: [
    "DİL", "SES", "OYUN", "RİSK", "ÖLÇÜ", "İZİN", "KELİME", "BİLGİ", "BİLMECE", "BULMACA", "ÇÖZÜM", "DENGE", "GİZEM", "GİZEMLİ", "ANLAMLI", "BİLİNMEZ", "BİLGİLER", "HATIRLA",
    "DÜŞÜNCE", "FİKİR", "AKIL", "ZEKA", "BEYİN", "HAFIZA", "EĞİTİM", "ÖĞRENME", "OKUL", "KİTAP", "DEFTER", "KALEM", "DERS", "SINAV", "SORU", "CEVAP", "MANTIK", "DENEY", "BİLİM", "FORMÜL", "TEORİ", "SÖZLÜK", "EDEBİYAT", "FELSEFE", "SANAT", "ZEKİ", "MERAK", "DİKKAT",
    "SEZGİ", "ANALİZ", "SENTETİK", "DİYALEKTİK", "HIPOTEZ", "KAVRAM", "ALGORİTMA", "BİLİNÇ", "ŞUUR", "KOGNİTİF", "İDRAK", "TASAVVUR", "MANTIKLI", "METODOLOJİ", "ÇIKARIM", "AKIL YÜRÜTME", "ÖZÜMSEME", "AKADEMİK", "ENSEKLOPEDİ", "PSİKOLOJİ"
  ],
  space: [
    "KOZMOZ", "GEZEGEN", "YILDIZ", "ROKET", "UYDU", "GALAKSİ", "METEOR", "KARADELİK", "ASTRONOT", "YÖRÜNGE", "KRATER", "KUYRUKLU", "ÇEKİM", "UZAY", "EVREN", "GÜNEŞ", "DÜNYA", "MARS", "AY", "NEBULA", "KUŞAK", "KUYRUK", "ÇARPIŞMA", "MEKİK", "GÖZCÜ", "SİSTEM", "BOŞLUK",
    "SUPERNOVA", "TEKİLLİK", "SÜPERKÜME", "KUZEY IŞIKLARI", "ASTEROİD", "METEORİT", "GÖKTAŞI", "EXOPLANET", "SPETRUM", "IŞIK YILI", "PARSEK", "YERÇEKİMİ", "RHO", "RADYASYON", "KOZMONOT", "FÜZE", "GÖZLEMEVİ", "TELESKOP", "ASTRONOMİ", "TİTANYUM", "UZAY İSTASYONU"
  ],
  sports: [
    "FUTBOL", "BASKET", "TENİS", "KOŞU", "KALE", "ŞUT", "PAS", "TAKIM", "STADYUM", "RAKET", "ANTRENMAN", "HAKEM", "MADALYA", "OLİMPİYAT", "ŞAMPİYON", "KUPA", "LİG", "MAÇ", "SPOR", "ATLET", "FİLE", "GOL", "POTA", "KASK", "FORMULA", "PARKUR", "GÜREŞ", "YARIŞ",
    "ŞAMPİYONLUK", "KONDİSYON", "TARAFTAR", "MARATON", "KROSS", "PENALTI", "DEFANS", "HÜCUM", "TAKİP", "SKORBORD", "DEPLASMAN", "REKOR", "TRİBÜN", "PERİYOT", "NAKAVT", "BOKSÖR", "MÜCADELE", "DİSİPLİN", "KAPTAN", "CENTİLMEN", "TURNUVA"
  ],
  food: [
    "EKMEK", "ÇORBA", "PİLAV", "SEBZE", "MEYVE", "TATLI", "MUTFAK", "LEZZET", "YEMEK", "TUZLU", "BAHARAT", "TARİF", "FIRIN", "OCAK", "AŞÇI", "TUZ", "ŞEKER", "BAL", "YAĞ", "ET", "TAVUK", "BALIK", "ÇAY", "KAHVE", "SU", "SÜT", "MEYVELER", "TATLAR", "KIZARTMA",
    "GASTRONOMİ", "RESTORAN", "GOURMET", "ZİYAFET", "ZEYTİNYAĞLI", "MENÜ", "SUNUM", "APARATİF", "DONDURMA", "PASTA", "BÖREK", "KIZARTMALAR", "TEREYAĞI", "SOSLAR", "İÇECEK", "KAVURMA", "IZGARA", "ŞERBET", "PEYNİR", "MEZE", "KAHVALTI", "AKŞAM YEMEĞİ"
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
