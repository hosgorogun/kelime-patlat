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
  // --- Kullanıcı tarafından bildirilen ve filtrelenen saçma / argo / tıbbi / küfür kelimeler ---
  "MABLAK", "DEBİL", "BASUR", "PEZEVENK", "DÜRZİ", "KAKA", "ÇİŞ", "MENİ", "ENİK", "DENYO", "APTAL", "SÜRTÜK", "DÖL", "KAHPE",
  "BASAK", "BASYA", "BASTIK", "BASİL", "DEBAGAT", "DEBBOY", "DEBBAĞ", "MABEYİN", "MABAT",
  "CÜZZAM", "FRENGİ", "TİFÜS", "KOLERA", "VEREM", "APANDİS", "KUDUZ", "VEBA", "GAYTA", "DIŞKI",
  "İSTİDA", "GARAMİ", "GAMBA", "TELKİH", "TEPİR", "TENVİR", "TEVKİL", "GALİZ", "TALİKA", "GAŞİY",
  "SUOKU", "MUTKİ", "KARGIN", "KAÇLI", "TEAMÜL", "OYDAŞ", "SPERM", "CİFE", "ORAL", "KİST", "YALAK",
  "CART", "CURT", "GÖVEK", "CEMAN", "YÜKÜN", "MOLAS", "EMMEÇ", "MARİZ", "CİHET", "GÜRE", "AYAŞ",
  "MİSO", "MUTİ", "VİDO", "UĞRU", "BARI", "İLGEÇ", "BÜGDÜZ", "TARAŞ", "MANZUM", "APOLET", "MARAZİ", "TAYF",
  "CÜNÜP", "ZİNA", "LİVATA", "GUSÜL", "ŞEHVET", "HADIM", "CİNSİ", "TENASÜL", "MECUSİ", "ZINDIK",
  "KAFİR", "MÜNAFIK", "MÜRTED", "HALVET", "LAHURİ", "UYUNTU", "SARALI", "TAYLAK", "BADAS", "ZİYALI",
  "İPTİDA", "BARUDİ", "HİTAM", "CEMŞAT", "TERHİN", "PASTAL", "NAKIS", "KAZAĞI", "KÖTEK", "DURAL",
  "KOKOT", "FODRA", "HABEŞ", "ERDİŞİ", "HAİLE", "İZOBAR", "MUNZAM", "HAYBE", "GARPLI", "KOVUŞ", "İLENİŞ", "CÜCÜK", "DAYANÇ", "KARİNA",
  "BOMBOK", "TIRKAZ", "ALBATR", "HÜRLE", "TİMBAL", "GENZEL", "BOALAR", "SERGİN", "KESENE",
  // --- Daha önce eklenenler ---
  "NAM", "LAK", "PRUVA", "MEME", "PISMA", "TONLUK", "EKSERİ", "EKSERİYA", "ÖZENİ", "ÖRMELİ", "DİTMEK",
  "BAV", "RUF", "DUN", "FEL", "SEM", "NOM", "POG", "ALG", "HAV", "CUP", "PIR", "DEH", "BED",
  "ZOM", "PÖÇ", "SÜMEK", "KUSMA", "SIVAMA", "KAPMACA", "TUTMACA",
  "PİÇ", "KOV", "ARİ", "ŞUH", "ÇAV", "TÖS", "İDE", "ÖZE", "KAM", "HAF", "AKA", "KÖS", "KIĞ",
  "POF", "AFİ", "İYE", "ŞOR", "OMA", "ZEM", "TÜN", "VIN", "ELK", "LÖS", "ÇİR", "ÖHÖ", "EDİ",
  "ŞEM", "MEH", "FEK", "EKE", "ŞAD", "KİK", "ŞAZ", "CIZ", "UZO", "ABE", "YEĞ", "TAL",
  "BİDE", "BİTİ", "BÖKE", "BUZUK", "CABA", "CAKA", "CILK", "ÇEPNİ", "ÇEŞT",
  "ÇIKIN", "ÇİMÇİK", "DALIZ", "DAMLI", "DEBİ", "DEĞE", "DEĞİM", "DEPSİ",
  "DEŞİK", "DEVİ", "DEVRİ", "DİBEK", "DİDAR", "DİDİM",
  "DİMAĞ", "DİNGİL", "DİNGO", "DİPER", "DİPÇİK", "DİREN", "DİRİĞ", "DİRLİK",
  "DİVAL", "DİVİT", "DİZEK", "DİZME",
  "DOKUM", "DOLAM", "DOMBAY", "DOMDOM", "DONER", "DONAM", "DORUM",
  "DÖLÜK", "DÖNEŞ", "DÖNMESİ", "DÖŞEM", "DÖŞER", "DUHUL", "DUKA", "DURGU",
  "DURMA", "DURUK", "DUŞAK", "DUYMA", "DUYUM",
  "DÜRZİ", "DÜZGÜ", "DÜZME", "EBELİK", "ECELİ", "ECNEBİ",
  "EVİMİ", "EVİNİ", "ADINI", "GÜNÜ", "SESİNİ", "YOLUNU", "KIZINI", "OĞLUNU", "CANINI", "İŞİNİ", "SÖZÜNÜ", "ELİNİ", "GÖZÜNÜ", "AKLINI", "BAŞINI", "SUYUNU",
  "SENİT", "YOKÇU", "FANYA", "KEMHA", "EZANİ", "KADÜK", "APAŞ", "ÇEDİK", "DROG", "BEZİK", "KEMRE", "CAİZE", "İNTAK", "KOTRA", "JARSE", "GASİL", "MATUH", "ARGIN", "ERGİ", "HAMEL", "HATİF", "BIKIŞ", "ÇOLPA", "EPOPE", "DÜRÜ", "ALTES", "ALYON", "DERÇ", "MİMLİ", "BABAÇ", "AÇIM",

  // --- Arkaik / Osmanlıca / Ölü kelimeler ---
  "AHİ", "ZEM", "ZOM", "PIR", "EDİ", "CIK", "POG", "POF", "MEH", "NOM", "OMA", "ORA", "HAF",
  "TAAM", "SAGU", "SERE", "SÖBE", "SELEK", "SELEF", "SEHİV", "RAŞE", "RAŞİ", "RESEN", "REVAN",
  "RİYA", "NÜKS", "UKDE", "ULAH", "URUP", "UĞUT", "UTÇU", "UMRE",
  "VAİZ", "VACİP", "VECİH", "VECİZ", "VEDİA", "VİSAL", "VİTİR", "VOYVO", "VUKU", "VUZUH", "VÜSAT",
  "ZAAF", "ZAİL", "ZEHAP", "ZİMMİ", "SOBE", "SEKEL",
  "İBDA", "İBZAL", "İCAR", "İFRAĞ", "İHAM", "DÜRÜ", "DERÇ", "APRE", "AGUŞ", "AHŞA", "ALPU", "APAZ", "ARŞE", "ASRİ",
  "BÜVE", "CÖNK", "CÜZİ", "DANK", "DERK", "DİNK", "EHEM", "EKİT",
  "SEMAH", "SAGU", "SARİG", "SARAT", "SANGI", "SIYGA", "SÖĞÜŞ", "SÜBEK", "SÜCUT", "SÜFLİ",
  "SÜYEK", "SÜYÜM", "SÜVME", "SÜVEN", "SİFİN", "SİRTO", "SİTİL", "SİYME", "SİĞİL",
  "TAAT", "TABYA", "TADAT", "TAHRA", "TALİK", "TANİN", "TAPON", "TARAZ", "TARİZ",
  "TATMA", "TAVAF", "TEDAİ", "TEDİP", "TEKST", "TELSİ", "TEMEK", "TEPİR", "TERBİ",
  "TESRİ", "TESİT", "TEVİL", "TEŞRİ", "TEŞT", "TIKIZ", "TINAZ", "TINMA", "TOKUZ",
  "TONOZ", "TOPUR", "TOYCA", "TOYCU", "TRAKE", "TRATA", "TROMP", "TRÖST", "TRİKO",
  "TÖREL", "TÖZEL", "TÜMÜR", "TİRİZ", "TİMAR",
  "ULEMA", "URBAN", "USSAL", "VAKAR", "VAKIA", "VAKUR", "VALÖR", "VARTA", "VARİS",
  "VELUR", "YALAZ", "YAMÇI", "YANGI", "YANIŞ", "YAPAK", "YARDA", "YARIK", "YASLI", "YASMA",
  "YATÇI", "YAVE", "YAYIŞ", "YAZIŞ", "YAĞAR", "YAĞSI", "YEDME", "YEDİZ", "YELVE",
  "YERME", "YEZİT", "YEĞNİ", "YILKI", "YILMA", "YIRIK", "YIVA", "YOLMA", "YORTU",
  "YOSMA", "YUNAK", "YUNMA", "YUVAK", "YUVGU", "YÜLÜK", "YÜSRÜ", "YİTME", "YİTİŞ",
  "ZEBUN", "ZELVE", "ZORGU", "ZÜHAL", "ZÜLÜF", "ZİFİR",
  "ÇALTI", "ÇAMAT", "ÇAMAŞ", "ÇAPMA", "ÇAPUL", "ÇARKA", "ÇAVLI", "ÇAYAN",
  "ÇEKEL", "ÇEKÇE", "ÇEKÜL", "ÇELEN", "ÇENEK", "ÇENET", "ÇERGE", "ÇERÇİ",
  "ÇOKAL", "ÇOKÇU", "ÇİPİL", "ÇİRİŞ", "ÇİĞİL", "ÇİŞİK",
  "ÖBÜRÜ", "ÖRFİ", "ÖRGE", "ÖRÜK", "ÖTÜCÜ", "ÖZALP",
  "ÜFLEÇ", "ÜLFET", "ÜLÜŞ", "ÜMMİ", "ÜMÜK", "ÜRAT", "ÜRGÜP", "ÜÇTAŞ",
  "İCAP", "İCAR", "İCMAL", "İFLAH", "İFRAĞ", "İHAM", "İHATA", "İHDAS", "İHRAM", "İHRAZ",
  "İKDAM", "İKRAH", "İKRAR", "İKRAZ", "İKSİR", "İLKAH", "İLLET", "İMALE",
  "İNŞAT", "İPEKA", "İPSİZ", "İRADİ", "İRMİK", "İRSEN", "İRŞAT", "İSLİM", "İSPİR",
  "İSTİF", "İTHAF", "İTLAF", "İTMAM", "İTİLA", "İVESİ", "İZAZ", "İZHAR",
  "ŞAFUL", "ŞAFİİ", "ŞAHAP", "ŞARPİ", "ŞATIR", "ŞAYAK", "ŞAYKA", "ŞAİBE", "ŞAİRE",
  "ŞEKVA", "ŞERHA", "ŞERİR", "ŞIRAK", "ŞORCA", "ŞÖMİZ", "ŞİMAL", "ŞİNTO", "ŞİRAN",

  // --- Teknik / Tıbbi / Bilimsel ---
  "SPAZM", "SPERM", "PENİS", "PENES", "OOSİT", "NÜZUL", "MEDÜZ", "NODÜL", "MELAS",
  "LORTA", "LEPRA", "LAHUT", "LAHİT", "LAĞIV", "KÜRDİ", "KİTRE", "KUVÖZ", "KUMUL",
  "KUTSİ", "KUTNU", "KOTRA", "KOFTİ", "KITAL", "KITIR", "KROŞE", "KUPLE",
  "RAFİT", "RECİM", "REFİK", "REKİZ", "REMİZ", "RÜKÜN", "RÜSUM", "RÜYET", "RİCAL",
  "SÜLÜK", "SÜMÜK",
  "TASMA", "TIRIS", "TİRİZ",
  "UTMAK", "UZLUK", "UZVİ",
  "VONOZ", "VİYAK", "VİYA",

  // --- Özel isim / Yer adı / Marka / Etnik (kesinlikle çıkar) ---
  "NUH", "AYLA", "AYAŞ", "SİVAS", "ZELVE", "ORLON", "ORİON", "YUNAN", "URLA",
  "VANLI", "RUMCA", "NİSAN", "METİS", "MOĞOL", "MACAR", "KİLİS", "KEŞAN",
  "ÇEÇEN", "ZENCİ", "ORYA",

  // --- Rahatsız edici / argo / kaba ---
  "CİFE", "SOBE", "SIYGA",

  // --- Kullanıcının bildirdiği ve tespit edilen saçma/arkaik/Scrabble kelimeleri ---
  "AGEL", "GIGI", "GETR", "GABİ", "GALİ", "GANG", "GANİ", "GARP", "GEDA", "GELE",
  "GONK", "GREK", "GÖCE", "GÖNÇ", "GÖRK", "GÜRE", "GİDİ", "HAFİ", "HAJE", "HARA",
  "HAZA", "HAİL", "HAİZ", "HEBA", "HOŞT", "HUNİ", "HUŞU", "HÜDA", "HİBE", "HİŞT",
  "IRIP", "IĞIL", "IŞKI", "JİLE", "KAKA", "KALA", "KAMA", "KANT", "KARO", "KAVİ",
  "KAÇA", "KEFE", "KEKE", "KESP", "KUUT", "KÖSE", "KÜNK", "KİLE", "KİPE", "KİST",
  "LAKA", "LALA", "LAİN", "LAŞE", "LİKA", "MAKİ", "MANO", "MAPA", "MARN", "MAYİ",
  "MESH", "MEŞK", "MOKA", "MURÇ", "MUTİ", "MUİN", "MUİT", "MÜFT", "MİAT", "MİHR",
  "MİSO", "NALE", "NARH", "NAZİ", "NAİL", "NAŞİ", "NEBİ", "NÜVE", "NİTE", "OBUA",
  "OMCA", "OTAĞ", "PARE", "PATA", "PENA", "PEPE", "PEYK", "PIŞT", "PUPA", "RATE",
  "RAZI", "REHA", "SADA", "SAFİ", "SAKE", "SANI", "SAPA", "SAVA", "SAYE", "SEKİ",
  "SÖKE", "SÖVE", "SÜJE", "SİLO", "SİLİ", "SİNE", "SİNİ", "SİYA", "TABA", "TALK",
  "TAPI", "TAUN", "TEFE", "TERE", "TRAS", "TROK", "TÜLÜ", "TİFO", "TİPO", "ULAK",
  "ULAM", "ULUM", "UMUR", "UMUŞ", "URUK", "UĞRA", "UĞRU", "VAKİ", "VERE", "VİDO",
  "VİRA", "YAVE", "YIVA", "YOMA", "YUNA", "ZAİL", "ZINK", "ZİLİ", "ÇİPO", "ÇİSE",
  "ÇİTA", "ÇİTİ", "ÖKSE", "ÖLÜŞ", "ÖVÜŞ", "ÖÇLÜ", "ÖĞÜR", "ÜNİK", "İAŞE", "İBRE",
  "İGLU", "İHYA", "İNAK", "İNAL", "İRAP", "İRCA", "İTAP", "İVGİ", "İÇRE", "İÇİŞ",
  "İŞBU", "ŞALT", "ŞİST", "ABLİ", "ABUS", "ACUL", "ACUR", "AHAR", "AHİR", "AHİT",
  "AKİS", "ALAZ", "ALIÇ", "ANIK", "APSE", "ARAZ", "ASAP", "ASAR", "ASIM", "ATOL",
  "AVAR", "AVAZ", "AYIT", "AZİT", "AÇAR", "AÇIŞ", "AÇKI", "BABİ", "BADE", "BAKİ",
  "BARI", "BARİ", "BATİ", "BAYİ", "BAZA", "BERİ", "BETİ", "BOCA", "BREŞ", "BROM",
  "BRİT", "BRİÇ", "BUKE", "BİBİ", "BİYE", "CART", "CELİ", "CIRT", "DADI", "DANE",
  "DARA", "DARP", "DEBİ", "DEFİ", "DİNE", "DİZE", "EDER", "EHİL", "EKLİ", "EKOL",
  "EKTİ", "ENİK", "ENİR", "EREK", "ERİL", "ESEF", "ESİK", "ESİM", "ETER", "EVCE",
  "EŞEY", "FAVA", "FLOŞ", "FRİZ", "FUTA", "FÖTR",
  // 3 harfli saçma/arkaik kelimeler:
  "ABA", "AHA", "AKI", "ARP", "ARZ", "ATE", "BAZ", "BÖN", "CÜZ", "DOK", "DÜK",
  "FER", "FOL", "FİN", "GIK", "HUN", "KET", "KOF", "KOZ", "KUT", "LAL", "LAM",
  "LOK", "LOP", "LOR", "MİM", "PEY", "PUT", "PÜR", "RUN", "SAC", "SAK", "SKİ",
  "SOM", "SİM", "SİN", "TEM", "TİP", "YEK", "YUH", "ZAT", "ÇAP", "ÇAT", "ÇİP",
  "ÇİS", "ÇİY", "ÇİŞ", "ÜRE", "İNÇ", "ŞAK", "ŞER", "ŞOM",
  // 5 harfli bariz saçma/arkaik/yabancı kelimeler:
  "ABADİ", "ABALI", "ABANA", "ABAŞO", "ABBAS", "ABOSA", "ACUZE", "ACİBE", "ADESE",
  "AFİLİ", "AGAMİ", "AKABE", "AKAJU", "AKALA", "AKKÖY", "AKMAZ", "AKPAS", "AKSAK",
  "AKÇIL", "AKİDE", "ALENİ", "ALEVİ", "ALEYH", "ALGIN", "ALLEM", "ALLIK", "ALMAŞ",
  "ALMUS", "ALTIZ", "ALİZE", "AMADE", "AMPİR", "ANACA", "ANDIK", "ANDIÇ", "ANLAK",
  "ANZAK", "ANÜRİ", "APOTR", "APOŞİ", "APSİS", "APİKO", "ARAKA", "ARDIL", "ARGAÇ",
  "ARSİN", "ARİZA", "ASKAT", "ASKLI", "ASİDE", "AVAZE", "AVLAK", "AYNAZ", "AZVAY",
  "MEREK", "MUHİL", "MERES", "MEZRU", "MENUS", "MEHLE",
  "YAVAŞA", "YAVAŞAK", "YAVŞA", "YAVŞAK",
  "CAMİT", "FAHTE", "FAÇALI", "CARLI", "MAHCUR", "NAKİP", "MUHAT", "MAHUR", "REKİZ",
  "GABRO", "MUHİP", "RUHÇA", "RİCAL", "RÜKÜN", "RÜYET", "MEVUT", "GABİN", "REMİZ",
  "RECİM", "RÜSUM", "REVAK", "MİLEL", "MUTAT", "MÜHRE", "MUTAF", "FAÇUNA", "FAGOT",
  "FANYA", "FASIK", "FASİT", "FİRAK", "FÜCUR", "FÜTUR", "CAĞLI", "CANFEZ", "CAVLAN"
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
    "EV", "ODA", "KAPI", "KENT", "YOL", "PARK", "BİNA", "KULE", "YAYA", "ÇATI", "OTEL",
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
    "ALGORİTMA", "KOGNİTİF", "PSİKOLOJİ", "METODOLOJİ", "BİLİNÇALTI", "MUHAKEME", "ANSİKLOPEDİ"
  ],
  space: [
    "GÖK", "UZAY", "MARS", "FÜZE", "UYDU", "IŞIK",
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
      weight: 3,
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
      weight: 3,
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
