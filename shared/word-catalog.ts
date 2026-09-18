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
  "UŞAKLI", "KÜTAHYALI", "DÜZCELİ", "ADANALI", "ANTALYALI", "AĞRILI", "BURDURLU",
  "RİZELİ", "MERSİNLİ", "AKSARAYLI", "HATAYLI", "AMASYALI", "BAYBURTLU", "ARTVİNLİ",
  "TRABZONLU", "KIRŞEHİRLİ", "YALOVALI", "TUNCELİLİ", "ERZURUMLU", "ERZİNCANLI",
  "KARABÜKLÜ", "TOKATLI", "SİVASLI", "BİNGÖLLÜ", "GİRİTLİ", "KARTALLI",
  "BEŞİRİ", "KOZLUK", "GERCÜŞ", "HASANKEYF", "TAVAS", "ACIPAYAM", "BULDAN",
  "SERİNHİSAR", "CİHANBEYLİ", "DOĞANHİSAR", "ILGIN", "SEYDİŞEHİR", "BEYŞEHİR",
  "YALIHÜYÜK", "ÇATAK", "ERCİŞ", "BAHÇESARAY", "ÇAMLIDERE", "KALECİK", "HAYMANA",
  "SİLİVRİ", "ALANYA", "MANAVGAT", "KORKUTELİ", "DEMRE", "GÜNDOĞMUŞ", "DİGOR",
  "SARIKAMIŞ", "ARPAÇAY", "ANAMUR", "BOZYAZI", "TARSUS", "BERGAMA", "ALİAĞA",
  "GAZİEMİR", "KARŞIYAKA", "TORBALI", "URLA", "KARABURUN", "PAZARCIK", "SİLVAN",
  "BİSMİL", "HAZRO", "İDİL", "ULUDERE", "GÜÇLÜKONAK", "ŞEMDİNLİ", "ÇUKURCA",
  "DERECİK", "KURTALAN", "BAYKAN", "ŞİRVAN", "BİRECİK", "AKÇAKALE", "DİYADİN",
  "TATVAN", "MUTKİ", "GÜROYMAK", "MAZGİRT", "ÇAYIRLI", "OTLUKBELİ", "AŞKALE",
  "İSPİR", "NARMAN", "OLTU", "PASİNLER", "ŞENKAYA", "TORTUM", "KARAÇOBAN",
  "KÖPRÜKÖY", "UZUNDERE", "ALUCRA", "ÇAMOLUK", "YAĞLIDERE", "ÇATALPINAR", "FATSA",
  "KORGAN", "ÜNYE", "ARHAVİ", "MURGUL", "SÜRMENE", "ŞALPAZARI", "TONYA", "VAKFIKEBİR",

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
  "FANYA", "FASIK", "FASİT", "FİRAK", "FÜCUR", "FÜTUR", "CAĞLI", "CANFEZ", "CAVLAN",
  "PESEK",
  "ÇOKÇA"
]);


// Senior QA Stem Filter: Removes possessive, case, participial and artificial derived suffixes
const ARTIFICIAL_SUFFIX_REGEX = /(Sİ|SÜ|SU|SI|LİK|LUK|LÜK|MA|ME|MELİ|MALI|MEK|MAK|Cİ|CU|CÜ|CI|Çİ|ÇU|ÇÜ|ÇI|SEL|SAL|MACA|MECE|EN|AN|LENME|LANMA|ULMA|İLME|CA|CE|ÇA|ÇE)$/;

// Living Turkish natural infinitives (approved core verbs)
const NATURAL_INFINITIVES = [
  "SEVMEK", "GÖRMEK", "KOŞMAK", "BİLMEK", "YAŞAMAK", "ÇÖZMEK", "ANLAMAK", "YÜRÜMEK", "YAZMAK", "OKUMAK",
  "DUYMAK", "BULMAK", "GÜLMEK", "BAKMAK", "GEZMEK", "UÇMAK", "YÜZMEK", "DÜŞÜNMEK", "BAŞLAMAK", "ÖĞRENMEK",
  "ANLATMAK", "ÇALIŞMAK", "KAZANMAK", "KORUMAK", "PAYLAŞMAK", "DİNLEMEK", "DURMAK", "KALKMAK", "OTURMAK", "KONUŞMAK",
  "BEKLEMEK", "BİTİRMEK", "DÖNMEK", "SEÇMEK", "İSTEMEK", "DENEMEK", "YAPMAK", "GİTMEK", "GELMEK", "ALMAK",
  "VERMEK", "AÇMAK", "KAPAMAK", "BULUŞMAK", "YAKALAMAK", "SAVUNMAK", "KUTLAMAK", "YENMEK", "YARIŞMAK",
  "SÖYLEMEK", "SORMAK", "GİRMEK", "ÇIKMAK", "BİTMEK", "İÇMEK", "UNUTMAK", "HATIRLAMAK", "AĞLAMAK",
  "KALMAK", "OLMAK", "ETMEK", "DEMEK", "TANIMAK", "İNANMAK", "KULLANMAK", "HAZIRLAMAK", "TEMİZLEMEK",
  "PİŞİRMEK", "YIKAMAK", "GİYMEK", "TUTMAK", "BIRAKMAK", "ATMAK", "ÇEKMEK", "KESMEK", "TAŞIMAK",
  "GETİRMEK", "GÖTÜRMEK", "GÖNDERMEK", "SATMAK", "ÖDEMEK", "SAYMAK", "GEÇMEK", "KOYMAK", "AÇIKLAMAK",
  "KAPATMAK", "ÖĞRETMEK", "ÇİZMEK", "BOYAMAK", "SEVİNMEK", "KORKMAK", "ŞAŞIRMAK", "DÜŞMEK", "YATMAK",
  "BAĞIRMAK", "ÖPMEK", "SARILMAK", "DOKUNMAK", "HİSSETMEK", "PLANLAMAK", "UYGULAMAK", "BEĞENMEK",
  "YAKMAK", "SÖNDÜRMEK", "ISITMAK", "SOĞUTMAK", "DOLDURMAK", "BOŞALTMAK", "KARŞILAMAK", "UĞRAMAK",
  "ÇAĞIRMAK", "GÖRÜŞMEK", "ANLAŞMAK", "TARTIŞMAK", "REDDETMEK", "KABULLENMEK", "GÖSTERMEK", "CEVAPLAMAK"
];

// Whitelist of valid stem words that coincidentally end with suffix patterns
const STEM_WHITELIST = new Set([
  "MEYVE", "GÜNEŞ", "ELMA", "YÜZME", "ÇİZME", "KALE", "DÜME", "KÜME", "KİME", "DİME",
  "ÇEŞME", "BÖLME", "DÖNME", "GÖRME", "GELME", "ORMAN", "ADAM", "KADIN", "İNSAN", "VADİ",
  "SAHİL", "KENT", "ŞEHİR", "DUVAR", "TAVAN", "MASA", "KAPILMA", "SARMA", "DOLMA", "KIZARTMA",
  "FOTOSENTEZ", "EKOSİSTEM", "BİYOÇEŞİTLİLİK",
  "BAHÇE", "PARÇA", "DİLEKÇE", "KEMENÇE", "ORTANCA", "İMECE", "AMCA", "GONCA",
  "SERÇE", "İŞKENCE", "TABANCA", "KARINCA", "DÜŞÜNCE", "GÜVENCE", "EĞLENCE",
  "SÖYLENCE", "DİRENCE", "GÖRÜMCE", "BİLMECE", "BULMACA", "ÇEKMECE", "DÖNENCE",
  "LONCA", "İLTİCA",
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
    "EVİM", "ODA", "KAPI", "KENT", "YOL", "PARK", "BİNA", "KULE", "YAYA", "ÇATI", "OTEL",
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
    "MUTFAK", "BAHARAT", "KAVURMA", "DONDURMA", "PASTA", "SOSLAR", "İÇECEK", "GURME", "ZİYAFET", "SUNUM", "MENEMEN", "BAKLAVA",
    "KIZARTMA", "RESTORAN", "APARATİF", "ENGİNAR", "KAHVALTI", "TEREYAĞI",
    "GASTRONOMİ", "ZEYTİNYAĞLI", "AKŞAMYEMEĞİ"
  ]
};

export { THEME_WORDS };

const TR_WORD_RE = /^[ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ]+$/;

function isValidCatalogWord(word: string) {
  return word.length >= 3 && word.length <= 15 && TR_WORD_RE.test(word) && !WORD_BLACKLIST.has(word);
}

function difficultyForLength(len: number): WordDifficulty {
  if (len <= 5) return "easy";
  if (len <= 7) return "medium";
  return "hard";
}

/** Everyday Turkish words a typical player would actually know. */
const EXTRA_EVERYDAY_WORDS = [
  "GÜN", "BAL", "TUZ", "SÜT", "ÇAY", "YAĞ", "GÖL", "GÜL", "TAŞ", "YOL", "SES", "GÖZ",
  "ANA", "NAR", "KUŞ", "KAZ", "ARI", "ADA", "DAĞ", "KUM", "KAR", "YIL", "YAZ", "KIŞ",
  "SAÇ", "YÜZ", "DİL", "DİŞ", "KOL", "BAŞ", "TOP", "ODA", "GOL", "MAÇ", "ZİL", "BOT",
  "DAL", "KÖK", "BİR", "İKİ", "ÜÇ", "BİN", "YÜN", "FİL", "AYI", "MOR", "GRİ", "DAR",
  "PAS", "LİG", "ŞUT", "GÖK", "MUM", "RAY", "HIZ", "KIZ", "KÖY", "ATEŞ", "SİS", "PUL",
  "RAF", "ÇİM", "SAHA", "YUVA", "OLTA", "KOKU", "KRAL", "YELE", "GÜÇ", "EYER",
  "SÜRÜ", "GAGA", "LALE", "ÇAM", "MEŞE", "BEŞ", "ALTI", "YEDİ", "DÖRT", "SEKİZ", "DOKUZ",
  "BABA", "DOST", "AİLE", "ELMA", "MUZ", "ÜZÜM", "KEDİ", "İNEK", "KEÇİ", "KAPI", "MASA",
  "SAAT", "OKUL", "DERS", "OYUN", "TREN", "UÇAK", "GEMİ", "AĞAÇ", "PARK", "HAVA", "GECE",
  "MAVİ", "SARI", "UZUN", "KISA", "YENİ", "ESKİ", "UMUT", "AĞIZ", "KALP", "PARA", "KART",
  "KUTU", "KASA", "DANS", "FİLM", "ŞİİR", "TOST", "MONT", "ETEK", "ATKI", "HARF", "SORU",
  "RÜYA", "PİL", "LİSE", "KURS", "OFİS", "ANNE", "DEDE", "NİNE", "AMCA", "HALA", "DAYI",
  "UYKU", "İĞNE", "DOLU", "KALE", "KUPA", "MAYO", "KAMP", "ÇATI", "BACA", "YARA", "LİRA",
  "FİŞ", "ZARF", "OCAK", "TAVA", "RENK", "KARE", "SAYI", "SİTE", "ACİL", "BANK", "BERE",
  "SPOR", "PUAN", "UZAY", "BOYA", "ZEKA", "NEŞE", "TÜY", "KÖPEK", "KOYUN", "HOROZ", "KURT",
  "YILAN", "KURT", "FARE", "SİLGİ", "ÇANTA", "SINIF", "SINAV", "ÖDEV", "BEBEK", "TAKSİ",
  "METRO", "MOTOR", "BULUT", "ORMAN", "ÇİÇEK", "BAHÇE", "NEHİR", "DÜNYA", "SABAH", "ÖĞLE",
  "AKŞAM", "HAFTA", "YEŞİL", "BEYAZ", "SİYAH", "PEMBE", "BÜYÜK", "KÜÇÜK", "SICAK", "SOĞUK",
  "SERT", "HIZLI", "YAVAŞ", "GÜZEL", "MUTLU", "ÜZGÜN", "KORKU", "ÖFKE", "SEVGİ", "BARIŞ",
  "KULAK", "BURUN", "AYAK", "POLİS", "AŞÇI", "ŞOFÖR", "YAZAR", "KOŞU", "TENİS", "FIRIN",
  "KASAP", "MANAV", "KAFE", "MÜZE", "HAVUZ", "PLAJ", "DURAK", "KÖPRÜ", "CADDE", "SOKAK",
  "ÜLKE", "BAKAN", "BANKA", "FİYAT", "HEDİYE", "POŞET", "MÜZİK", "ŞARKI", "MASAL", "KAHVE",
  "AYRAN", "SUCUK", "SİMİT", "PİZZA", "KAĞIT", "KİLİT", "CEKET", "GÖMLEK", "ÇORAP", "ŞAPKA",
  "DÜĞÜN", "BAYRAM", "TATİL", "TAHTA", "SKOR", "YEMEK", "BİLGİ", "CEVAP", "FİKİR", "HAYAL",
  "DOĞRU", "KOLAY", "MESAJ", "RADYO", "ŞARJ", "KUZEN", "TORUN", "SABUN", "HAVLU", "TARAK",
  "MAKAS", "İPLİK", "MEYVE", "SEBZE", "TATLI", "ŞEKER", "ÖNLÜK", "FORMA", "HAKEM", "KAYIK",
  "FENER", "DOĞA", "BALON", "GARAJ", "İLAÇ", "HASTA", "ADRES", "PAPATYA", "SÖĞÜT", "TOHUM",
  "TABAK", "KAŞIK", "ÇATAL", "BIÇAK", "BARDAK", "YATAK", "DOLAP", "LAMBA", "PERDE", "HALI",
  "SULUK", "DAİRE", "ÜÇGEN", "BİLET", "VALİZ", "OTEL", "EKRAN", "DERGİ", "GAZETE", "SAHNE",
  "TABLO", "HEYKEL", "TARİH", "ESER", "KAYAK", "YARDIM", "ROKET", "REÇEL", "BİBER", "SOĞAN",
  "HAVUÇ", "TEKNE", "DAMLA", "BİNA", "TARLA", "SAYFA", "SANAT", "SOFRA", "AÇLIK", "ÇEŞME",
  "KABUK", "DİLİM", "SERİN", "KANAT", "KOVAN", "ÇAYIR", "KÜMES", "SADIK", "ŞEKİL", "LEVHA",
  "IŞIK", "TÜNEL", "SÖZLÜK", "HİKAYE", "ROMAN", "ANAHTAR", "GÖZLÜK", "HAZİNE", "KELİME",
  "GERÇEK", "YANLIŞ", "KAMERA", "FABRİKA", "MAĞAZA", "TEYZE", "YASTIK", "YORGAN", "ŞAMPUAN",
  "KANTİN", "FUTBOL", "YENGEÇ", "ÇADIR", "SAĞLIK", "CÜZDAN", "OTOBAN", "MEKTUP", "POSTANE",
  "MENEKŞE", "SÜMBÜL", "TENCERE", "KOMODİN", "GAZETE", "AKTÖR", "ÇİZME", "BASKET", "ZEYTİN",
  "PİLAV", "ÇORBA", "KÖFTE", "BALIK", "PASTA", "TAVUK", "ARMUT", "KİRAZ", "ÇİLEK", "KAVUN",
  "İNCİR", "SALATA", "YOĞURT", "PATATES", "DOMATES", "LAHANA", "NOHUT", "PİRİNÇ", "TAVŞAN",
  "ÖRDEK", "ASLAN", "KAPLAN", "GEYİK", "MAYMUN", "ZEBRA", "YUNUS", "KELEBEK", "SİNCAP",
  "KURBAĞA", "KARTAL", "SERÇE", "SALON", "MUTFAK", "BANYO", "KOLTUK", "DUVAR", "TAVAN",
  "ZEMİN", "AYNA", "TABLET", "KALEM", "DEFTER", "KİTAP", "ARABA", "OTOBÜS", "KAMYON",
  "YILDIZ", "YAĞMUR", "RÜZGAR", "DENİZ", "YAPRAK", "ÇİMEN", "TOPRAK", "GÖKYÜZÜ", "GENİŞ",
  "YUMUŞAK", "ÇİRKİN", "SEVİNÇ", "PARMAK", "BACAK", "DOKTOR", "ÇİFTÇİ", "OYUNCU", "RESSAM",
  "SPORCU", "YÜZME", "ECZANE", "MARKET", "SİNEMA", "MEYDAN", "ŞEHİR", "MİLLET", "BAYRAK",
  "POĞAÇA", "PANTOLON", "TİŞÖRT", "ELDİVEN", "MACERA", "BULMACA", "İNTERNET", "KULAKLIK",
  "FAKÜLTE", "İLKOKUL", "MESAİ", "İŞYERİ", "KAHVALTI", "NEVRESİM", "TENEFFÜS", "STADYUM",
  "ŞEMSİYE", "YÜRÜYÜŞ", "KUTLAMA", "BALKON", "ÖKSÜRÜK", "BANDAJ", "VİTAMİN", "İNDİRİM",
  "KAVŞAK", "KARANFİL", "BUZDOLABI", "BULAŞIK", "SANDVİÇ", "PASAPORT", "KLAVYE", "AKTRİS",
  "SALINCAK", "KAYDIRAK", "MANZARA", "SESSİZ", "KAPTAN", "RİTİM", "FIRÇA", "KAHKAHA",
  "SÜRPRİZ", "ZİYARET", "SOHBET", "SALKIM", "ÇEKİRDEK", "GEVREK", "HORTUM", "ÇİFTLİK",
  "KARDEŞ", "ÇOCUK", "ARKADAŞ", "İNSAN", "KADIN", "ERKEK", "OĞLAN", "PORTAKAL", "KARPUZ",
  "ŞEFTALİ", "PEYNİR", "YUMURTA", "MAKARNA", "BİSKÜVİ", "SARIMSAK", "ISPANAK", "FASULYE",
  "MERCİMEK", "BAHARAT", "PAPAĞAN", "GÜVERCİN", "SANDALYE", "PENCERE", "TELEFON", "OYUNCAK",
  "BİSİKLET", "TRAKTÖR", "FIRTINA", "OKYANUS", "SONBAHAR", "İLKBAHAR", "TURUNCU", "DOSTLUK",
  "HEMŞİRE", "İTFAİYE", "AVUKAT", "HAKİM", "SANATÇI", "HASTANE", "RESTORAN", "TİYATRO",
  "İSTASYON", "LİMONATA", "HAMBURGER", "AYAKKABI", "YOLCULUK", "KAYBETMEK", "BAŞARMAK",
  "OYNAMAK", "UYUMAK", "UYANMAK", "ARAMAK", "UYGULAMA", "ANAOKULU", "HAFTASONU", "ŞİMŞEK",
  "MERDİVEN", "ASANSÖR", "PAZARLIK", "KARTPOSTAL", "KALABALIK", "TEKERLEK", "DOĞUMGÜNÜ",
  "SUSUZLUK", "GÖZYAŞI", "SEVİMLİ", "KÜKREME", "TİLKİ", "PENGUEN", "YUMURTA", "MANDALİNA",
  "DONDURMA", "ÇİKOLATA", "SALATALIK", "KAPLUMBAĞA", "TELEVİZYON", "BİLGİSAYAR", "ÖĞRETMEN",
  "ÖĞRENCİ", "HELİKOPTER", "GÖKKUŞAĞI", "PAZARTESİ", "ÇARŞAMBA", "PERŞEMBE", "CUMARTESİ",
  "KAHVERENGİ", "MUTLULUK", "MÜHENDİS", "MÜZİSYEN", "FUTBOLCU", "BASKETBOL", "VOLEYBOL",
  "KÜTÜPHANE", "HAVAALANI", "BELEDİYE", "CUMHURİYET", "ALIŞVERİŞ", "FOTOĞRAF", "ÜNİVERSİTE",
  "TEREYAĞI", "BALKABAĞI", "KÖPEKBALIĞI", "KARDANADAM", "DİKDÖRTGEN", "ANSİKLOPEDİ",
  "TAHTEREVALLİ", "ESİNTİ", "YÜKSEK", "KIRMIZI", "GÜNEŞ", "EKMEK", "SALI", "CUMA", "PAZAR",
  "ADAM", "TAKIM", "DALGA", "RESİM", "HARİTA", "ZOR", "KASK", "LİMAN", "LEZZET",
] as const;

/** Extra well-known words to keep boards varied without obscure catalog terms. */
const EXTRA_EVERYDAY_MORE = [
  "CAN", "ÇOK", "YOK", "VAR", "BEN", "SEN", "BİZ", "SİZ", "TAM", "SON", "ALT", "ÜST",
  "CAM", "KAN", "BUZ", "CEP", "ÇÖL", "ÇÖP", "ÇİT", "DAM", "DİN", "DON", "DUA", "DÜN",
  "DÜŞ", "FAL", "FEN", "GAZ", "HAL", "HAN", "HAT", "HEP", "HİÇ", "HÜR", "İLK", "JET",
  "KAS", "KAT", "KIR", "KÖR", "KÜP", "LAF", "MAL", "NET", "NOT", "NUR", "OTO", "PAY",
  "PEK", "SAĞ", "SAZ", "SEL", "SET", "SIR", "SOL", "SÖZ", "SUÇ", "ŞAL", "ŞEF", "ŞEN",
  "ŞIŞ", "ŞOK", "TAT", "TEK", "TEL", "TEN", "TER", "TEZ", "TOK", "TÜR", "ÜYE", "YAS",
  "YEM", "YER", "YEL", "YÜK", "ZAR", "ZAM", "ARKA", "ORTA", "BOŞ", "EVET", "HAYIR",
  "BELKİ", "ÇÜNKÜ", "AMA", "SIRA", "YAZI", "OKUMA", "HESAP", "MATEMATİK", "TÜRKÇE",
  "İNGİLİZCE", "COĞRAFYA", "BEDEN", "BOYAMA", "ÇİZİM", "CETVEL", "PERGEL", "KALEMTRAŞ",
  "TEBEŞİR", "PROJEKTÖR", "LABORATUVAR", "DENEY", "TÜP", "MIKNATIS", "BÜYÜTEÇ", "KÜRE",
  "ATLAS", "ANNEANNE", "BABANNE", "DÜNÜR", "GELİN", "DAMAT", "ENİŞTE", "YENGE", "BACANAK",
  "GÖRÜMCE", "KAYINVALİDE", "KAYINPEDER", "ÇOCUKLUK", "GENÇLİK", "YAŞLILIK", "DOĞUM",
  "NİŞAN", "SÜNNET", "MEZAR", "CENAZE", "MİSAFİR", "KOMŞU", "ARKADAŞLIK", "SEVGİLİ",
  "KARI", "KOCA", "SOYADI", "İSİM", "LAKAP", "LÜTFEN", "TEŞEKKÜR", "RİCA", "ÖZÜR",
  "MERHABA", "SELAM", "HOŞÇAKAL", "GÖRÜŞÜRÜZ", "AFİYET", "BAŞARILAR", "PASTANE", "AKTAR",
  "KIRTASİYE", "OYUNCAKÇI", "ÇİÇEKÇİ", "KUYUMCU", "TERZİ", "BERBER", "KUAFÖR", "ECZACI",
  "OPTİK", "TAMİRCİ", "TESİSATÇI", "ELEKTRİKÇİ", "BOYACI", "MARANGOZ", "DEMİRCİ",
  "FIRINCI", "SÜTÇÜ", "BALIKÇI", "BAHÇIVAN", "ASKER", "PİLOT", "GARSON", "HOSTES",
  "MİMAR", "SAVCI", "İTFAİYECİ", "POSTACI", "TAKSİCİ", "KAMYONCU", "ESNAF", "SATICI",
  "MEMUR", "İŞÇİ", "PATRON", "MÜŞTERİ", "GAZETECİ", "SUNUCU", "YÖNETMEN", "ŞARKICI",
  "DANSÇI", "ŞAİR", "ASTRONOT", "ANTRENÖR", "KALECİ", "FORVET", "TEKNİK", "TARAFTAR",
  "FİLE", "POTA", "RAKET", "BADMİNTON", "ATLAMA", "BOKS", "JUDO", "KARATE", "PATEN",
  "BİNİCİLİK", "YELKEN", "KÜREK", "OKÇULUK", "CİMNASTİK", "YOGA", "PİLATES", "HALTER",
  "KORNER", "FAUL", "OFSAYT", "SÜRE", "DEVRE", "UZATMA", "SERİ", "GRUP", "FİNAL",
  "MARATON", "OLİMPİYAT", "MİLLİ", "BİTKİ", "KARA", "VADİ", "DERE", "KAYA", "SAHİL",
  "YOSUN", "ZİRVE", "YAMAÇ", "TABİAT", "VOLKAN", "MEVSİM", "MAĞARA", "KUMSAL", "MERCAN",
  "YILDIRIM", "ŞELALE", "KENT", "KULE", "YAYA", "YOLCU", "SEFER", "DÜKKAN", "TRAFİK",
  "MAHALLE", "TRAMVAY", "GÖKDELEN", "OTOPARK", "AKIL", "ZEKİ", "ÇÖZÜM", "DENGE",
  "GİZEM", "BEYİN", "MERAK", "BİLİM", "KAVRAM", "HAFIZA", "EĞİTİM", "MANTIK", "FORMÜL",
  "DİKKAT", "ANALİZ", "BİLİNÇ", "DÜŞÜNCE", "ÖĞRENME", "FELSEFE", "EDEBİYAT", "MARS",
  "FÜZE", "UYDU", "EVREN", "GEZEGEN", "SİSTEM", "GALAKSİ", "ATMOSFER", "TELESKOP",
  "TARİF", "TUZLU", "BÖREK", "IZGARA", "MEZE", "HELVA", "MANTI", "KAVURMA", "İÇECEK",
  "BAKLAVA", "MENEMEN", "ENGİNAR", "DOLMA", "SARMA", "KIZARTMA", "PUSULA", "SANAYİ",
  "BULVAR", "ÖLÇÜ", "İZİN", "RİSK", "TEORİ", "PARÇA", "ORTANCA", "İMECE", "GONCA",
  "KARINCA", "GÜVENCE", "EĞLENCE", "BİLMECE", "ÇEKMECE", "AÇIK", "KAPALI", "TEMİZ",
  "KİRLİ", "ZENGİN", "FAKİR", "GENÇ", "YAŞLI", "GÜÇLÜ", "ZAYIF", "KALIN", "İNCE",
  "YAKIN", "UZAK", "ERKEN", "GEÇ", "FAZLA", "EKSİK", "YARIM", "ÇİFT", "SAĞLAM",
  "YORGUN", "DİNGİN", "SABIRLI", "ACELECİ", "CESUR", "KORKAK", "CÖMERT", "CİMRİ",
  "KİBİRLİ", "DÜRÜST", "YALANCI", "ÇALIŞKAN", "TEMBEL", "AKILLI", "ŞANSLI", "ŞANSSIZ",
  "ACI", "EKŞİ", "TATSIZ", "LEZZETLİ", "KOKULU", "PARLAK", "KAYGAN", "PÜRÜZLÜ", "DÜZ",
  "EĞRİ", "YUVARLAK", "SİVRİ", "KÖŞELİ", "DERİN", "SIĞ", "AĞIR", "HAFİF", "PAHALI",
  "UCUZ", "BEDAVA", "MÜMKÜN", "İMKANSIZ", "GEREKLİ", "GEREKSİZ", "ÖNEMLİ", "SADE",
  "KARMAŞIK", "BELİRGİN", "GİZLİ", "YASAL", "YASAK", "SERBEST", "MEŞGUL", "HAZIR",
  "TAMAM", "DEVAM", "BOĞAZ", "OMUZ", "DİRSEK", "DİZ", "TOPUK", "TIRNAK", "KAŞ",
  "KİRPİK", "ALIN", "ÇENE", "BOYUN", "SIRT", "BEL", "GÖĞÜS", "KARIN", "MİDE",
  "AKCİĞER", "BÖBREK", "KARACİĞER", "DAMAR", "KEMİK", "DERİ", "NEFES", "SEVİYE",
  "HAPŞIRIK", "GRİP", "NEZLE", "HAP", "ŞURUP", "AŞI", "PANSUMAN", "ALÇI", "AMELİYAT",
  "KONTROL", "MUAYENE", "REÇETE", "KLİNİK", "AMBULANS", "SERUM", "TANSİYON", "NABIZ",
  "KAZAK", "HIRKA", "YELEK", "EŞARP", "KEMER", "KRAVAT", "PİJAMA", "ŞORT", "TERLİK",
  "SANDALET", "ELBİSE", "KABAN", "PALTO", "YAĞMURLUK", "YÜZÜK", "KOLYE", "KÜPE",
  "BİLEZİK", "BROŞ", "DEVE", "EŞEK", "SIĞIR", "DOMUZ", "HİNDİ", "LEYLEK", "BAYKUŞ",
  "KARGA", "MARTI", "PELİKAN", "FLAMİNGO", "AHTAPOT", "KARİDES", "İSTAKOZ", "MİDYE",
  "BALİNA", "KERTENKELE", "BUKALEMUN", "SALYANGOZ", "SİNEK", "SİVRİSİNEK", "BÖCEK",
  "ÖRÜMCEK", "AKREP", "YARASA", "KÖSTEBEK", "KIRPI", "ÇAKAL", "LEOPAR", "GERGEDAN",
  "ZÜRAFA", "KOALA", "KANGURU", "PANDA", "GÜVE", "ÇEKİRGE", "SOLUCAN", "LAHMACUN",
  "PİDE", "KUMPİR", "DÖNER", "DÜRÜM", "CİĞER", "KOKOREÇ", "İSKENDER", "CACIK",
  "TURŞU", "PEKMEZ", "TAHİN", "BOZA", "SALEP", "KÜNEFE", "KADAYIF", "SÜTLAÇ", "AŞURE",
  "LOKUM", "PİŞMANİYE", "CEZERYE", "LOKMA", "GOFRET", "CİPS", "KRAKER", "BONBON",
  "SAKIZ", "KREP", "PANKEK", "KURABİYE", "KEK", "TART", "PROFİTEROL", "TİRAMİSU",
  "FINDIK", "CEVİZ", "BADEM", "LEBLEBİ", "HURMA", "LİMON", "KİVİ", "ANANAS", "MANGO",
  "AVOKADO", "AHUDUDU", "BÖĞÜRTLEN", "VİŞNE", "ERİK", "AYVA", "PATLICAN", "KABAK",
  "PIRASA", "MARUL", "ROKA", "MAYDANOZ", "NANE", "FESLEĞEN", "KEKİK", "KİMYON",
  "KARABİBER", "PULBİBER", "TARÇIN", "ZENCEFİL", "ZERDEÇAL", "KARBONAT", "MAYA",
  "KEFİR", "KAYMAK", "SİRKE", "KETÇAP", "MAYONEZ", "HARDAL", "EZME", "HUMUS",
  "FALAFEL", "GÖZLEME", "KATMER", "LAZANYA", "SPAGETTİ", "ERİŞTE", "ŞEHRİYE",
  "EZOGELİN", "YAYLA", "TARHANA", "İŞKEMBE", "YİRMİ", "OTUZ", "KIRK", "ELLİ",
  "ALTMIŞ", "YETMİŞ", "SEKSEN", "DOKSAN", "MİLYON", "MİLYAR", "SIFIR", "ÇEYREK",
  "ÖNCE", "SONRA", "ŞİMDİ", "BUGÜN", "YARIN", "ASIR", "ÇAĞ", "SANİYE", "DAKİKA",
  "İKİNDİ", "ŞAFAK", "VAKİT", "ZAMAN", "BANT", "ZIMBA", "ATAÇ", "DOSYA", "KLASÖR",
  "KARTON", "MUKAVVA", "AJANDA", "TAKVİM", "DÜRBÜN", "YAZICI", "TARAYICI", "HOPARLÖR",
  "MİKROFON", "KABLO", "DÜĞME", "BATARYA", "MODEM", "VİDEO", "ARAMA", "GÖRÜŞME",
  "YAYIN", "KANAL", "DİZİ", "BELGESEL", "HABER", "OPERA", "BALET", "KONSER",
  "FESTİVAL", "SERGİ", "GALERİ", "GİŞE", "MİNİBÜS", "METROBÜS", "VAPUR", "FERİBOT",
  "YAT", "SANDAL", "DOLMUŞ", "KAMYONET", "MOTOSİKLET", "KAYKAY", "PUSET", "İSKELE",
  "TERMİNAL", "KALDIRIM", "GEÇİT", "BENZİNLİK", "BENZİN", "MAZOT", "ELEKTRİK",
  "LASTİK", "DİREKSİYON", "FREN", "VİTES", "KLİMA", "SİNYAL", "KORNA", "BAGAJ",
  "KAPUT", "PLAKA", "RUHSAT", "EHLİYET", "CEZA", "RADAR", "KAZA", "TAMİR", "SERVİS",
  "KURUŞ", "BANKNOT", "KREDİ", "BORÇ", "FAİZ", "MAAŞ", "ÜCRET", "PEŞİN", "TAKSİT",
  "FATURA", "MAKBUZ", "VERGİ", "BÜTÇE", "BİRİKİM", "YATIRIM", "KAZANÇ", "ZARAR",
  "TASARRUF", "HARCAMA", "REYON", "SEPET", "KUYRUK", "ÖDEME", "NAKİT", "APARTMAN",
  "VİLLA", "KÖŞK", "GECEKONDU", "KARAVAN", "YURT", "MOTEL", "PANSİYON", "TUVALET",
  "ANTRE", "KORİDOR", "TERAS", "KİLER", "ÇAMAŞIRHANE", "DÖŞEME", "PARKE", "FAYANS",
  "MOBİLYA", "KANEPE", "SEHPA", "GARDİROP", "BÜFE", "ÇARŞAF", "BATTANİYE", "AVİZE",
  "ABİDE", "PRİZ", "KALORİFER", "SOBA", "KOMBİ", "ŞOFBEN", "ASPİRATÖR", "ÜTÜ",
  "SÜPÜRGE", "MİKSER", "BLENDER", "ÇAYDANLIK", "CEZVE", "GÜVEÇ", "KEVGİR", "KEPÇE",
  "KASE", "FİNCAN", "SÜRAHİ", "SÜZGEÇ", "TEPSİ", "SALAM", "PASTIRMA", "KARNIYARIK",
  "TANDIR", "ÇİĞKÖFTE", "İÇLİKÖFTE", "SUBÖREĞİ", "KOLBÖREĞİ", "ADALET", "HUKUK",
  "MAHKEME", "KARAKOL", "HAPİSHANE", "CEZAEVİ", "VALİLİK", "KAYMAKAMLIK", "MUHTAR",
  "BAŞKAN", "MİLLETVEKİLİ", "SEÇİM", "SANDIK", "DEMOKRASİ", "İSTİKLAL", "ANAYASA",
  "HAK", "ÖZGÜRLÜK", "EŞİTLİK", "KARDEŞLİK", "SAYGI", "HOŞGÖRÜ", "SABIR", "CESARET",
  "İNANÇ", "GÜVEN", "SADAKAT", "DÜRÜSTLÜK", "ÇALIŞMA", "EMEKLİLİK", "MESLEK",
  "KARIYER", "ORTAOKUL", "KREŞ", "KAMPÜS", "BÖLÜM", "PROJE", "SUNUM", "KARNE",
  "DİPLOMA", "MEZUNİYET", "TÖREN", "GEZİ", "TUR", "REHBER", "REZERVASYON", "SODA",
  "ŞALGAM", "KOLA", "GAZOZ", "TÜRKKAHVESİ", "FİLTRE", "HAMLE", "İPUCU", "TEBRİKLER",
  "BERABERE", "YENİDEN", "AYARLAR", "KURALLAR", "DAVET", "ŞİFRE", "GİRİŞ", "KAYIT",
  "ÇIKIŞ", "SONUÇ", "ÖDÜL", "GÖREV", "GÜNLÜK", "HAFTALIK", "SIRALAMA", "PROFİL",
  "AVATAR", "UĞURBÖCEĞİ", "KURUFASULYE", "ZEYTİNYAĞI", "AYÇİÇEĞİ", "KREDİKARTI",
  "SIRTÇANTASI", "GÜNEŞKREMİ", "MİNERALSİSU", "ÇALARSAAT", "YAĞMURLUK", "SİVRİSİNEK",
  "KERTENKELE", "SALYANGOZ", "KAYINVALİDE", "KAYINPEDER", "ARKADAŞLIK", "LABORATUVAR",
  "ELEKTRİKÇİ", "TESİSATÇI", "MOTOSİKLET", "DİREKSİYON", "ÇAMAŞIRHANE", "KARNIYARIK",
  "İMAMBAYILDI", "HÜNKARBEĞENDİ", "MİLLETVEKİLİ", "REZERVASYON", "OLİMPİYAT",
  "CİMNASTİK", "BADMİNTON", "FLAMİNGO", "GERGEDAN", "BUKALEMUN", "PROFİTEROL",
  "TİRAMİSU", "PİŞMANİYE", "KAYMAKAMLIK", "HAPİSHANE", "EMEKLİLİK", "MEZUNİYET",
  "DEMOKRASİ", "ÖZGÜRLÜK", "DÜRÜSTLÜK", "KARDEŞLİK", "BİNİCİLİK", "TELESKOP",
  "ATMOSFER", "EDEBİYAT", "FELSEFE", "MATEMATİK", "İNGİLİZCE", "COĞRAFYA",
  "KIRTASİYE", "OYUNCAKÇI", "İTFAİYECİ", "GAZETECİ", "YÖNETMEN", "ANTRENÖR",
  "ŞAMPİYONLUK", "TARAFTAR", "PENALTI", "MARATON", "YILDIRIM", "GÖKDELEN",
  "MAHALLE", "TRAMVAY", "OTOPARK", "BULVAR", "KALDIRIM", "BENZİNLİK", "EHLİYET",
  "BANKNOT", "TASARRUF", "APARTMAN", "PANSİYON", "GARDİROP", "KALORİFER", "ASPİRATÖR",
  "ÇAYDANLIK", "KARNIYARIK", "ÇİĞKÖFTE", "İÇLİKÖFTE", "VALİLİK", "ANAYASA",
  "İSTİKLAL", "ORTAOKUL", "DİPLOMA", "BELGESEL", "FESTİVAL", "METROBÜS", "FERİBOT",
  "KAMYONET", "TERMİNAL", "AMBULANS", "MUAYENE", "AMELİYAT", "AKCİĞER", "KARACİĞER",
  "SANDALET", "YAĞMURLUK", "BİLEZİK", "PELİKAN", "AHTAPOT", "KARİDES", "İSTAKOZ",
  "BALİNA", "YARASA", "KÖSTEBEK", "KANGURU", "LAHMACUN", "KOKOREÇ", "İSKENDER",
  "KADAYIF", "KURABİYE", "AVOKADO", "AHUDUDU", "BÖĞÜRTLEN", "MAYDANOZ", "FESLEĞEN",
  "KARABİBER", "ZENCEFİL", "ZERDEÇAL", "MAYONEZ", "FALAFEL", "SPAGETTİ", "TARHANA",
  "İŞKEMBE", "KRONOMETRE", "HOPARLÖR", "MİKROFON", "BATARYA", "KÜTÜPHANE",
  "HELİKOPTER", "MOTOSİKLET", "DİREKSİYON", "ÇAMAŞIRHANE", "BATTANİYE",
  "PASTIRMA", "CEZAEVİ", "SADAKAT", "KARIYER", "REZERVASYON", "TÜRKKAHVESİ",
  "BERABERE", "SIRALAMA", "TEBRİKLER", "GÖRÜŞÜRÜZ", "BAŞARILAR", "TEŞEKKÜR",
  "MERHABA", "HOŞÇAKAL", "LÜTFEN", "BELKİ", "ÇÜNKÜ", "HAZIRAN", "AĞUSTOS",
  "TEMMUZ", "EYLÜL", "KASIM", "ARALIK", "ŞUBAT", "MAYIS", "MART", "EKİM",
  "MİLYON", "MİLYAR", "SANİYE", "DAKİKA", "İKİNDİ", "BUGÜN", "YARIN", "ŞİMDİ",
  "ÖNCE", "SONRA", "ÇEYREK", "SIFIR", "YİRMİ", "OTUZ", "KIRK", "ELLİ", "ALTMIŞ",
  "YETMİŞ", "SEKSEN", "DOKSAN", "PINGPONG", "CİMNASTİK", "OKÇULUK", "YELKEN",
  "KÜREK", "HALTER", "KORNER", "OFSAYT", "UZATMA", "DEVRE", "MİLLİ", "TABİAT",
  "VOLKAN", "MEVSİM", "MAĞARA", "KUMSAL", "MERCAN", "ŞELALE", "YAMAÇ", "ZİRVE",
  "YOSUN", "SAHİL", "VADİ", "DERE", "BİTKİ", "GÖKDELEN", "MAHALLE", "OTOPARK",
  "TRAMVAY", "YOLCU", "SEFER", "DÜKKAN", "KULE", "KENT", "HAFIZA", "KAVRAM",
  "FORMÜL", "ANALİZ", "BİLİNÇ", "ÖĞRENME", "GEZEGEN", "GALAKSİ", "UYDU", "FÜZE",
  "EVREN", "MARS", "ENGİNAR", "MENEMEN", "BAKLAVA", "IZGARA", "KAVURMA", "HELVA",
  "ORTANCA", "GONCA", "İMECE", "PARÇA", "ÇEKMECE", "BİLMECE", "EĞLENCE", "GÜVENCE",
  "ACELECİ", "SABIRLI", "DİNGİN", "YORGUN", "SAĞLAM", "KÖŞELİ", "YUVARLAK",
  "PÜRÜZLÜ", "KAYGAN", "LEZZETLİ", "TATSIZ", "ŞANSSIZ", "ÇALIŞKAN", "YALANCI",
  "DÜRÜST", "KİBİRLİ", "CİMRİ", "CÖMERT", "KORKAK", "CESUR", "TEMBEL", "AKILLI",
  "GEREKLİ", "GEREKSİZ", "İMKANSIZ", "MÜMKÜN", "BEDAVA", "PAHALI", "BELİRGİN",
  "KARMAŞIK", "SERBEST", "MEŞGUL", "HAPŞIRIK", "PANSUMAN", "MUAYENE", "REÇETE",
  "KLİNİK", "SERUM", "TANSİYON", "NABIZ", "HIRKA", "EŞARP", "KRAVAT", "PİJAMA",
  "TERLİK", "KABAN", "PALTO", "YÜZÜK", "KOLYE", "BROŞ", "LEYLEK", "BAYKUŞ",
  "KARGA", "MARTI", "MİDYE", "ÇAKAL", "LEOPAR", "KOALA", "PANDA", "GÜVE",
  "ÇEKİRGE", "SOLUCAN", "PİDE", "KUMPİR", "DÜRÜM", "CİĞER", "CACIK", "TURŞU",
  "PEKMEZ", "TAHİN", "BOZA", "SALEP", "KÜNEFE", "SÜTLAÇ", "AŞURE", "LOKUM",
  "CEZERYE", "LOKMA", "GOFRET", "CİPS", "KRAKER", "BONBON", "SAKIZ", "KREP",
  "PANKEK", "KEK", "TART", "FINDIK", "CEVİZ", "BADEM", "LEBLEBİ", "HURMA",
  "ANANAS", "MANGO", "KİVİ", "VİŞNE", "ERİK", "AYVA", "PATLICAN", "KABAK",
  "PIRASA", "MARUL", "ROKA", "NANE", "KEKİK", "KİMYON", "TARÇIN", "KARBONAT",
  "MAYA", "KEFİR", "KAYMAK", "SİRKE", "KETÇAP", "HARDAL", "EZME", "HUMUS",
  "GÖZLEME", "KATMER", "LAZANYA", "ERİŞTE", "ŞEHRİYE", "EZOGELİN", "YAYLA",
  "MUKAVVA", "AJANDA", "TAKVİM", "DÜRBÜN", "YAZICI", "TARAYICI", "MODEM",
  "VİDEO", "ARAMA", "YAYIN", "KANAL", "DİZİ", "OPERA", "BALET", "KONSER",
  "SERGİ", "GALERİ", "GİŞE", "MİNİBÜS", "VAPUR", "YAT", "SANDAL", "DOLMUŞ",
  "KAYKAY", "PUSET", "İSKELE", "GEÇİT", "BENZİN", "MAZOT", "FREN", "VİTES",
  "SİNYAL", "KORNA", "BAGAJ", "KAPUT", "PLAKA", "RUHSAT", "RADAR", "KAZA",
  "TAMİR", "SERVİS", "KURUŞ", "KREDİ", "BORÇ", "FAİZ", "MAAŞ", "ÜCRET",
  "PEŞİN", "TAKSİT", "FATURA", "MAKBUZ", "VERGİ", "BÜTÇE", "BİRİKİM",
  "YATIRIM", "KAZANÇ", "ZARAR", "HARCAMA", "REYON", "SEPET", "KUYRUK",
  "ÖDEME", "NAKİT", "VİLLA", "KÖŞK", "KARAVAN", "MOTEL", "TUVALET", "ANTRE",
  "KORİDOR", "TERAS", "KİLER", "DÖŞEME", "PARKE", "FAYANS", "MOBİLYA",
  "KANEPE", "SEHPA", "ÇARŞAF", "AVİZE", "PRİZ", "SOBA", "KOMBİ", "ŞOFBEN",
  "ÜTÜ", "SÜPÜRGE", "MİKSER", "BLENDER", "CEZVE", "GÜVEÇ", "KEVGİR", "KEPÇE",
  "KASE", "FİNCAN", "SÜRAHİ", "SÜZGEÇ", "TEPSİ", "SALAM", "TANDIR", "HUKUK",
  "MAHKEME", "KARAKOL", "MUHTAR", "BAŞKAN", "SEÇİM", "SANDIK", "HAK",
  "EŞİTLİK", "SAYGI", "HOŞGÖRÜ", "SABIR", "CESARET", "İNANÇ", "GÜVEN",
  "ÇALIŞMA", "MESLEK", "KREŞ", "KAMPÜS", "PROJE", "KARNE", "TÖREN", "GEZİ",
  "REHBER", "SODA", "ŞALGAM", "KOLA", "GAZOZ", "HAMLE", "İPUCU", "YENİDEN",
  "AYARLAR", "KURALLAR", "DAVET", "ŞİFRE", "GİRİŞ", "KAYIT", "ÇIKIŞ",
  "SONUÇ", "ÖDÜL", "GÖREV", "GÜNLÜK", "PROFİL", "AVATAR", "MÜDÜR",
  "KİTAPLIK", "KALEMLİK", "HESAP", "SIRA", "YAZI", "OKUMA", "BEDEN",
  "BOYAMA", "ÇİZİM", "CETVEL", "PERGEL", "TEBEŞİR", "DENEY", "TÜP",
  "MIKNATIS", "BÜYÜTEÇ", "KÜRE", "ATLAS", "GELİN", "DAMAT", "ENİŞTE",
  "YENGE", "DOĞUM", "NİŞAN", "MEZAR", "CENAZE", "MİSAFİR", "KOMŞU",
  "SEVGİLİ", "KARI", "KOCA", "İSİM", "LAKAP", "RİCA", "ÖZÜR", "SELAM",
  "AFİYET", "PASTANE", "AKTAR", "TERZİ", "BERBER", "KUAFÖR", "ECZACI",
  "OPTİK", "TAMİRCİ", "BOYACI", "MARANGOZ", "DEMİRCİ", "FIRINCI", "ASKER",
  "PİLOT", "GARSON", "HOSTES", "MİMAR", "POSTACI", "ESNAF", "SATICI",
  "MEMUR", "İŞÇİ", "PATRON", "MÜŞTERİ", "SUNUCU", "ŞARKICI", "DANSÇI",
  "ŞAİR", "KALECİ", "FORVET", "TEKNİK", "FİLE", "POTA", "RAKET", "ATLAMA",
  "BOKS", "JUDO", "KARATE", "PATEN", "YOGA", "PİLATES", "FAUL", "SÜRE",
  "SERİ", "GRUP", "FİNAL", "MİLLİ", "KARA", "KAYA", "YAYA", "AKIL",
  "ZEKİ", "ÇÖZÜM", "DENGE", "GİZEM", "BEYİN", "MERAK", "BİLİM", "DİKKAT",
  "TARİF", "TUZLU", "BÖREK", "MEZE", "MANTI", "DOLMA", "SARMA", "PUSULA",
  "SANAYİ", "ÖLÇÜ", "İZİN", "RİSK", "TEORİ", "AÇIK", "KAPALI", "TEMİZ",
  "KİRLİ", "ZENGİN", "FAKİR", "GENÇ", "YAŞLI", "GÜÇLÜ", "ZAYIF", "KALIN",
  "İNCE", "YAKIN", "UZAK", "ERKEN", "GEÇ", "FAZLA", "EKSİK", "YARIM",
  "ÇİFT", "ACI", "EKŞİ", "PARLAK", "DÜZ", "EĞRİ", "SİVRİ", "DERİN",
  "SIĞ", "AĞIR", "HAFİF", "UCUZ", "SADE", "GİZLİ", "YASAL", "YASAK",
  "TAMAM", "DEVAM", "BOĞAZ", "OMUZ", "DİRSEK", "DİZ", "TOPUK", "TIRNAK",
  "KAŞ", "KİRPİK", "ALIN", "ÇENE", "BOYUN", "SIRT", "BEL", "GÖĞÜS",
  "KARIN", "MİDE", "DAMAR", "KEMİK", "DERİ", "NEFES", "SEVİYE", "GRİP",
  "NEZLE", "ŞURUP", "AŞI", "ALÇI", "KONTROL", "NABIZ", "KAZAK", "YELEK",
  "KEMER", "ŞORT", "DEVE", "EŞEK", "SIĞIR", "DOMUZ", "HİNDİ", "DÖNER",
  "LİMON", "SOS", "AÇMA", "TUR", "BANT", "ATAÇ", "DOSYA", "KLASÖR",
  "HABER", "LASTİK", "KLİMA", "CEZA", "HIZ", "AVM",
] as const;

function getBoardsForLength(len: number): number[] {
  if (len <= 6) return [4, 6, 8, 10];
  if (len <= 8) return [6, 8, 10];
  if (len <= 10) return [8, 10];
  return [10];
}

const THEME_ENTRIES: WordEntry[] = (Object.entries(THEME_WORDS) as [Exclude<WordTheme, "general">, readonly string[]][]).flatMap(
  ([theme, words]) =>
    words.filter(isValidCatalogWord).map((word) => ({
      word,
      difficulty: difficultyForLength(word.length),
      boards: getBoardsForLength(word.length),
      tags: [theme],
      weight: 4,
    })),
);

const EVERYDAY_SET = new Set(
  [...EXTRA_EVERYDAY_WORDS, ...EXTRA_EVERYDAY_MORE, ...NATURAL_INFINITIVES].filter(isValidCatalogWord),
);

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
      difficulty: difficultyForLength(verb.length),
      boards: getBoardsForLength(verb.length),
      tags: ["general"],
      weight: 3,
    });
  }
}

for (const word of EVERYDAY_SET) {
  const existing = wordMap.get(word);
  if (existing) {
    wordMap.set(word, {
      ...existing,
      difficulty: difficultyForLength(word.length),
      weight: Math.max(existing.weight, 12),
    });
  } else {
    wordMap.set(word, {
      word,
      difficulty: difficultyForLength(word.length),
      boards: getBoardsForLength(word.length),
      tags: ["general"],
      weight: 12,
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
  const familiar = specific.filter((entry) => EVERYDAY_SET.has(entry.word));
  if (familiar.length >= 30) return familiar;
  if (specific.length >= 30) return specific;
  return WORD_CATALOG_DATA.words.filter((entry) => entry.word.length <= maximumLength);
}

export function catalogWordsForTheme(size: 4 | 6 | 8 | 10, theme: WordTheme, maximumLength: number = Math.max(size, 12)) {
  const boardWords = catalogWordsForBoard(size, maximumLength);
  if (theme === "general") return boardWords;
  const themedWords = new Set(THEME_WORDS[theme]);
  const familiarThemed = boardWords.filter((entry) => themedWords.has(entry.word) || entry.tags.includes(theme));
  if (familiarThemed.length >= 3) return familiarThemed;
  const catalogThemed = WORD_CATALOG[size].filter(
    (entry) => entry.word.length <= maximumLength && (themedWords.has(entry.word) || entry.tags.includes(theme)),
  );
  return catalogThemed.length >= 3 ? catalogThemed : boardWords;
}
