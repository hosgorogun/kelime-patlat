import { normalizeTr } from "./tr-utils";

/**
 * Kelime Patlat - Türkçe Argo & Uygunsuz İçerik Filtresi (Profanity Filter)
 * 
 * Kullanıcı adları, takma adlar ve oda sohbetleri için;
 * - Harf ikameleri (leetspeak: 0->o, 1->i, @->a, 3->e, 5->s vb.)
 * - Araya nokta, boşluk veya sembol koyma hileleri (a.m.k, s-i-k, vb.)
 * - Kök ve ek tabanlı Türkçe argo / küfür eşleştirmeleri
 * kontrol edilir.
 */

// Temel Türkçe uygunsuz/argo kök ve kalıpları
const BANNED_PATTERNS: RegExp[] = [
  // Açık küfür kökleri ve varyasyonları (noktalı/boşluklu/harf ikameli dahil)
  /(?:^|[^a-z0-9çğıöşü])(a[\W_]*m[\W_]*[kq]|aq|amk)(?:$|[^a-z0-9çğıöşü])/i,
  /\b(o[çc]|o[\W_]*[çc]|o\.c|orospu|orosp|orosbu|orospucocugu|orospucocu)\b/i,
  /\b(pi[çc]|pi[\W_]*[çc]|pic|piçlik)\b/i,
  /\b(sik|s[iı1]k[iı1]m|s[iı1]k[iı1]s|s[iı1]k[eé]r|s[iı1]k[iı1]c[iı]|s[iı1]k[iı1]l|s[iı1]k[t|d][iı1]r|yarrak|yarr[a@]k|y[a@]rr[a@]k)\b/i,
  /\b(g[oö0]t|g[oö0]t[uü]n[uü]|g[oö0]to[sş]|g[oö0]tv[eé]r[eé]n|g[oö0]tlelek)\b/i,
  /\b(am[cç][iı]k|amc[iı]k|amguard|amcigi)\b/i,
  /\b(d[a@]ss[a@]k|da[sş][sş]ak|taşşak|tassak)\b/i,
  /\b(meme|memeler|pipi|yarrak|sikis|sikiş|porno|porn|hentai|nsfw|sikiş)\b/i,
  /\b(kahpe|fahi[sş]e|kaltak|yosma|sürtük|surtuk)\b/i,
  /\b(ibne|ibneler|pu[sş]t|puşt|gavat|kavat)\b/i,
  /\b(pezevenk|pezevenkler|pezo)\b/i,
];

// Leetspeak ve harf ikame dönüşümü
function normalizeLeetspeak(input: string): string {
  return input
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/\$/g, "s");
}

/**
 * Verilen metnin (kullanıcı adı, isim veya mesaj) küfür/argo içerip içermediğini denetler.
 * Türkçe normalizasyon ve harf hileleri (leetspeak) çözülerek kontrol edilir.
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== "string") return false;

  const raw = text.trim();
  if (raw.length === 0) return false;

  // 1. Türkçe harf normalizasyonu (İ->i, I->ı, vb.)
  const trNormalized = normalizeTr(raw);

  // 2. Leetspeak çözümlemesi (0->o, @->a vb.)
  const leetNormalized = normalizeLeetspeak(trNormalized);

  // 3. Aradaki sembolleri/noktaları temizleyen sıkıştırılmış versiyon (a.m.k -> amk)
  const compactNormalized = leetNormalized.replace(/[\s\-_.\+*#~,;:!?]+/g, "");

  // Tüm varyasyonları kontrol et
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(raw)) return true;
    if (pattern.test(trNormalized)) return true;
    if (pattern.test(leetNormalized)) return true;
    if (pattern.test(compactNormalized)) return true;
  }

  // Bitişik / sıkıştırılmış açık küfür kelimeleri kontrolü
  const compactWords = [
    "amk", "aq", "orospu", "orospucocugu", "pic", "piç", "sikik", "sikim", "siktim",
    "sikis", "sikiş", "yarrak", "yarak", "gotos", "götos", "gavat", "ibne", "pezevenk",
    "amcik", "amcık", "dassak", "daşşak", "puşt", "pust", "kahpe", "surtuk", "sürtük"
  ];

  for (const word of compactWords) {
    if (compactNormalized === word || compactNormalized.includes(word)) {
      // Kelime bazlı false positive koruması:
      // Örneğin "pamuk" kelimesi "amk" içerir gibi görünmemeli
      if (word === "amk" || word === "aq") {
        if (compactNormalized === word) return true;
        // Eğer ayrı bir belirteç olarak geçiyorsa
        const parts = leetNormalized.split(/[\s\-_.\+*#~,;:!?]+/);
        if (parts.includes(word)) return true;
      } else {
        return true;
      }
    }
  }

  return false;
}

/**
 * Uygunsuz kelimeleri yıldızlar (sansürler)
 */
export function cleanProfanity(text: string): string {
  if (!text) return "";
  let cleaned = text;
  for (const pattern of BANNED_PATTERNS) {
    cleaned = cleaned.replace(pattern, (match) => "*".repeat(match.length));
  }
  return cleaned;
}
